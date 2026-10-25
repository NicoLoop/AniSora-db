#!/usr/bin/env python3
"""
================================================================================
AniSora DB - Unmatched HiAnime Harvester & Schema Converter
================================================================================
Takes the 303 unmatched HiAnime records from:
    AniSoraDB/hianime_unmatched.json

Retrieves full metadata for each title via local API:
    /api/v1/hianime/anime/:id

Converts each record to the exact schema of anime_with_hianime.jsonl:
  - sources (list of strings)
  - title (string)
  - type (string or null)
  - episodes (int or null)
  - status (string or null)
  - animeSeason ({"season": ..., "year": ...} or null)
  - picture (string or null)
  - thumbnail (string or null)
  - duration ({"value": int, "unit": "SECONDS"} or null)
  - score ({"arithmeticGeometricMean": ..., "arithmeticMean": ..., "median": ...} or null)
  - synonyms (list of strings)
  - studios (list of strings)
  - producers (list of strings)
  - relatedAnime (list of strings)
  - tags (list of strings)
  - Hianime_Id (string)
  - AniSora_Id (unique 9-digit int)

Appends all converted records to:
  1. anime_with_hianime.jsonl
  2. AniSoraDB/hianime_unmatched_enriched.json (standalone converted records)
  3. enrich_checkpoint.sql (fully synced SQL checkpoint)
================================================================================
"""

import os
import sys
import json
import time
import re
import secrets
import signal
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Set
import argparse

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


DEFAULT_UNMATCHED_JSON = os.path.join("AniSoraDB", "hianime_unmatched.json")
DEFAULT_TARGET_JSONL = "anime_with_hianime.jsonl"
DEFAULT_OUTPUT_STANDALONE_JSON = os.path.join("AniSoraDB", "hianime_unmatched_enriched.json")
DEFAULT_CHECKPOINT_SQL = "enrich_checkpoint.sql"
DEFAULT_BASE_URL = "http://localhost:4000/api/v1/hianime/anime"

DEFAULT_DELAY = 0.20  # ~5 req/s polite pacing
DEFAULT_TIMEOUT = 12.0
DEFAULT_RETRIES = 5

MIN_ANISORA_ID = 100000000
MAX_ANISORA_ID = 999999999


def parse_duration_to_seconds(d_str: Optional[str]) -> Optional[Dict[str, Any]]:
    """Converts duration string (e.g. '24m', '1h 30m', '120s') into schema duration dict."""
    if not d_str or not isinstance(d_str, str):
        return None
    total_seconds = 0
    matched = False

    h = re.search(r'(\d+)\s*h', d_str, re.IGNORECASE)
    if h:
        total_seconds += int(h.group(1)) * 3600
        matched = True

    m = re.search(r'(\d+)\s*m', d_str, re.IGNORECASE)
    if m:
        total_seconds += int(m.group(1)) * 60
        matched = True

    s = re.search(r'(\d+)\s*s', d_str, re.IGNORECASE)
    if s:
        total_seconds += int(s.group(1))
        matched = True

    if not matched:
        digits = re.search(r'^(\d+)$', d_str.strip())
        if digits:
            total_seconds = int(digits.group(1)) * 60
            matched = True

    if matched and total_seconds > 0:
        return {"value": total_seconds, "unit": "SECONDS"}
    return None


def parse_season(premiered: Optional[str], aired: Optional[str]) -> Optional[Dict[str, Any]]:
    """Extracts standardized season object: {'season': 'FALL', 'year': 2023}."""
    for text in (premiered, aired):
        if not text or not isinstance(text, str):
            continue
        m = re.search(r'\b(WINTER|SPRING|SUMMER|FALL)\s+(\d{4})\b', text, re.IGNORECASE)
        if m:
            return {"season": m.group(1).upper(), "year": int(m.group(2))}

    if aired and isinstance(aired, str):
        m_year = re.search(r'\b(19\d\d|20\d\d)\b', aired)
        if m_year:
            year = int(m_year.group(1))
            m_month = re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', aired, re.IGNORECASE)
            season = None
            if m_month:
                mon = m_month.group(1).lower()
                if mon in ('jan', 'feb', 'mar'):
                    season = "WINTER"
                elif mon in ('apr', 'may', 'jun'):
                    season = "SPRING"
                elif mon in ('jul', 'aug', 'sep'):
                    season = "SUMMER"
                elif mon in ('oct', 'nov', 'dec'):
                    season = "FALL"
            if season:
                return {"season": season, "year": year}
    return None


