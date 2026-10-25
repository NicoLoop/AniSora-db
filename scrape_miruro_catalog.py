#!/usr/bin/env python3
"""
================================================================================
Miruro.tv Catalog Harvester & Cursor-Based Scraper
================================================================================
Scrapes all anime titles and IDs from https://miruro.tv/search to page infinity.

Architecture & Mechanism Discovered from Miruro (SvelteKit):
  - Target URL: https://miruro.tv/search/__data.json?cursor=<cursor_token>
  - Mode: anime (default search mode)
  - Initial load (page 1): https://miruro.tv/search/__data.json (cursor is empty)
  - Pagination token: Miruro uses a base64-encoded encrypted cursor ('nextCursor').
    When 'Next' is clicked, Miruro reads `r.data.nextCursor` and updates the URL
    to `?cursor=<nextCursor>`.
  - Termination: `r.data.hasMore` becomes False or `nextCursor` is None/empty.
  - Data structure: SvelteKit Devalue format, flattened index-dereferenced graph
    providing rich anime objects including internal Miruro ID, titles (English,
    Romaji, Native), format, episodes, status, season, and external cross-references
    (MAL, AniList, Kitsu, AniDB, etc.).

Features:
  - Streaming line-by-line JSONL write (zero data loss on exit).
  - Automatic JSON export.
  - Resumable checkpointing via AniSoraDB/miruro_checkpoint.json.
  - Graceful Ctrl+C handling.
  - Configurable rate-limiting and backoff.
================================================================================
"""

import os
import sys
import json
import time
import signal
import argparse
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple, Set

# Ensure UTF-8 output on Windows console
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DEFAULT_OUTPUT_JSONL = os.path.join("AniSoraDB", "miruro_catalog.jsonl")
DEFAULT_OUTPUT_JSON = os.path.join("AniSoraDB", "miruro_catalog.json")
DEFAULT_CHECKPOINT_JSON = os.path.join("AniSoraDB", "miruro_checkpoint.json")

DEFAULT_BASE_URL = "https://miruro.tv/search/__data.json"
DEFAULT_DELAY = 0.35  # ~3 requests per second
DEFAULT_TIMEOUT = 15.0
DEFAULT_MAX_RETRIES = 5

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


def devalue_dereference(flat_data: List[Any], idx: Any, seen: Optional[Set[int]] = None) -> Any:
    """
    Safely resolves SvelteKit devalue serialized references into a nested Python structure.
    Protects against circular reference loops using a visited index set.
    """
    if seen is None:
        seen = set()

    if not isinstance(idx, int) or idx < 0 or idx >= len(flat_data):
        return idx

    if idx in seen:
        return None

    seen.add(idx)
    raw_val = flat_data[idx]

    if isinstance(raw_val, dict):
        return {k: devalue_dereference(flat_data, v, seen.copy()) for k, v in raw_val.items()}
    elif isinstance(raw_val, list):
        return [devalue_dereference(flat_data, item, seen.copy()) for item in raw_val]
    else:
        return raw_val


def parse_miruro_page_data(json_response: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Optional[str], bool]:
    """
    Parses Miruro's SvelteKit data response.
    Returns:
        (anime_items, next_cursor, has_more)
    """
    nodes = json_response.get("nodes", [])
    if len(nodes) < 2:
        return [], None, False

    node1 = nodes[1]
    if node1.get("type") != "data" or "data" not in node1:
        return [], None, False

    flat_data = node1["data"]
    if not flat_data or not isinstance(flat_data[0], dict):
        return [], None, False

    root = flat_data[0]

    # Dereference nextCursor and hasMore
    next_cursor_idx = root.get("nextCursor")
    next_cursor = devalue_dereference(flat_data, next_cursor_idx) if next_cursor_idx is not None else None
    if isinstance(next_cursor, str):
        next_cursor = next_cursor.strip()
        if not next_cursor:
            next_cursor = None
    else:
        next_cursor = None

    has_more_idx = root.get("hasMore")
    has_more_val = devalue_dereference(flat_data, has_more_idx) if has_more_idx is not None else False
    has_more = bool(has_more_val)

    # Dereference anime items
    items_raw = root.get("items")
    item_indices = flat_data[items_raw] if isinstance(items_raw, int) and items_raw < len(flat_data) else []

    items = []
    if isinstance(item_indices, list):
        for idx in item_indices:
            resolved_item = devalue_dereference(flat_data, idx)
            if isinstance(resolved_item, dict):
                items.append(resolved_item)

    return items, next_cursor, has_more


