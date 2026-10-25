#!/usr/bin/env python3
"""
================================================================================
AniSora DB - HiAnime Catalog Harvester
================================================================================
Fetches all anime catalog records from the local HiAnime API service:
    /api/v1/hianime/az-list/all?page=1 -> page 2 -> page 3 ... -> end

Gathers comprehensive anime metadata:
  - id (HiAnime slug/ID, e.g. "attack-on-titan-112")
  - name (Title in English/Romaji)
  - jname (Title in Japanese/Kanji)
  - type (TV, MOVIE, OVA, ONA, SPECIAL, MUSIC)
  - duration (e.g. "24m")
  - poster (Poster image URL)
  - episodes (sub, dub, eps)

Saves incrementally to a structured JSON file so data is never lost.
Supports automatic resume, graceful pause (Ctrl+C), and polite rate pacing.
================================================================================
"""

import os
import sys
import json
import time
import signal
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Set
import argparse


DEFAULT_ENDPOINT = "http://localhost:4000/api/v1/hianime/az-list"
DEFAULT_LETTER = "all"
DEFAULT_OUTPUT_JSON = os.path.join("AniSoraDB", "hianime_catalog.json")
DEFAULT_DELAY = 0.35  # ~3 requests per second to avoid triggering Cloudflare 429
DEFAULT_TIMEOUT = 15.0
DEFAULT_RETRIES = 5