def parse_status(status_str: Optional[str]) -> Optional[str]:
    """Standardizes anime release status to schema constants."""
    if not status_str or not isinstance(status_str, str):
        return None
    s = status_str.strip().lower()
    if "finish" in s:
        return "FINISHED"
    if "airing" in s or "current" in s or "releas" in s:
        return "RELEASING"
    if "not yet" in s or "upcoming" in s:
        return "NOT_YET_RELEASED"
    return status_str.strip().upper()


def convert_hianime_details_to_schema(
    catalog_item: Dict[str, Any],
    details_data: Dict[str, Any],
    anisora_id: int
) -> Dict[str, Any]:
    """
    Transforms raw HiAnime API response into strict anime-offline-database JSON schema.
    Keeps absent fields as null or empty lists without breaking format.
    """
    hid = catalog_item.get("id") or details_data.get("id") or ""
    name = (details_data.get("name") or catalog_item.get("name") or "").strip()
    jname = (details_data.get("jname") or catalog_item.get("jname") or "").strip()

    stats = details_data.get("stats") or {}
    more_info = details_data.get("moreInfo") or {}

    # Format / Type
    atype = stats.get("type") or catalog_item.get("type") or None
    if atype:
        atype = str(atype).upper().strip()

    # Episode count
    ep_data = stats.get("episodes") or catalog_item.get("episodes") or {}
    episodes = ep_data.get("eps") or ep_data.get("sub") or ep_data.get("dub") or None
    if isinstance(episodes, str):
        try:
            episodes = int(re.sub(r'\D', '', episodes))
        except Exception:
            episodes = None

    # Status
    status = parse_status(more_info.get("status"))

    # Season
    season = parse_season(more_info.get("premiered"), more_info.get("aired"))

    # Picture & Thumbnail
    pic = details_data.get("poster") or catalog_item.get("poster") or None

    # Duration
    dur_str = stats.get("duration") or more_info.get("duration") or catalog_item.get("duration")
    duration = parse_duration_to_seconds(dur_str)

    # Score
    score = None
    mal_score = more_info.get("malScore")
    if mal_score:
        try:
            s_val = float(str(mal_score).replace("N/A", "").strip())
            score = {
                "arithmeticGeometricMean": s_val,
                "arithmeticMean": s_val,
                "median": s_val
            }
        except Exception:
            score = None

    # Synonyms
    synonyms: List[str] = []
    if jname and jname.lower() != name.lower():
        synonyms.append(jname)
    more_jp = more_info.get("japanese")
    if more_jp and isinstance(more_jp, str) and more_jp.strip() and more_jp not in synonyms:
        synonyms.append(more_jp.strip())
    raw_syns = more_info.get("synonyms")
    if isinstance(raw_syns, list):
        for s in raw_syns:
            if s and str(s).strip() not in synonyms:
                synonyms.append(str(s).strip())
    elif isinstance(raw_syns, str) and raw_syns.strip():
        for s in raw_syns.split(","):
            s_cl = s.strip()
            if s_cl and s_cl not in synonyms:
                synonyms.append(s_cl)

    # Studios & Producers
    studios: List[str] = []
    for st in (more_info.get("studios") or []):
        if st and str(st).strip():
            studios.append(str(st).strip().lower())

    producers: List[str] = []
    for pr in (more_info.get("producers") or []):
        if pr and str(pr).strip():
            producers.append(str(pr).strip().lower())

    # Related Anime
    related: List[str] = []
    for rel in (details_data.get("relatedAnimes") or []):
        if isinstance(rel, dict) and rel.get("id"):
            related.append(f"https://hianime.to/{rel['id']}")

    # Tags (genres)
    tags: List[str] = []
    for g in (more_info.get("genres") or []):
        if g and str(g).strip():
            tags.append(str(g).strip().lower())

    # Sources
    sources = [f"https://hianime.to/{hid}"]

    return {
        "sources": sources,
        "title": name,
        "type": atype,
        "episodes": episodes,
        "status": status,
        "animeSeason": season,
        "picture": pic,
        "thumbnail": pic,
        "duration": duration,
        "score": score,
        "synonyms": synonyms,
        "studios": studios,
        "producers": producers,
        "relatedAnime": related,
        "tags": tags,
        "Hianime_Id": hid,
        "AniSora_Id": anisora_id
    }


