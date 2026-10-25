#!/usr/bin/env python3
"""
AniSora DB Enricher
High-concurrency streaming processor for Anime Offline Database JSONL.
Enriches anime entries with HiAnime IDs and unique cryptographically secure AniSora IDs.

Features:
- High concurrency with aiohttp and adaptive rate limiting / backoff.
- Fast localdb/sync endpoint integration (title + synonyms search) with fallback.
- Database-backed SQLite checkpointing (WAL mode) for 100% crash recovery and resume.
- Bounded reorder buffer: streams real-time writes while guaranteeing original file order.
- Unique 9-digit AniSora IDs with database-level uniqueness enforcement.
- Query result caching to avoid duplicate searches.
- Live real-time terminal progress dashboard (RPS, ETA, in-flight, matches, etc.).
"""

import argparse
import asyncio
import json
import math
import os
import random
import re
import secrets
import sqlite3
import sys
import time
from typing import Any, Dict, List, Optional, Set, Tuple

try:
    import aiohttp
except ImportError:
    print("[ERROR] 'aiohttp' package is required. Install it using: py -m pip install aiohttp")
    sys.exit(1)

# Enable VT100 ANSI escape sequences on Windows & reconfigure UTF-8 stdout
if os.name == "nt":
    os.system("")

try:
    if sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if sys.stderr.encoding.lower() != "utf-8":
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# ==============================================================================
# DEFAULT CONFIGURATION
# ==============================================================================
DEFAULT_INPUT = os.path.join("AniSoraDB", "anime-offline-database.jsonl")
DEFAULT_OUTPUT = "anime_with_hianime.jsonl"
DEFAULT_DB = "enrich_checkpoint.db"
DEFAULT_API_URL = "http://localhost:4000/localdb/sync"
DEFAULT_ANILIST_API_URL = "http://localhost:4000/api/v1/anilist/sync"
DEFAULT_CONCURRENCY = 1000
DEFAULT_TIMEOUT = 15.0
DEFAULT_RETRIES = 3
DEFAULT_ANISORA_MIN = 100000000
DEFAULT_ANISORA_MAX = 999999999
DEFAULT_BUFFER_SIZE = 3000

ANILIST_URL_REGEX = re.compile(r"https?://(?:www\.)?anilist\.co/anime/(\d+)", re.IGNORECASE)