class MiruroScraper:
    def __init__(
        self,
        output_jsonl: str = DEFAULT_OUTPUT_JSONL,
        output_json: str = DEFAULT_OUTPUT_JSON,
        checkpoint_file: str = DEFAULT_CHECKPOINT_JSON,
        delay: float = DEFAULT_DELAY,
        max_pages: Optional[int] = None,
        search_query: str = "",
    ):
        self.output_jsonl = output_jsonl
        self.output_json = output_json
        self.checkpoint_file = checkpoint_file
        self.delay = delay
        self.max_pages = max_pages
        self.search_query = search_query.strip()

        self.current_page = 1
        self.current_cursor: Optional[str] = None
        self.seen_ids: Set[str] = set()
        self.total_scraped = 0
        self.stop_requested = False

        self._load_checkpoint()
        self._setup_signals()

    def _setup_signals(self):
        def handle_signal(sig, frame):
            print("\n[!] Graceful shutdown requested (Ctrl+C). Finishing current step...")
            self.stop_requested = True

        signal.signal(signal.SIGINT, handle_signal)
        if hasattr(signal, "SIGTERM"):
            signal.signal(signal.SIGTERM, handle_signal)

    def _load_checkpoint(self):
        """Loads state from checkpoint and existing output file if present."""
        os.makedirs(os.path.dirname(os.path.abspath(self.output_jsonl)), exist_ok=True)

        if os.path.exists(self.checkpoint_file):
            try:
                with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                    cp = json.load(f)
                    self.current_page = cp.get("last_page", 0) + 1
                    self.current_cursor = cp.get("next_cursor")
                    self.seen_ids = set(cp.get("seen_ids", []))
                    self.total_scraped = len(self.seen_ids)
                    print(
                        f"[*] Resuming from Checkpoint: Page {self.current_page} | "
                        f"Already Scraped: {self.total_scraped:,} unique animes"
                    )
                    return
            except Exception as e:
                print(f"[!] Warning reading checkpoint: {e}. Starting fresh.")

        # If no checkpoint but output_jsonl exists, read existing IDs
        if os.path.exists(self.output_jsonl):
            try:
                with open(self.output_jsonl, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            rec = json.loads(line)
                            aid = rec.get("id")
                            if aid:
                                self.seen_ids.add(aid)
                self.total_scraped = len(self.seen_ids)
                print(f"[*] Found {self.total_scraped:,} existing records in {self.output_jsonl}.")
            except Exception as e:
                print(f"[!] Warning reading existing JSONL: {e}")

    def _save_checkpoint(self, last_page: int, next_cursor: Optional[str], completed: bool = False):
        """Saves current scraper checkpoint state to disk."""
        cp_data = {
            "last_page": last_page,
            "next_cursor": next_cursor,
            "total_unique": len(self.seen_ids),
            "completed": completed,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "seen_ids": list(self.seen_ids),
        }
        temp_path = self.checkpoint_file + ".tmp"
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(cp_data, f, indent=2)
        os.replace(temp_path, self.checkpoint_file)

    def _fetch_page(self, cursor: Optional[str]) -> Optional[Dict[str, Any]]:
        """Fetches SvelteKit data payload with retry and exponential backoff."""
        params = {}
        if self.search_query:
            params["q"] = self.search_query
        if cursor:
            params["cursor"] = cursor

        query_string = f"?{urllib.parse.urlencode(params)}" if params else ""
        url = f"{DEFAULT_BASE_URL}{query_string}"

        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://miruro.tv/search",
        }

        for attempt in range(1, DEFAULT_MAX_RETRIES + 1):
            if self.stop_requested:
                return None
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=DEFAULT_TIMEOUT) as res:
                    raw_bytes = res.read()
                    data = json.loads(raw_bytes.decode("utf-8"))
                    return data
            except urllib.error.HTTPError as e:
                print(f"    [!] HTTP error {e.code} on {url}: {e.reason} (Attempt {attempt}/{DEFAULT_MAX_RETRIES})")
            except Exception as e:
                print(f"    [!] Network error on {url}: {e} (Attempt {attempt}/{DEFAULT_MAX_RETRIES})")

            if attempt < DEFAULT_MAX_RETRIES:
                backoff = attempt * 2.0
                time.sleep(backoff)

        return None

    def _format_anime_record(self, raw_item: Dict[str, Any], page_num: int, cursor_used: Optional[str]) -> Dict[str, Any]:
        """Formats raw Miruro anime object into a clean, structured record."""
        aid = raw_item.get("id")
        title_dict = raw_item.get("title") or {}
        if not isinstance(title_dict, dict):
            title_dict = {}

        eng = title_dict.get("english")
        romaji = title_dict.get("romaji")
        native = title_dict.get("native")

        # Primary display name: English > Romaji > Native > Unknown
        primary_name = eng or romaji or native or aid or "Unknown"

        # Season dict
        season_name = raw_item.get("season")
        season_year = raw_item.get("season_year")
        season_dict = None
        if season_name or season_year:
            season_dict = {
                "season": season_name,
                "year": season_year,
            }

        ext_ids = raw_item.get("external_ids") or {}

        return {
            "id": aid,
            "name": primary_name,
            "title": {
                "english": eng,
                "romaji": romaji,
                "native": native,
            },
            "format": raw_item.get("format"),
            "status": raw_item.get("status"),
            "episodes": raw_item.get("episode_count"),
            "episode_duration_minutes": raw_item.get("episode_duration_minutes"),
            "season": season_dict,
            "average_score": raw_item.get("average_score"),
            "popularity": raw_item.get("popularity"),
            "is_adult": raw_item.get("is_adult", False),
            "genres": raw_item.get("genres", []),
            "external_ids": ext_ids,
            "source_miruro_url": f"https://miruro.tv/watch/{aid}" if aid else None,
            "scraped_at_page": page_num,
            "cursor": cursor_used,
        }

    def run(self):
        """Main scraping loop running to page infinity or termination."""
        print("=" * 76)
        print("          MIRURO.TV CATALOG HARVESTER & CURSOR SCRAPER")
        print("=" * 76)
        print(f"[*] Base Endpoint:      {DEFAULT_BASE_URL}")
        print(f"[*] Query:              {repr(self.search_query) if self.search_query else '(All Anime)'}")
        print(f"[*] Output (JSONL):     {self.output_jsonl}")
        print(f"[*] Output (JSON):      {self.output_json}")
        print(f"[*] Checkpoint:         {self.checkpoint_file}")
        print(f"[*] Rate Limit Delay:   {self.delay:.2f}s")
        print(f"[*] Max Pages:          {self.max_pages or 'Infinity (until hasMore=False)'}")
        print("=" * 76 + "\n")

        start_time = time.time()
        pages_scraped_this_run = 0
        new_items_this_run = 0

        # Open JSONL in append mode for real-time streaming writes
        with open(self.output_jsonl, "a", encoding="utf-8") as out_f:
            while not self.stop_requested:
                if self.max_pages and pages_scraped_this_run >= self.max_pages:
                    print(f"\n[*] Reached user-specified limit of {self.max_pages} pages.")
                    break

                page_num = self.current_page
                cursor_to_send = self.current_cursor
                cursor_preview = f"{cursor_to_send[:20]}..." if cursor_to_send else "(Page 1 / None)"

                t0 = time.time()
                data = self._fetch_page(cursor_to_send)
                latency = time.time() - t0

                if data is None:
                    print(f"\n[!] Failed to retrieve data for page {page_num} after retries. Pausing.")
                    break

                items, next_cursor, has_more = parse_miruro_page_data(data)

                # Process and write items
                added_on_page = 0
                sample_name = ""
                for it in items:
                    record = self._format_anime_record(it, page_num, cursor_to_send)
                    aid = record["id"]
                    if aid and aid not in self.seen_ids:
                        self.seen_ids.add(aid)
                        out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        out_f.flush()
                        added_on_page += 1
                        new_items_this_run += 1
                        if not sample_name:
                            sample_name = record["name"]

                self.total_scraped = len(self.seen_ids)
                pages_scraped_this_run += 1

                name_display = sample_name[:36] if sample_name else "(no new titles)"
                print(
                    f"Page {page_num:4d} | "
                    f"Fetched: {len(items):2d} | "
                    f"New: {added_on_page:2d} | "
                    f"Total: {self.total_scraped:6,d} | "
                    f"{latency:.2f}s | "
                    f"NextCursor: {('Found' if next_cursor else 'None'):5s} | "
                    f"{name_display}"
                )

                # Check termination conditions
                if not has_more or not next_cursor:
                    print("\n[+] Reached end of catalog (hasMore=False or no nextCursor).")
                    self._save_checkpoint(page_num, None, completed=True)
                    break

                # Update cursor state for next iteration
                self.current_cursor = next_cursor
                self.current_page += 1
                self._save_checkpoint(page_num, next_cursor, completed=False)

                if self.delay > 0:
                    time.sleep(self.delay)

        elapsed = time.time() - start_time
        mins, secs = divmod(int(elapsed), 60)

        # Export full catalog to readable JSON
        self._export_to_json()

        print("\n" + "=" * 76)
        print("[+] HARVEST RUN FINISHED")
        print(f"[*] Pages Harvested This Run: {pages_scraped_this_run}")
        print(f"[*] New Anime Added This Run: {new_items_this_run:,}")
        print(f"[*] Total Unique Animes:      {self.total_scraped:,}")
        print(f"[*] Total Time Elapsed:       {mins:02d}m {secs:02d}s")
        print(f"[*] JSONL Output:             {self.output_jsonl}")
        print(f"[*] JSON Output:              {self.output_json}")
        print(f"[*] Checkpoint File:          {self.checkpoint_file}")
        print("=" * 76)

    def _export_to_json(self):
        """Converts the JSONL file into a structured standalone JSON array file."""
        if not os.path.exists(self.output_jsonl):
            return

        print(f"[*] Exporting complete catalog to {self.output_json}...")
        records = []
        try:
            with open(self.output_jsonl, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        records.append(json.loads(line))

            payload = {
                "metadata": {
                    "source": "https://miruro.tv/search",
                    "total_records": len(records),
                    "exported_at": datetime.now(timezone.utc).isoformat(),
                },
                "animes": records,
            }
            with open(self.output_json, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
            size_kb = os.path.getsize(self.output_json) / 1024
            print(f"[+] Saved {len(records):,} records to {self.output_json} ({size_kb:.1f} KB)")
        except Exception as e:
            print(f"[!] Error exporting JSON: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Miruro.tv Catalog Harvester & Infinite Cursor Scraper"
    )
    parser.add_argument(
        "-o", "--output-jsonl",
        default=DEFAULT_OUTPUT_JSONL,
        help=f"Path to streaming JSONL output (default: {DEFAULT_OUTPUT_JSONL})"
    )
    parser.add_argument(
        "-j", "--output-json",
        default=DEFAULT_OUTPUT_JSON,
        help=f"Path to JSON output (default: {DEFAULT_OUTPUT_JSON})"
    )
    parser.add_argument(
        "-c", "--checkpoint",
        default=DEFAULT_CHECKPOINT_JSON,
        help=f"Path to checkpoint JSON (default: {DEFAULT_CHECKPOINT_JSON})"
    )
    parser.add_argument(
        "-d", "--delay",
        type=float,
        default=DEFAULT_DELAY,
        help=f"Polite delay between requests in seconds (default: {DEFAULT_DELAY}s)"
    )
    parser.add_argument(
        "-p", "--pages",
        type=int,
        default=None,
        help="Maximum pages to scrape (default: unlimited / infinity)"
    )
    parser.add_argument(
        "-q", "--query",
        default="",
        help="Optional search query filter (default: empty for full catalog)"
    )

    args = parser.parse_args()

    scraper = MiruroScraper(
        output_jsonl=args.output_jsonl,
        output_json=args.output_json,
        checkpoint_file=args.checkpoint,
        delay=args.delay,
        max_pages=args.pages,
        search_query=args.query,
    )
    scraper.run()


if __name__ == "__main__":
    main()