class UnmatchedEnricher:
    def __init__(
        self,
        unmatched_json_path: str = DEFAULT_UNMATCHED_JSON,
        target_jsonl_path: str = DEFAULT_TARGET_JSONL,
        output_standalone_json_path: str = DEFAULT_OUTPUT_STANDALONE_JSON,
        checkpoint_sql_path: str = DEFAULT_CHECKPOINT_SQL,
        base_url: str = DEFAULT_BASE_URL,
        delay: float = DEFAULT_DELAY,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_RETRIES,
    ):
        self.unmatched_json_path = os.path.abspath(unmatched_json_path)
        self.target_jsonl_path = os.path.abspath(target_jsonl_path)
        self.output_standalone_json_path = os.path.abspath(output_standalone_json_path)
        self.checkpoint_sql_path = os.path.abspath(checkpoint_sql_path)
        self.base_url = base_url.rstrip("/")
        self.delay = max(0.0, delay)
        self.timeout = timeout
        self.max_retries = max_retries

        self.used_anisora_ids: Set[int] = set()
        self.unmatched_catalog_items: List[Dict[str, Any]] = []
        self.shutdown_requested = False

        signal.signal(signal.SIGINT, self._handle_interrupt)
        signal.signal(signal.SIGTERM, self._handle_interrupt)

    def _handle_interrupt(self, signum, frame):
        if not self.shutdown_requested:
            self.shutdown_requested = True
            print("\n[!] Graceful shutdown requested (Ctrl+C). Finishing current item...")

    def load_existing_anisora_ids(self) -> None:
        """Loads all currently assigned AniSora IDs to guarantee uniqueness."""
        if os.path.exists(self.target_jsonl_path):
            print(f"[*] Scanning existing AniSora IDs from: {self.target_jsonl_path}...")
            with open(self.target_jsonl_path, "r", encoding="utf-8") as f:
                next(f, None)  # skip header
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        e = json.loads(line)
                        aid = e.get("AniSora_Id")
                        if aid and isinstance(aid, int):
                            self.used_anisora_ids.add(aid)
                    except Exception:
                        pass
        print(f"[+] Loaded {len(self.used_anisora_ids):,} existing active AniSora IDs.")

    def generate_anisora_id(self) -> int:
        """Generates a cryptographically secure, collision-free 9-digit integer."""
        total_range = MAX_ANISORA_ID - MIN_ANISORA_ID + 1
        for _ in range(5000):
            candidate = secrets.randbelow(total_range) + MIN_ANISORA_ID
            if candidate not in self.used_anisora_ids:
                self.used_anisora_ids.add(candidate)
                return candidate
        raise RuntimeError("AniSora ID range exhausted.")

    def load_unmatched_items(self) -> None:
        """Loads list of unmatched items from hianime_unmatched.json."""
        if not os.path.exists(self.unmatched_json_path):
            raise FileNotFoundError(f"File not found: {self.unmatched_json_path}")

        with open(self.unmatched_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, dict):
            self.unmatched_catalog_items = data.get("unmatched_animes", [])
        elif isinstance(data, list):
            self.unmatched_catalog_items = data
        else:
            self.unmatched_catalog_items = []

        print(f"[+] Loaded {len(self.unmatched_catalog_items):,} unmatched HiAnime records to enrich.")

    def fetch_details(self, hid: str) -> Dict[str, Any]:
        """Fetches anime details with exponential backoff retry."""
        url = f"{self.base_url}/{urllib.parse.quote(hid)}"
        headers = {
            "User-Agent": "AniSora-Enricher/1.0",
            "Accept": "application/json"
        }

        for attempt in range(1, self.max_retries + 1):
            if self.shutdown_requested:
                return {}

            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    if resp.status == 200:
                        body = resp.read().decode("utf-8")
                        res_json = json.loads(body)
                        if res_json.get("success"):
                            return res_json.get("data") or {}
                    elif resp.status in (429, 500, 502, 503, 504):
                        backoff = attempt * 1.5
                        time.sleep(backoff)
                        continue
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
                backoff = attempt * 1.5
                time.sleep(backoff)
                continue
            except Exception:
                return {}

        return {}

    def run(self) -> None:
        """Main pipeline: fetches details, converts to schema, and appends to dataset & SQL."""
        print("=" * 66)
        print("[*] AniSora DB - Unmatched HiAnime Harvester & Schema Converter")
        print(f"[*] Input Unmatched:  {self.unmatched_json_path}")
        print(f"[*] Target JSONL:     {self.target_jsonl_path}")
        print(f"[*] Standalone JSON:  {self.output_standalone_json_path}")
        print(f"[*] Checkpoint SQL:   {self.checkpoint_sql_path}")
        print(f"[*] API Endpoint:     {self.base_url}/:id")
        print("=" * 66)

        self.load_existing_anisora_ids()
        self.load_unmatched_items()

        total_items = len(self.unmatched_catalog_items)
        if total_items == 0:
            print("[*] No unmatched anime found to process. Exiting.")
            return

        converted_records: List[Dict[str, Any]] = []
        sql_entry_rows: List[str] = []
        sql_anisora_rows: List[str] = []

        # Find starting line_index for SQL checkpoint entries
        starting_line_index = 41538  # 41,537 original anime + 1 header line
        if os.path.exists(self.target_jsonl_path):
            with open(self.target_jsonl_path, "r", encoding="utf-8") as f:
                starting_line_index = sum(1 for _ in f)

        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        start_time = time.time()

        print(f"\n[*] Harvesting details for {total_items} anime...")

        for idx, item in enumerate(self.unmatched_catalog_items, start=1):
            if self.shutdown_requested:
                print("\n[!] Pausing harvest early due to user interruption.")
                break

            hid = item.get("id")
            if not hid:
                continue

            t0 = time.time()
            details_data = self.fetch_details(hid)
            latency = time.time() - t0

            # Generate unique AniSora_Id
            aid = self.generate_anisora_id()

            # Convert to exact schema
            record = convert_hianime_details_to_schema(item, details_data, aid)
            converted_records.append(record)

            # Build SQL rows
            current_line_idx = starting_line_index + idx
            sql_entry_rows.append(
                f"({current_line_idx},{aid},'{hid}','COMPLETED',NULL,'{now_utc}')"
            )
            sql_anisora_rows.append(
                f"({aid},{current_line_idx})"
            )

            # Progress output
            elapsed = time.time() - start_time
            speed = idx / elapsed if elapsed > 0 else 0
            title_display = record["title"][:38].encode("ascii", errors="replace").decode("ascii")
            print(
                f"[{idx:3d}/{total_items}] ({idx/total_items*100:4.1f}%) | "
                f"ID: {aid} | "
                f"Latency: {latency:.2f}s | "
                f"Speed: {speed:.1f} req/s | "
                f"{title_display}"
            )

            if self.delay > 0:
                time.sleep(self.delay)

        # 1. Save Standalone Converted JSON
        print(f"\n[*] Saving standalone converted records to: {self.output_standalone_json_path}...")
        os.makedirs(os.path.dirname(self.output_standalone_json_path), exist_ok=True)
        standalone_payload = {
            "metadata": {
                "description": "HiAnime records harvested via /api/v1/hianime/anime/:id and converted to AniSora schema",
                "total_records": len(converted_records),
                "generated_at": datetime.now(timezone.utc).isoformat(),
            },
            "animes": converted_records
        }
        with open(self.output_standalone_json_path, "w", encoding="utf-8") as f:
            json.dump(standalone_payload, f, indent=2, ensure_ascii=False)

        # 2. Append records to anime_with_hianime.jsonl
        print(f"[*] Appending {len(converted_records)} enriched records to: {self.target_jsonl_path}...")
        with open(self.target_jsonl_path, "a", encoding="utf-8") as f:
            for rec in converted_records:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")

        # 3. Append to enrich_checkpoint.sql
        print(f"[*] Synchronizing SQL checkpoint in: {self.checkpoint_sql_path}...")
        self._append_to_checkpoint_sql(sql_entry_rows, sql_anisora_rows)

        total_elapsed = time.time() - start_time
        mins, secs = divmod(int(total_elapsed), 60)
        jsonl_size_mb = os.path.getsize(self.target_jsonl_path) / (1024 * 1024)
        standalone_size_kb = os.path.getsize(self.output_standalone_json_path) / 1024

        print("\n" + "=" * 66)
        print("[+] HARVEST & CONVERSION COMPLETE!")
        print(f"[*] Newly Enriched Records:    {len(converted_records):,}")
        print(f"[*] Elapsed Time:              {mins:02d}m {secs:02d}s")
        print(f"[*] Standalone Output:         {self.output_standalone_json_path} ({standalone_size_kb:.1f} KB)")
        print(f"[*] Main Database JSONL:       {self.target_jsonl_path} ({jsonl_size_mb:.2f} MB)")
        print(f"[*] Checkpoint SQL:            {self.checkpoint_sql_path}")
        print("=" * 66)

    def _append_to_checkpoint_sql(
        self,
        entry_rows: List[str],
        anisora_rows: List[str]
    ) -> None:
        """Appends new rows to enrich_checkpoint.sql transactionally."""
        if not entry_rows or not os.path.exists(self.checkpoint_sql_path):
            return

        with open(self.checkpoint_sql_path, "r", encoding="utf-8") as f:
            sql_content = f.read()

        # Remove trailing COMMIT;\n to append within the transaction
        if "COMMIT;" in sql_content:
            sql_content = sql_content.replace("COMMIT;", "")

        chunk_size = 1000
        new_sql_parts = []
        new_sql_parts.append("\n-- Appended Unmatched HiAnime Records\n")
        
        for i in range(0, len(entry_rows), chunk_size):
            chunk = entry_rows[i:i + chunk_size]
            new_sql_parts.append(f"INSERT INTO entries VALUES\n" + ",\n".join(chunk) + ";\n")

        for i in range(0, len(anisora_rows), chunk_size):
            chunk = anisora_rows[i:i + chunk_size]
            new_sql_parts.append(f"INSERT INTO anisora_ids VALUES\n" + ",\n".join(chunk) + ";\n")

        new_sql_parts.append("\nCOMMIT;\n")

        with open(self.checkpoint_sql_path, "w", encoding="utf-8") as f:
            f.write(sql_content.rstrip() + "\n" + "".join(new_sql_parts))