# ==============================================================================
# DATABASE CHECKPOINT & CACHE MANAGER
# ==============================================================================
class CheckpointDB:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute("PRAGMA cache_size = -64000;")  # 64MB cache
        return conn

    def _init_db(self) -> None:
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS meta (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );

                CREATE TABLE IF NOT EXISTS anisora_ids (
                    anisora_id INTEGER PRIMARY KEY,
                    line_index INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS search_cache (
                    query_key TEXT PRIMARY KEY,
                    hianime_id TEXT,
                    status TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS entries (
                    line_index INTEGER PRIMARY KEY,
                    anisora_id INTEGER UNIQUE NOT NULL,
                    hianime_id TEXT,
                    status TEXT NOT NULL, /* 'COMPLETED', 'NO_MATCH', 'RETRY_PENDING', 'SKIPPED' */
                    error_message TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
            """)
            conn.commit()

    def get_meta(self, key: str) -> Optional[str]:
        with self._get_connection() as conn:
            cur = conn.execute("SELECT value FROM meta WHERE key = ?", (key,))
            row = cur.fetchone()
            return row[0] if row else None

    def set_meta(self, key: str, value: str) -> None:
        with self._get_connection() as conn:
            conn.execute("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", (key, value))
            conn.commit()

    def load_existing_anisora_ids(self) -> Set[int]:
        with self._get_connection() as conn:
            cur = conn.execute("SELECT anisora_id FROM anisora_ids")
            return {row[0] for row in cur.fetchall()}

    def load_completed_entries(self) -> Dict[int, Tuple[int, Optional[str], str]]:
        """Returns map of line_index -> (anisora_id, hianime_id, status)"""
        with self._get_connection() as conn:
            cur = conn.execute("SELECT line_index, anisora_id, hianime_id, status FROM entries")
            return {row[0]: (row[1], row[2], row[3]) for row in cur.fetchall()}

    def get_cached_search(self, query_key: str) -> Optional[Tuple[Optional[str], str]]:
        with self._get_connection() as conn:
            cur = conn.execute("SELECT hianime_id, status FROM search_cache WHERE query_key = ?", (query_key,))
            row = cur.fetchone()
            return (row[0], row[1]) if row else None

    def save_batch(
        self,
        entries: List[Tuple[int, int, Optional[str], str, Optional[str]]],
        cache_items: List[Tuple[str, Optional[str], str]],
        anisora_records: List[Tuple[int, int]]
    ) -> None:
        with self._get_connection() as conn:
            if anisora_records:
                conn.executemany(
                    "INSERT OR IGNORE INTO anisora_ids (anisora_id, line_index) VALUES (?, ?)",
                    anisora_records
                )
            if cache_items:
                conn.executemany(
                    "INSERT OR REPLACE INTO search_cache (query_key, hianime_id, status) VALUES (?, ?, ?)",
                    cache_items
                )
            if entries:
                conn.executemany(
                    """INSERT OR REPLACE INTO entries 
                       (line_index, anisora_id, hianime_id, status, error_message) 
                       VALUES (?, ?, ?, ?, ?)""",
                    entries
                )
            conn.commit()


# ==============================================================================
# ANISORA ID GENERATOR (CRYPTOGRAPHICALLY SECURE & PERSISTENT)
# ==============================================================================
# ANISORA ID GENERATOR (CRYPTOGRAPHICALLY SECURE & PERSISTENT)
# ==============================================================================
class AniSoraIdGenerator:
    def __init__(self, db: CheckpointDB, min_id: int, max_id: int):
        self.db = db
        self.min_id = min_id
        self.max_id = max_id
        self.used_ids: Set[int] = self.db.load_existing_anisora_ids()
        self.total_range = max_id - min_id + 1
        self._lock = asyncio.Lock()

    async def get_or_create_id(self, line_index: int, existing_id: Optional[int] = None) -> int:
        async with self._lock:
            # Strictly validate existing ID: must be int, within 9-digit range, and not already used
            if (
                existing_id is not None
                and isinstance(existing_id, int)
                and self.min_id <= existing_id <= self.max_id
                and existing_id not in self.used_ids
            ):
                self.used_ids.add(existing_id)
                return existing_id

            if len(self.used_ids) >= self.total_range:
                raise RuntimeError(
                    f"CRITICAL: Exhausted all available AniSora IDs in range {self.min_id}..{self.max_id}!"
                )

            max_attempts = 2000
            for _ in range(max_attempts):
                # Cryptographically secure random integer
                candidate = secrets.randbelow(self.total_range) + self.min_id
                if candidate not in self.used_ids:
                    self.used_ids.add(candidate)
                    return candidate

            raise RuntimeError(
                f"Failed to find unique AniSora ID after {max_attempts} attempts due to high collision rate."
            )


# ==============================================================================
# ADAPTIVE RATE LIMITER / DYNAMIC CONCURRENCY CONTROLLER
# ==============================================================================
class AdaptiveConcurrencyController:
    """
    True dynamic concurrency limiter.
    Adjusts active in-flight request capacity in real-time.
    Provides synchronous release() compatible with all try/finally blocks.
    """
    def __init__(self, target_concurrency: int, min_concurrency: int = 10):
        self.target_concurrency = target_concurrency
        self.min_concurrency = min(min_concurrency, target_concurrency)
        self.current_limit = target_concurrency
        self.active_count = 0
        self.consecutive_successes = 0
        self._waiters: List[asyncio.Future] = []
        self._is_paused = False

    async def acquire(self):
        while self._is_paused or self.active_count >= self.current_limit:
            loop = asyncio.get_running_loop()
            fut = loop.create_future()
            self._waiters.append(fut)
            try:
                await fut
            except asyncio.CancelledError:
                if fut in self._waiters:
                    self._waiters.remove(fut)
                raise
        self.active_count += 1

    def release(self):
        self.active_count = max(0, self.active_count - 1)
        self._wake_next()

    def _wake_next(self):
        if self._is_paused:
            return
        available_slots = self.current_limit - self.active_count
        while available_slots > 0 and self._waiters:
            fut = self._waiters.pop(0)
            if not fut.done():
                fut.set_result(None)
                available_slots -= 1

    async def record_success(self):
        self.consecutive_successes += 1
        # Additive increase: gradually ramp back up to target
        if self.consecutive_successes >= 30 and self.current_limit < self.target_concurrency:
            self.current_limit = min(self.target_concurrency, self.current_limit + 1)
            self.consecutive_successes = 0
            self._wake_next()

    async def record_overload(self, reason: str = "429 / Server Overload"):
        self.consecutive_successes = 0
        # Multiplicative decrease
        self.current_limit = max(self.min_concurrency, int(self.current_limit * 0.7))
        
        # Briefly pause new requests to allow server recovery
        if not self._is_paused:
            self._is_paused = True
            cooldown = random.uniform(1.0, 2.5)
            asyncio.create_task(self._cooldown_and_resume(cooldown))

    async def _cooldown_and_resume(self, seconds: float):
        await asyncio.sleep(seconds)
        self._is_paused = False
        self._wake_next()


# ==============================================================================
# METRICS TRACKER & LIVE TERMINAL DASHBOARD
# ==============================================================================
class ProgressTracker:
    def __init__(self, total_entries: int):
        self.total = total_entries
        self.completed = 0
        self.matches = 0
        self.no_matches = 0
        self.awaiting_retry = 0
        self.failed = 0
        self.in_flight = 0
        self.cached_hits = 0
        self.start_time = time.time()
        self._lock = asyncio.Lock()
        self._rps_window: List[Tuple[float, int]] = []

    async def record_in_flight(self, delta: int):
        async with self._lock:
            self.in_flight = max(0, self.in_flight + delta)

    async def record_result(self, status: str, is_match: bool, is_cached: bool = False):
        async with self._lock:
            self.completed += 1
            now = time.time()
            self._rps_window.append((now, self.completed))
            cutoff = now - 5.0
            self._rps_window = [w for w in self._rps_window if w[0] >= cutoff]

            if is_cached:
                self.cached_hits += 1

            if status == "COMPLETED" and is_match:
                self.matches += 1
            elif status == "NO_MATCH" or (status == "COMPLETED" and not is_match):
                self.no_matches += 1
            elif status == "RETRY_PENDING":
                self.awaiting_retry += 1
            elif status == "FAILED":
                self.failed += 1

    def get_stats(self) -> Dict[str, Any]:
        now = time.time()
        elapsed = max(0.001, now - self.start_time)
        
        if len(self._rps_window) >= 2:
            dt = self._rps_window[-1][0] - self._rps_window[0][0]
            dc = self._rps_window[-1][1] - self._rps_window[0][1]
            rps = dc / dt if dt > 0.1 else (self.completed / elapsed)
        else:
            rps = self.completed / elapsed

        remaining = max(0, self.total - self.completed)
        eta_seconds = (remaining / rps) if rps > 0.05 else 0

        return {
            "total": self.total,
            "completed": self.completed,
            "pct": (self.completed / self.total * 100.0) if self.total > 0 else 0.0,
            "matches": self.matches,
            "no_matches": self.no_matches,
            "awaiting_retry": self.awaiting_retry,
            "failed": self.failed,
            "in_flight": self.in_flight,
            "cached": self.cached_hits,
            "rps": rps,
            "elapsed": elapsed,
            "eta": eta_seconds,
        }

    @staticmethod
    def format_time(seconds: float) -> str:
        s = int(seconds)
        h = s // 3600
        m = (s % 3600) // 60
        sec = s % 60
        if h > 0:
            return f"{h:02d}:{m:02d}:{sec:02d}"
        return f"{m:02d}:{sec:02d}"


# ==============================================================================
# BOUNDED REORDER BUFFER WRITER
# ==============================================================================
class ReorderBufferWriter:
    """
    Maintains an in-order sliding window buffer to stream enriched JSON records
    to output file in exact 1-to-1 input order as soon as records are ready.
    """
    def __init__(
        self,
        output_file_path: str,
        start_line_index: int,
        metadata_line: str,
        max_buffer_size: int = DEFAULT_BUFFER_SIZE
    ):
        self.output_file_path = output_file_path
        self.next_expected_line = start_line_index
        self.metadata_line = metadata_line
        self.max_buffer_size = max_buffer_size
        self.buffer: Dict[int, str] = {}
        self.drain_event = asyncio.Event()
        self.drain_event.set()
        self.queue: asyncio.Queue = asyncio.Queue()
        self.is_running = True
        self._written_count = 0
        self._file = None
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        write_meta = False
        if not os.path.exists(self.output_file_path) or os.path.getsize(self.output_file_path) == 0:
            write_meta = True

        self._file = open(self.output_file_path, "a", encoding="utf-8", buffering=131072)

        if write_meta:
            self._file.write(self.metadata_line.strip() + "\n")
            self._file.flush()

        self._task = asyncio.create_task(self._writer_loop())

    async def push(self, line_index: int, json_line: str):
        await self.queue.put((line_index, json_line))
        # Flow control: if buffer is filling up because of a slow lagging request, pause reader
        if len(self.buffer) + self.queue.qsize() >= self.max_buffer_size:
            self.drain_event.clear()

    async def _writer_loop(self):
        last_flush = time.time()
        while self.is_running or not self.queue.empty():
            try:
                line_idx, json_line = await asyncio.wait_for(self.queue.get(), timeout=0.1)
                self.buffer[line_idx] = json_line
                self.queue.task_done()
            except asyncio.TimeoutError:
                pass

            # Flush all contiguous lines starting at next_expected_line
            while self.next_expected_line in self.buffer:
                content = self.buffer.pop(self.next_expected_line)
                self._file.write(content + "\n")
                self.next_expected_line += 1
                self._written_count += 1

            # Check if buffer has drained sufficiently to resume input reading
            if not self.drain_event.is_set() and len(self.buffer) < (self.max_buffer_size * 0.6):
                self.drain_event.set()

            # Flush file to disk regularly
            if time.time() - last_flush > 1.0 or self._written_count % 500 == 0:
                self._file.flush()
                last_flush = time.time()

        # Final drain
        while self.next_expected_line in self.buffer:
            content = self.buffer.pop(self.next_expected_line)
            self._file.write(content + "\n")
            self.next_expected_line += 1
            self._written_count += 1
        
        self._file.flush()
        try:
            os.fsync(self._file.fileno())
        except Exception:
            pass
        self._file.close()

    async def wait_until_drained(self):
        await self.drain_event.wait()

    async def stop(self):
        self.is_running = False
        await self.queue.join()
        if self._task:
            await self._task


# ==============================================================================
# ASYNC DB BATCH WRITER
# ==============================================================================
class AsyncDbWriter:
    def __init__(self, db: CheckpointDB):
        self.db = db
        self.queue: asyncio.Queue = asyncio.Queue()
        self.is_running = True
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        self._task = asyncio.create_task(self._loop())

    async def push(
        self,
        entry_record: Tuple[int, int, Optional[str], str, Optional[str]],
        cache_item: Optional[Tuple[str, Optional[str], str]],
        anisora_record: Optional[Tuple[int, int]]
    ):
        await self.queue.put((entry_record, cache_item, anisora_record))

    async def _loop(self):
        while self.is_running or not self.queue.empty():
            batch_entries = []
            batch_cache = []
            batch_anisora = []

            try:
                item = await asyncio.wait_for(self.queue.get(), timeout=0.1)
                batch_entries.append(item[0])
                if item[1]:
                    batch_cache.append(item[1])
                if item[2]:
                    batch_anisora.append(item[2])
                self.queue.task_done()

                while len(batch_entries) < 200 and not self.queue.empty():
                    item = self.queue.get_nowait()
                    batch_entries.append(item[0])
                    if item[1]:
                        batch_cache.append(item[1])
                    if item[2]:
                        batch_anisora.append(item[2])
                    self.queue.task_done()

            except asyncio.TimeoutError:
                pass

            if batch_entries or batch_cache or batch_anisora:
                self.db.save_batch(batch_entries, batch_cache, batch_anisora)

    async def stop(self):
        self.is_running = False
        await self.queue.join()
        if self._task:
            await self._task


# ==============================================================================
# API CALL & RESPONSE EXTRACTION
# ==============================================================================
def extract_anilist_id(entry: Dict[str, Any]) -> Optional[int]:
    sources = entry.get("sources")
    if not isinstance(sources, list):
        return None
    for src in sources:
        if isinstance(src, str):
            match = ANILIST_URL_REGEX.search(src)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    pass
    return None


def extract_hianime_id_from_response(data: Any) -> Optional[str]:
    """
    Robust response extractor:
    Extracts the matched HiAnime ID string from API response.
    Handles:
    - { "success": true, "data": { "id": "attack-on-titan-865" } }
    - { "success": true, "data": { "hianimeId": "attack-on-titan-865" } }
    - { "success": true, "data": "attack-on-titan-865" }
    - { "id": "attack-on-titan-865" }
    - { "hianimeId": "attack-on-titan-865" }
    """
    if isinstance(data, str) and data.strip():
        return data.strip()

    if not isinstance(data, dict):
        return None

    # Direct top-level id or hianimeId
    top_id = data.get("id") or data.get("hianimeId")
    if isinstance(top_id, str) and top_id.strip():
        return top_id.strip()

    payload = data.get("data")
    if isinstance(payload, str) and payload.strip():
        return payload.strip()

    if isinstance(payload, dict):
        # Direct id or hianimeId from payload
        hid = payload.get("id") or payload.get("hianimeId")
        if hid and isinstance(hid, str) and hid.strip():
            return hid.strip()

        # Nested hianime object
        hianime_obj = payload.get("hianime")
        if isinstance(hianime_obj, dict):
            hid = hianime_obj.get("id") or hianime_obj.get("animeId")
            if hid and isinstance(hid, str) and hid.strip():
                return hid.strip()

    return None


def normalize_title(title: str) -> str:
    """Normalizes title string for accurate and consistent cache lookup."""
    if not title:
        return ""
    t = title.lower()
    t = re.sub(r'[\'\"“”‘’`「」『』\(\)\[\]\{\}]', '', t)
    t = re.sub(r'[\s\-_:]+', ' ', t).strip()
    return t


async def call_sync_api(
    session: aiohttp.ClientSession,
    api_url: str,
    payload_or_param: Dict[str, Any],
    method: str = "POST",
    throttler: Optional[AdaptiveConcurrencyController] = None,
    max_retries: int = DEFAULT_RETRIES,
    timeout_sec: float = DEFAULT_TIMEOUT
) -> Tuple[Optional[str], str, Optional[str]]:
    """
    Calls search/sync API with exponential backoff and jitter.
    Strictly distinguishes genuine NO_MATCH from malformed or transient failures.
    Returns: (hianime_id, status, error_message)
    status: 'COMPLETED', 'NO_MATCH', 'RETRY_PENDING'
    """
    for attempt in range(max_retries + 1):
        if throttler:
            await throttler.acquire()
        try:
            timeout = aiohttp.ClientTimeout(total=timeout_sec)
            if method.upper() == "POST":
                async with session.post(api_url, json=payload_or_param, timeout=timeout) as resp:
                    status_code = resp.status
                    text_body = await resp.text()
            else:
                async with session.get(api_url, params=payload_or_param, timeout=timeout) as resp:
                    status_code = resp.status
                    text_body = await resp.text()

            if throttler:
                throttler.release()

            if status_code == 200:
                try:
                    res_json = json.loads(text_body)
                except Exception as e:
                    # Invalid JSON response (e.g. proxy HTML error) - retry rather than false NO_MATCH
                    if attempt < max_retries:
                        backoff = min(4.0, (1.2 ** attempt)) + random.uniform(0.1, 0.5)
                        await asyncio.sleep(backoff)
                        continue
                    return (None, "RETRY_PENDING", f"Invalid JSON response: {e}")

                if not isinstance(res_json, dict):
                    return (None, "RETRY_PENDING", f"Unexpected JSON response type: {type(res_json)}")

                # Check if API returned an explicit error object
                if res_json.get("success") is False:
                    err_msg = str(res_json.get("message") or res_json.get("error") or "API error")
                    if "not found" in err_msg.lower() or "no anime found" in err_msg.lower():
                        return (None, "NO_MATCH", err_msg)
                    if attempt < max_retries:
                        backoff = min(4.0, (1.2 ** attempt)) + random.uniform(0.1, 0.5)
                        await asyncio.sleep(backoff)
                        continue
                    return (None, "RETRY_PENDING", f"API error: {err_msg}")

                # Success response: extract matched ID
                hid = extract_hianime_id_from_response(res_json)
                if hid:
                    if throttler:
                        await throttler.record_success()
                    return (hid, "COMPLETED", None)

                # Confirmed no-match: explicit null in data or empty suggestions
                data_val = res_json.get("data")
                if data_val is None or (isinstance(data_val, dict) and data_val.get("id") is None):
                    if throttler:
                        await throttler.record_success()
                    return (None, "NO_MATCH", None)

                return (None, "RETRY_PENDING", "Unrecognized data structure")

            # Overload / Rate Limit (429 or 503)
            if status_code in (429, 503):
                if throttler:
                    await throttler.record_overload(f"HTTP {status_code}")
                if attempt < max_retries:
                    backoff = min(6.0, (1.5 ** attempt)) + random.uniform(0.2, 0.8)
                    await asyncio.sleep(backoff)
                    continue
                return (None, "RETRY_PENDING", f"HTTP {status_code} server overloaded")

            # Confirmed 404
            if status_code == 404:
                try:
                    err_json = json.loads(text_body)
                    msg = str(err_json.get("message", "")).lower()
                    if "not found" in msg or "could not find" in msg:
                        return (None, "NO_MATCH", msg)
                except Exception:
                    pass
                return (None, "RETRY_PENDING", f"HTTP 404: {text_body[:100]}")

            # 400 Bad Request
            if status_code == 400:
                return (None, "NO_MATCH", f"HTTP 400: {text_body[:100]}")

            # HTTP 500 error: inspect message or retry
            if status_code == 500:
                try:
                    err_json = json.loads(text_body)
                    msg = str(err_json.get("message", "")).lower()
                    if "not found" in msg or "could not find a matching anime" in msg:
                        return (None, "NO_MATCH", msg)
                except Exception:
                    pass

                if attempt < max_retries:
                    backoff = min(4.0, (1.2 ** attempt)) + random.uniform(0.1, 0.5)
                    await asyncio.sleep(backoff)
                    continue
                return (None, "RETRY_PENDING", f"HTTP 500: {text_body[:100]}")

            return (None, "RETRY_PENDING", f"HTTP {status_code}: {text_body[:100]}")

        except (aiohttp.ClientError, asyncio.TimeoutError) as net_err:
            if throttler:
                throttler.release()
                await throttler.record_overload("Network / Timeout error")
            if attempt < max_retries:
                backoff = min(5.0, (1.5 ** attempt)) + random.uniform(0.2, 0.6)
                await asyncio.sleep(backoff)
                continue
            return (None, "RETRY_PENDING", f"Network error: {net_err}")
        except Exception as e:
            if throttler:
                throttler.release()
            return (None, "RETRY_PENDING", f"Unexpected error: {e}")

    return (None, "RETRY_PENDING", "Exceeded max retries")


# ==============================================================================
# MAIN WORKER & COORDINATION PIPELINE
# ==============================================================================
async def process_entry(
    line_index: int,
    raw_line: str,
    entry: Dict[str, Any],
    session: aiohttp.ClientSession,
    config: Dict[str, Any],
    id_gen: AniSoraIdGenerator,
    throttler: AdaptiveConcurrencyController,
    tracker: ProgressTracker,
    db: CheckpointDB,
    db_writer: AsyncDbWriter,
    out_writer: ReorderBufferWriter,
    cached_entry_info: Optional[Tuple[int, Optional[str], str]] = None
):
    await tracker.record_in_flight(1)
    anisora_id = entry.get("AniSora_Id") or 0
    try:
        title = entry.get("title") or ""
        synonyms = entry.get("synonyms") or []

        # 1. Determine AniSora_Id (Validated and unique)
        if cached_entry_info:
            anisora_id = cached_entry_info[0]
            existing_hianime_id = cached_entry_info[1]
            existing_status = cached_entry_info[2]
            
            # If already finished successfully or confirmed no match, reuse directly!
            if existing_status in ("COMPLETED", "NO_MATCH", "SKIPPED"):
                entry["Hianime_Id"] = existing_hianime_id
                entry["AniSora_Id"] = anisora_id
                enriched_json = json.dumps(entry, ensure_ascii=False)
                await out_writer.push(line_index, enriched_json)
                await tracker.record_result(existing_status, bool(existing_hianime_id), is_cached=True)
                return
        else:
            anisora_id = await id_gen.get_or_create_id(line_index, existing_id=entry.get("AniSora_Id"))

        # 2. Check query cache
        cache_key = f"search:{normalize_title(title)}"
        cached_result = db.get_cached_search(cache_key)
        hianime_id = None
        status = "COMPLETED"
        err_msg = None
        is_cache_hit = False

        if cached_result:
            hianime_id, status = cached_result
            is_cache_hit = True
        else:
            # 3. Call localdb/sync or search endpoint
            if config["sync_mode"] == "search":
                payload = {
                    "name": title,
                    "title": title,
                    "synonyms": synonyms
                }
                hianime_id, status, err_msg = await call_sync_api(
                    session=session,
                    api_url=config["api_url"],
                    payload_or_param=payload,
                    method="POST",
                    throttler=throttler,
                    max_retries=config["max_retries"],
                    timeout_sec=config["timeout"]
                )
            else:
                # AniList sync mode
                anilist_id = extract_anilist_id(entry)
                if anilist_id:
                    url = f"{config['anilist_api_url']}/{anilist_id}"
                    hianime_id, status, err_msg = await call_sync_api(
                        session=session,
                        api_url=url,
                        payload_or_param={},
                        method="GET",
                        throttler=throttler,
                        max_retries=config["max_retries"],
                        timeout_sec=config["timeout"]
                    )
                else:
                    hianime_id = None
                    status = "SKIPPED"
                    err_msg = "No AniList ID found in sources"

            # Cache confirmed results ONLY if free of transient error
            if status in ("COMPLETED", "NO_MATCH") and err_msg is None:
                cache_item = (cache_key, hianime_id, status)
            else:
                cache_item = None

        # 4. Save to DB checkpoint (async)
        entry_record = (line_index, anisora_id, hianime_id, status, err_msg)
        anisora_record = (anisora_id, line_index)
        cache_record = cache_item if not is_cache_hit else None

        await db_writer.push(entry_record, cache_record, anisora_record)

        # 5. Enrich entry and send to reorder output writer
        entry["Hianime_Id"] = hianime_id
        entry["AniSora_Id"] = anisora_id
        enriched_json = json.dumps(entry, ensure_ascii=False)
        await out_writer.push(line_index, enriched_json)

        # 6. Update metrics
        await tracker.record_result(status, bool(hianime_id), is_cached=is_cache_hit)

    except Exception as exc:
        # Fallback to prevent reorder buffer starvation on unhandled exception
        entry["Hianime_Id"] = None
        entry["AniSora_Id"] = anisora_id
        err_msg = f"Worker exception: {exc}"
        await db_writer.push((line_index, anisora_id, None, "FAILED", err_msg), None, (anisora_id, line_index))
        await out_writer.push(line_index, json.dumps(entry, ensure_ascii=False))
        await tracker.record_result("FAILED", False)

    finally:
        await tracker.record_in_flight(-1)


# ==============================================================================
# DASHBOARD REFRESH LOOP
# ==============================================================================
async def dashboard_loop(tracker: ProgressTracker, throttler: AdaptiveConcurrencyController, stop_event: asyncio.Event):
    while not stop_event.is_set():
        stats = tracker.get_stats()
        cur_limit = throttler.current_limit
        target_limit = throttler.target_concurrency
        
        # Build 3-line terminal status
        line1 = (
            f"\r\033[K[AniSora DB] {stats['completed']:,} / {stats['total']:,} ({stats['pct']:.1f}%) "
            f"| In-Flight: {stats['in_flight']} | Speed: {stats['rps']:.1f} req/s"
        )
        line2 = (
            f"\n\033[K  Matches: {stats['matches']:,} | No-Match: {stats['no_matches']:,} "
            f"| Retry-Pending: {stats['awaiting_retry']} | Cached: {stats['cached']:,}"
        )
        line3 = (
            f"\n\033[K  Elapsed: {tracker.format_time(stats['elapsed'])} | ETA: {tracker.format_time(stats['eta'])} "
            f"| Active Concurrency: {cur_limit} / {target_limit}\033[2A"
        )
        
        sys.stdout.write(line1 + line2 + line3)
        sys.stdout.flush()

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=0.25)
        except asyncio.TimeoutError:
            pass

    # Print final position
    sys.stdout.write("\n\n\n")
    sys.stdout.flush()


# ==============================================================================
# RECONSTRUCTION UTILITY
# ==============================================================================
def reconstruct_final_file(input_path: str, output_path: str, db: CheckpointDB):
    """
    Guarantees 100% sorted, perfectly ordered output file directly from DB and original input.
    """
    print(f"\n[Reconstruct] Rebuilding '{output_path}' strictly in input order from checkpoint DB...")
    completed_entries = db.load_completed_entries()
    total_written = 0
    missing = 0

    with open(input_path, "r", encoding="utf-8") as in_f, open(output_path, "w", encoding="utf-8") as out_f:
        metadata_line = in_f.readline()
        out_f.write(metadata_line.strip() + "\n")

        line_index = 2
        for line in in_f:
            line_str = line.strip()
            if not line_str:
                line_index += 1
                continue
            entry = json.loads(line_str)
            if line_index in completed_entries:
                anisora_id, hianime_id, _ = completed_entries[line_index]
                entry["Hianime_Id"] = hianime_id
                entry["AniSora_Id"] = anisora_id
            else:
                missing += 1
                entry["Hianime_Id"] = None
                entry["AniSora_Id"] = None

            out_f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            line_index += 1
            total_written += 1

    print(f"[Reconstruct] Finished! Reconstructed {total_written:,} entries ({missing} unindexed).")


# ==============================================================================
# ENTRY POINT & CLI
# ==============================================================================
async def async_main(config: Dict[str, Any]):
    input_path = config["input_path"]
    output_path = config["output_path"]
    db_path = config["checkpoint_db"]

    if not os.path.exists(input_path):
        print(f"[ERROR] Input dataset file not found: {input_path}")
        sys.exit(1)

    print("==================================================================")
    print("[*] AniSora DB Enricher - High-Speed Processing Engine")
    print(f"[*] Input File:      {input_path}")
    print(f"[*] Output File:     {output_path}")
    print(f"[*] Checkpoint DB:   {db_path}")
    print(f"[*] API Endpoint:    {config['api_url']}")
    print(f"[*] Concurrency:     {config['concurrency']}")
    print(f"[*] Mode:            {config['sync_mode']} (Search with title + synonyms)")
    print("==================================================================")

    db = CheckpointDB(db_path)
    id_gen = AniSoraIdGenerator(db, config["anisora_id_min"], config["anisora_id_max"])
    throttler = AdaptiveConcurrencyController(config["concurrency"])
    
    # Dataset integrity fingerprint check
    dataset_fingerprint = f"{os.path.basename(input_path)}:{os.path.getsize(input_path)}"
    stored_fingerprint = db.get_meta("dataset_fingerprint")
    if stored_fingerprint and stored_fingerprint != dataset_fingerprint:
        print(f"[!] [WARNING] Checkpoint DB was created for a different dataset: {stored_fingerprint}")
        print(f"    Current dataset fingerprint: {dataset_fingerprint}")
    elif not stored_fingerprint:
        db.set_meta("dataset_fingerprint", dataset_fingerprint)

    # Check existing checkpoint
    completed_entries_map = db.load_completed_entries()
    print(f"[Checkpoint] Found {len(completed_entries_map):,} previously indexed entries.")

    # Count total lines in input file (fast scan)
    print("[Dataset] Scanning input file line count...")
    total_entries = 0
    metadata_line = ""
    with open(input_path, "r", encoding="utf-8") as f:
        metadata_line = f.readline()
        for _ in f:
            total_entries += 1

    print(f"[Dataset] Total anime records to process: {total_entries:,}")

    # Initialize tracker and writers
    tracker = ProgressTracker(total_entries)
    db_writer = AsyncDbWriter(db)
    await db_writer.start()

    # Determine next expected line for reorder buffer
    start_line_index = 2
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        # Check how many lines are already written to the output file
        with open(output_path, "r", encoding="utf-8") as f:
            written_lines = sum(1 for _ in f)
        # line 1 is metadata, so written_lines lines means up to line_index = written_lines
        start_line_index = max(2, written_lines + 1)
        print(f"[Resume] Output file already contains {written_lines:,} lines. Fast-forwarding to line {start_line_index}...")

        # Pre-seed tracker metrics from already-written slice
        already_written = start_line_index - 2
        tracker.completed = already_written
        for idx in range(2, start_line_index):
            info = completed_entries_map.get(idx)
            if info:
                if info[1]:
                    tracker.matches += 1
                else:
                    tracker.no_matches += 1

    out_writer = ReorderBufferWriter(
        output_file_path=output_path,
        start_line_index=start_line_index,
        metadata_line=metadata_line,
        max_buffer_size=config["reorder_buffer_size"]
    )
    await out_writer.start()

    # HTTP Connection Pool
    connector = aiohttp.TCPConnector(
        limit=config["concurrency"],
        limit_per_host=config["concurrency"],
        ttl_dns_cache=300,
        keepalive_timeout=30.0,
        force_close=False
    )

    dashboard_stop = asyncio.Event()
    dashboard_task = None
    worker_tasks = set()

    try:
        async with aiohttp.ClientSession(connector=connector) as session:
            dashboard_task = asyncio.create_task(dashboard_loop(tracker, throttler, dashboard_stop))
            active_limit = config["concurrency"]

            # Stream input file line-by-line
            with open(input_path, "r", encoding="utf-8") as in_f:
                in_f.readline()  # Skip metadata line (already preserved)

                line_idx = 2
                for line in in_f:
                    line_str = line.strip()
                    if not line_str:
                        line_idx += 1
                        continue

                    # CRITICAL RESUME FIX: Skip lines already written to output file!
                    # Guarantees old line indexes never enter the reorder buffer and cause deadlock.
                    if line_idx < start_line_index:
                        line_idx += 1
                        continue

                    # Wait if reorder buffer is getting full (flow control)
                    await out_writer.wait_until_drained()

                    entry = json.loads(line_str)
                    cached_info = completed_entries_map.get(line_idx)

                    # Spawn worker task
                    task = asyncio.create_task(
                        process_entry(
                            line_index=line_idx,
                            raw_line=line_str,
                            entry=entry,
                            session=session,
                            config=config,
                            id_gen=id_gen,
                            throttler=throttler,
                            tracker=tracker,
                            db=db,
                            db_writer=db_writer,
                            out_writer=out_writer,
                            cached_entry_info=cached_info
                        )
                    )
                    worker_tasks.add(task)
                    task.add_done_callback(worker_tasks.discard)

                    # Keep in-flight task pool within bounds
                    if len(worker_tasks) >= active_limit:
                        done, _ = await asyncio.wait(worker_tasks, return_when=asyncio.FIRST_COMPLETED)

                    line_idx += 1

            # Wait for all remaining worker tasks
            if worker_tasks:
                await asyncio.gather(*worker_tasks, return_exceptions=True)

    except (KeyboardInterrupt, asyncio.CancelledError):
        print("\n[!] Graceful shutdown requested. Draining active in-flight writes...")
        for t in worker_tasks:
            if not t.done():
                t.cancel()
        if worker_tasks:
            await asyncio.gather(*worker_tasks, return_exceptions=True)
    finally:
        # Stop dashboard
        if dashboard_stop and not dashboard_stop.is_set():
            dashboard_stop.set()
        if dashboard_task and not dashboard_task.done():
            await dashboard_task

        # Await writers completion so every single queued entry is saved to disk
        print("\n[Flush] Draining and awaiting all disk and SQLite writes...")
        if out_writer:
            await out_writer.stop()
        if db_writer:
            await db_writer.stop()

    # Final summary report
    stats = tracker.get_stats()
    print("==================================================================")
    print("[+] ENRICHMENT RUN COMPLETE!")
    print(f"[*] Total Entries:         {stats['total']:,}")
    print(f"[*] Completed Entries:     {stats['completed']:,} ({stats['pct']:.1f}%)")
    print(f"[+] HiAnime Matches:       {stats['matches']:,}")
    print(f"[-] No Matches:            {stats['no_matches']:,}")
    print(f"[?] Awaiting Retry:        {stats['awaiting_retry']:,}")
    print(f"[*] Final Avg Speed:       {stats['rps']:.1f} req/s")
    print(f"[*] Total Elapsed Time:    {tracker.format_time(stats['elapsed'])}")
    print(f"[*] Output Saved To:       {output_path}")
    print(f"[*] Checkpoint Saved To:   {db_path}")
    print("==================================================================")


def main():
    parser = argparse.ArgumentParser(description="AniSora DB Enricher (High Concurrency & Real-Time Persistence)")
    parser.add_argument("--input", "-i", default=DEFAULT_INPUT, help="Path to input JSONL dataset")
    parser.add_argument("--output", "-o", default=DEFAULT_OUTPUT, help="Path to output JSONL file")
    parser.add_argument("--db", default=DEFAULT_DB, help="Path to checkpoint SQLite database")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="URL to localdb/sync endpoint")
    parser.add_argument("--anilist-api-url", default=DEFAULT_ANILIST_API_URL, help="URL to anilist/sync endpoint")
    parser.add_argument("--mode", choices=["search", "anilist"], default="search", help="Sync mode: 'search' (fast, title+synonyms) or 'anilist'")
    parser.add_argument("--concurrency", "-c", type=int, default=DEFAULT_CONCURRENCY, help="Maximum simultaneous in-flight requests")
    parser.add_argument("--timeout", "-t", type=float, default=DEFAULT_TIMEOUT, help="Request timeout in seconds")
    parser.add_argument("--retries", "-r", type=int, default=DEFAULT_RETRIES, help="Max retry attempts for transient errors")
    parser.add_argument("--anisora-min", type=int, default=DEFAULT_ANISORA_MIN, help="Minimum 9-digit AniSora ID")
    parser.add_argument("--anisora-max", type=int, default=DEFAULT_ANISORA_MAX, help="Maximum 9-digit AniSora ID")
    parser.add_argument("--buffer-size", type=int, default=DEFAULT_BUFFER_SIZE, help="Bounded reorder buffer size")
    parser.add_argument("--reconstruct", action="store_true", help="Rebuild output JSONL strictly in order from database")

    args = parser.parse_args()

    config = {
        "input_path": os.path.abspath(args.input),
        "output_path": os.path.abspath(args.output),
        "checkpoint_db": os.path.abspath(args.db),
        "api_url": args.api_url,
        "anilist_api_url": args.anilist_api_url,
        "sync_mode": args.mode,
        "concurrency": args.concurrency,
        "timeout": args.timeout,
        "max_retries": args.retries,
        "anisora_id_min": args.anisora_min,
        "anisora_id_max": args.anisora_max,
        "reorder_buffer_size": args.buffer_size,
    }

    if args.reconstruct:
        db = CheckpointDB(config["checkpoint_db"])
        reconstruct_final_file(config["input_path"], config["output_path"], db)
        return

    try:
        asyncio.run(async_main(config))
    except KeyboardInterrupt:
        print("\n[INFO] Graceful shutdown triggered by user. Progress is safely saved in SQLite checkpoint.")


if __name__ == "__main__":
    main()