class HiAnimeHarvester:
    def __init__(
        self,
        base_url: str = DEFAULT_ENDPOINT,
        letter: str = DEFAULT_LETTER,
        output_file: str = DEFAULT_OUTPUT_JSON,
        start_page: int = 1,
        max_pages: Optional[int] = None,
        delay: float = DEFAULT_DELAY,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_RETRIES,
        resume: bool = True,
        save_interval: int = 5,
    ):
        self.base_url = base_url.rstrip("/")
        self.letter = letter.strip().lower()
        self.output_file = os.path.abspath(output_file)
        self.start_page = max(1, start_page)
        self.max_pages = max_pages
        self.delay = max(0.0, delay)
        self.timeout = timeout
        self.max_retries = max_retries
        self.resume = resume
        self.save_interval = max(1, save_interval)

        self.animes_by_id: Dict[str, Dict[str, Any]] = {}
        self.visited_pages: Set[int] = set()
        self.highest_scraped_page = 0
        self.is_completed = False
        self.shutdown_requested = False

        # Ensure destination directory exists
        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)

        # Register termination signal handlers
        signal.signal(signal.SIGINT, self._handle_interrupt)
        signal.signal(signal.SIGTERM, self._handle_interrupt)

    def _handle_interrupt(self, signum, frame):
        if not self.shutdown_requested:
            self.shutdown_requested = True
            print("\n\n[!] Interrupt detected (Ctrl+C). Saving all gathered data to disk...")
            self.save_data()
            print(f"[+] Progress successfully saved to: {self.output_file}")
            print("[+] You can safely resume anytime by running the script again.")
            sys.exit(0)

    def load_existing_data(self) -> None:
        """Loads existing catalog file if resume is enabled."""
        if not self.resume or not os.path.exists(self.output_file):
            return

        try:
            with open(self.output_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            if isinstance(data, dict):
                saved_animes = data.get("animes", [])
                meta = data.get("metadata", {})
                self.highest_scraped_page = meta.get("last_scraped_page") or data.get("last_scraped_page", 0)
                self.is_completed = meta.get("completed") or data.get("completed", False)
                if isinstance(data.get("visited_pages"), list):
                    self.visited_pages = set(data["visited_pages"])
            elif isinstance(data, list):
                saved_animes = data
                self.highest_scraped_page = max(
                    (a.get("scraped_from_page", 0) for a in saved_animes if isinstance(a, dict)),
                    default=0
                )
            else:
                saved_animes = []

            for item in saved_animes:
                if isinstance(item, dict) and "id" in item and item["id"]:
                    self.animes_by_id[item["id"]] = item
                    if "scraped_from_page" in item:
                        self.visited_pages.add(int(item["scraped_from_page"]))

            if self.visited_pages:
                self.highest_scraped_page = max(self.highest_scraped_page, max(self.visited_pages))

            if self.highest_scraped_page > 0 and self.start_page <= self.highest_scraped_page:
                self.start_page = self.highest_scraped_page + 1

            print(f"[Resume] Found {len(self.animes_by_id):,} previously gathered anime records.")
            print(f"[Resume] Last scraped page was: {self.highest_scraped_page}. Resuming from page: {self.start_page}")

            if self.is_completed:
                print("[Resume] Note: Catalog file was previously marked as fully completed.")
        except Exception as e:
            print(f"[!] Warning: Could not read existing output file ({e}). Starting fresh.")

    def save_data(self) -> None:
        """Atomically saves gathered records to the output JSON file."""
        anime_list = list(self.animes_by_id.values())
        payload = {
            "metadata": {
                "source": "HiAnime A-Z Catalog",
                "endpoint": f"{self.base_url}/{self.letter}",
                "letter": self.letter,
                "total_unique_animes": len(anime_list),
                "last_scraped_page": self.highest_scraped_page,
                "completed": self.is_completed,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            "visited_pages": sorted(list(self.visited_pages)),
            "animes": anime_list
        }

        temp_file = f"{self.output_file}.tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

        # Atomic replace
        if os.path.exists(self.output_file):
            try:
                os.replace(temp_file, self.output_file)
            except OSError:
                os.remove(self.output_file)
                os.replace(temp_file, self.output_file)
        else:
            os.replace(temp_file, self.output_file)

    def fetch_page(self, page: int) -> Optional[Dict[str, Any]]:
        """
        Fetches a single page from local API with retry and backoff.
        Returns the 'data' dictionary from API response or None.
        """
        url = f"{self.base_url}/{self.letter}?page={page}"
        headers = {
            "User-Agent": "AniSora-HiAnime-Harvester/1.0",
            "Accept": "application/json"
        }

        for attempt in range(1, self.max_retries + 1):
            if self.shutdown_requested:
                return None

            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    status = resp.status
                    body = resp.read().decode("utf-8")

                if status == 200:
                    data = json.loads(body)
                    if data.get("success"):
                        return data.get("data")
                    else:
                        print(f" [!] Page {page} returned success=false: {data.get('message')}")
                        return None

                if status in (429, 500, 502, 503, 504):
                    backoff = attempt * 1.5
                    print(f" [!] HTTP {status} on page {page}. Retrying in {backoff:.1f}s (Attempt {attempt}/{self.max_retries})...")
                    time.sleep(backoff)
                    continue

                print(f" [!] HTTP {status} on page {page}.")
                return None

            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 502, 503, 504):
                    backoff = attempt * 1.5
                    print(f" [!] HTTP {e.code} on page {page}. Retrying in {backoff:.1f}s (Attempt {attempt}/{self.max_retries})...")
                    time.sleep(backoff)
                    continue
                print(f" [!] HTTPError {e.code} on page {page}: {e.reason}")
                return None
            except (urllib.error.URLError, TimeoutError) as e:
                backoff = attempt * 1.0
                print(f" [!] Connection/Timeout on page {page}: {e}. Retrying in {backoff:.1f}s...")
                time.sleep(backoff)
                continue
            except Exception as e:
                print(f" [!] Unexpected error on page {page}: {e}")
                return None

        return None

    def run(self) -> None:
        """Main execution loop: gathers all pages until the end of catalog."""
        print("=" * 66)
        print("[*] AniSora DB - HiAnime Catalog Harvester")
        print(f"[*] Target Endpoint:  {self.base_url}/{self.letter}?page=<PAGE>")
        print(f"[*] Output File:      {self.output_file}")
        print(f"[*] Request Pacing:   {self.delay:.2f}s delay between pages")
        print(f"[*] Resume Enabled:   {self.resume}")
        print("=" * 66)

        self.load_existing_data()

        current_page = self.start_page
        pages_processed = 0
        total_pages_detected = None
        start_time = time.time()

        print(f"\n[*] Starting harvest at page {current_page}...")

        while not self.shutdown_requested:
            if self.max_pages and pages_processed >= self.max_pages:
                print(f"\n[*] Reached max pages limit ({self.max_pages}). Stopping.")
                break

            t0 = time.time()
            data = self.fetch_page(current_page)
            latency = time.time() - t0

            if not data:
                # If page 1 fails or consecutive pages fail
                print(f"\n[!] Failed to retrieve page {current_page} after {self.max_retries} attempts.")
                print("[!] Stopping harvester safely. You can resume later.")
                break

            animes = data.get("animes", [])
            has_next_page = data.get("hasNextPage", False)
            reported_total_pages = data.get("totalPages")

            if reported_total_pages and reported_total_pages > (total_pages_detected or 0):
                total_pages_detected = reported_total_pages

            if not animes:
                print(f"\n[*] Page {current_page} returned 0 anime. End of catalog reached!")
                self.is_completed = True
                break

            # Process and store anime items
            new_count = 0
            for item in animes:
                if not isinstance(item, dict):
                    continue
                anime_id = item.get("id")
                if not anime_id:
                    continue

                # Add extra harvesting metadata
                cleaned_entry = {
                    "id": anime_id,
                    "name": item.get("name", "").strip(),
                    "jname": item.get("jname", "").strip() if item.get("jname") else None,
                    "type": item.get("type"),
                    "duration": item.get("duration"),
                    "episodes": item.get("episodes", {}),
                    "poster": item.get("poster"),
                    "scraped_from_page": current_page,
                }

                if anime_id not in self.animes_by_id:
                    new_count += 1
                self.animes_by_id[anime_id] = cleaned_entry

            self.visited_pages.add(current_page)
            self.highest_scraped_page = max(self.highest_scraped_page, current_page)
            pages_processed += 1

            # Progress metrics
            elapsed = time.time() - start_time
            speed = pages_processed / elapsed if elapsed > 0 else 0
            total_str = f"/{total_pages_detected}" if total_pages_detected else ""
            print(
                f"[Page {current_page}{total_str}] +{new_count:2d} new | "
                f"Total: {len(self.animes_by_id):,} unique | "
                f"Latency: {latency:.2f}s | Speed: {speed:.1f} p/s"
            )

            # Periodic save
            if pages_processed % self.save_interval == 0:
                self.save_data()

            if not has_next_page:
                print(f"\n[*] HiAnime reported hasNextPage=False at page {current_page}. Reached end of catalog!")
                self.is_completed = True
                break

            current_page += 1

            # Polite pacing delay
            if self.delay > 0:
                time.sleep(self.delay)

        # Final save
        self.save_data()

        total_elapsed = time.time() - start_time
        mins, secs = divmod(int(total_elapsed), 60)
        file_size_mb = os.path.getsize(self.output_file) / (1024 * 1024)

        print("\n" + "=" * 66)
        print("[+] HARVEST RUN FINISHED!")
        print(f"[*] Total Unique Anime:   {len(self.animes_by_id):,}")
        print(f"[*] Pages Harvested:      {pages_processed:,}")
        print(f"[*] Highest Page:         {self.highest_scraped_page}")
        print(f"[*] Catalog Complete:     {self.is_completed}")
        print(f"[*] Time Elapsed:         {mins:02d}m {secs:02d}s")
        print(f"[*] File Size:            {file_size_mb:.2f} MB")
        print(f"[*] Saved To:             {self.output_file}")
        print("=" * 66)


def main():
    parser = argparse.ArgumentParser(
        description="AniSora DB - Gather all anime records from HiAnime catalog (/api/v1/hianime/az-list/all)"
    )
    parser.add_argument(
        "--api-url",
        default=DEFAULT_ENDPOINT,
        help=f"HiAnime az-list endpoint URL (default: {DEFAULT_ENDPOINT})"
    )
    parser.add_argument(
        "--letter",
        default=DEFAULT_LETTER,
        help="Catalog directory letter: 'all', 'a'-'z', '0-9', 'other' (default: all)"
    )
    parser.add_argument(
        "-o", "--output",
        default=DEFAULT_OUTPUT_JSON,
        help=f"Output JSON file path (default: {DEFAULT_OUTPUT_JSON})"
    )
    parser.add_argument(
        "--start-page",
        type=int,
        default=1,
        help="Page number to begin scraping from (default: 1)"
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help="Optional maximum number of pages to process (default: all pages)"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=DEFAULT_DELAY,
        help=f"Delay between page requests in seconds (default: {DEFAULT_DELAY}s)"
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=DEFAULT_TIMEOUT,
        help=f"HTTP request timeout in seconds (default: {DEFAULT_TIMEOUT}s)"
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=DEFAULT_RETRIES,
        help=f"Max retry attempts on error (default: {DEFAULT_RETRIES})"
    )
    parser.add_argument(
        "--save-interval",
        type=int,
        default=5,
        help="Save to disk every N pages (default: 5)"
    )
    parser.add_argument(
        "--no-resume",
        action="store_true",
        help="Ignore existing output file and start from page 1"
    )

    args = parser.parse_args()

    harvester = HiAnimeHarvester(
        base_url=args.api_url,
        letter=args.letter,
        output_file=args.output,
        start_page=args.start_page,
        max_pages=args.max_pages,
        delay=args.delay,
        timeout=args.timeout,
        max_retries=args.retries,
        resume=not args.no_resume,
        save_interval=args.save_interval,
    )

    harvester.run()


if __name__ == "__main__":
    main()