def main():
    parser = argparse.ArgumentParser(
        description="AniSora DB - Harvest unmatched HiAnime records and convert to schema"
    )
    parser.add_argument(
        "-i", "--input",
        default=DEFAULT_UNMATCHED_JSON,
        help=f"Input hianime_unmatched.json path (default: {DEFAULT_UNMATCHED_JSON})"
    )
    parser.add_argument(
        "-t", "--target",
        default=DEFAULT_TARGET_JSONL,
        help=f"Target anime_with_hianime.jsonl path (default: {DEFAULT_TARGET_JSONL})"
    )
    parser.add_argument(
        "-o", "--output-standalone",
        default=DEFAULT_OUTPUT_STANDALONE_JSON,
        help=f"Standalone converted JSON output path (default: {DEFAULT_OUTPUT_STANDALONE_JSON})"
    )
    parser.add_argument(
        "-s", "--sql",
        default=DEFAULT_CHECKPOINT_SQL,
        help=f"Checkpoint SQL path (default: {DEFAULT_CHECKPOINT_SQL})"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=DEFAULT_DELAY,
        help=f"Delay between API requests in seconds (default: {DEFAULT_DELAY}s)"
    )

    args = parser.parse_args()

    enricher = UnmatchedEnricher(
        unmatched_json_path=args.input,
        target_jsonl_path=args.target,
        output_standalone_json_path=args.output_standalone,
        checkpoint_sql_path=args.sql,
        delay=args.delay,
    )

    enricher.run()


if __name__ == "__main__":
    main()
