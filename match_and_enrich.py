#!/usr/bin/env python3
"""
================================================================================
AniSora DB - Offline Catalog Matcher & Enricher
================================================================================
Compares anime-offline-database.jsonl against hianime_catalog.json.
Enriches each anime record with:
  - AniSora_Id: Cryptographically unique 9-digit integer (100000000..999999999)
  - Hianime_Id: Matched HiAnime slug ID (e.g. "attack-on-titan-112") or null

Outputs:
  1. anime_with_hianime.jsonl (line-by-line JSON with preserved header)
  2. enrich_checkpoint.sql (fully populated SQL dump for instant database restore)
================================================================================
"""

import os
import sys
import json
import time
import re
import secrets
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple, Set
import argparse


DEFAULT_OFFLINE_DB = os.path.join("AniSoraDB", "anime-offline-database.jsonl")
DEFAULT_HIANIME_CATALOG = os.path.join("AniSoraDB", "hianime_catalog.json")
DEFAULT_OUTPUT_JSONL = "anime_with_hianime.jsonl"
DEFAULT_CHECKPOINT_SQL = "enrich_checkpoint.sql"

MIN_ANISORA_ID = 100000000
MAX_ANISORA_ID = 999999999


def normalize(s: Optional[str]) -> str:
    """Normalizes title string for accurate, case-insensitive comparison."""
    if not s:
        return ""
    s = s.lower().strip()
    s = re.sub(r'[\'\"“”‘’`「」『』\(\)\[\]\{\}・]', '', s)
    s = re.sub(r'[\s\-_:;,./\\!?@#%^&*+=~|]+', ' ', s).strip()
    return s


def normalize_type(t: Optional[str]) -> str:
    """Normalizes anime type strings across databases."""
    if not t:
        return ""
    t = str(t).upper().strip()
    if t in ("TV", "TV SERIES"):
        return "TV"
    if t in ("MOVIE", "FILM"):
        return "MOVIE"
    if t in ("OVA", "OAV"):
        return "OVA"
    if t in ("ONA", "WEB"):
        return "ONA"
    if t in ("SPECIAL", "SPECIALS"):
        return "SPECIAL"
    if t in ("MUSIC", "MUSIC VIDEO", "MV"):
        return "MUSIC"
    return t


def slug_to_title(slug: str) -> str:
    """Extracts human-readable title from HiAnime slug (e.g. '86-eighty-six-part-2-1421')."""
    slug = re.sub(r'-\d+$', '', slug)  # remove trailing numeric id
    return normalize(slug.replace('-', ' '))


def season_variations(title_norm: str) -> List[str]:
    """Generates cross-convention variations (e.g., '2nd season' <-> 'season 2' <-> 'part 2')."""
    vars_list = [title_norm]
    # '2nd season' -> 'season 2'
    s2 = re.sub(r'\b(\d+)(st|nd|rd|th) season\b', r'season \1', title_norm)
    if s2 != title_norm:
        vars_list.append(s2)
    # 'season 2' -> '2nd season'
    num_to_ord = {'1': '1st', '2': '2nd', '3': '3rd', '4': '4th', '5': '5th'}
    m = re.search(r'\bseason (\d+)\b', title_norm)
    if m and m.group(1) in num_to_ord:
        vars_list.append(re.sub(r'\bseason (\d+)\b', f'{num_to_ord[m.group(1)]} season', title_norm))
    # 'part 2' <-> 'season 2'
    p2 = re.sub(r'\bpart (\d+)\b', r'season \1', title_norm)
    if p2 != title_norm:
        vars_list.append(p2)
    p3 = re.sub(r'\bseason (\d+)\b', r'part \1', title_norm)
    if p3 != title_norm:
        vars_list.append(p3)
    return list(set(vars_list))



class AniSoraMatcher:
    def __init__(
        self,
        offline_db_path: str = DEFAULT_OFFLINE_DB,
        hianime_catalog_path: str = DEFAULT_HIANIME_CATALOG,
        output_jsonl_path: str = DEFAULT_OUTPUT_JSONL,
        checkpoint_sql_path: str = DEFAULT_CHECKPOINT_SQL,
    ):
        self.offline_db_path = os.path.abspath(offline_db_path)
        self.hianime_catalog_path = os.path.abspath(hianime_catalog_path)
        self.output_jsonl_path = os.path.abspath(output_jsonl_path)
        self.checkpoint_sql_path = os.path.abspath(checkpoint_sql_path)

        self.hianime_list: List[Dict[str, Any]] = []
        self.by_title_and_type: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
        self.by_title: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        self.used_anisora_ids: Set[int] = set()

    def load_hianime_catalog(self) -> None:
        """Loads and indexes the HiAnime catalog for sub-millisecond lookups."""
        if not os.path.exists(self.hianime_catalog_path):
            raise FileNotFoundError(
                f"HiAnime catalog file not found at: {self.hianime_catalog_path}. "
                f"Please run 'py gather_hianime.py' first."
            )

        print(f"[*] Loading HiAnime catalog from: {self.hianime_catalog_path}...")
        t0 = time.time()
        with open(self.hianime_catalog_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, dict):
            self.hianime_list = data.get("animes", [])
        elif isinstance(data, list):
            self.hianime_list = data
        else:
            self.hianime_list = []

        print(f"[+] Loaded {len(self.hianime_list):,} HiAnime records in {time.time()-t0:.2f}s.")
        print("[*] Building multi-level index (Title + Japanese Title + Format Type)...")

        for h in self.hianime_list:
            htype = normalize_type(h.get("type"))
            slug_name = slug_to_title(h.get("id") or "")
            names_to_index = []
            
            n = normalize(h.get("name"))
            if n:
                names_to_index.append(n)
            
            jn = normalize(h.get("jname"))
            if jn and jn != n:
                names_to_index.append(jn)

            if slug_name and slug_name not in names_to_index:
                names_to_index.append(slug_name)

            for name in names_to_index:
                for v in season_variations(name):
                    self.by_title[v].append(h)
                    if htype:
                        self.by_title_and_type[(v, htype)].append(h)

        print(f"[+] Indexed {len(self.by_title):,} unique title keys.")

    def generate_anisora_id(self, existing_id: Optional[int] = None) -> int:
        """Generates or validates a unique 9-digit integer AniSora ID."""
        if (
            existing_id is not None
            and isinstance(existing_id, int)
            and MIN_ANISORA_ID <= existing_id <= MAX_ANISORA_ID
            and existing_id not in self.used_anisora_ids
        ):
            self.used_anisora_ids.add(existing_id)
            return existing_id

        total_range = MAX_ANISORA_ID - MIN_ANISORA_ID + 1
        for _ in range(2000):
            candidate = secrets.randbelow(total_range) + MIN_ANISORA_ID
            if candidate not in self.used_anisora_ids:
                self.used_anisora_ids.add(candidate)
                return candidate

        raise RuntimeError("Failed to generate unique AniSora ID: collision pool full.")

    def match_entry(self, entry: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
        """
        Determines the optimal HiAnime match using hierarchical strategy:
        1. Exact Title + Format Type match (including season variations)
        2. Exact Title match (type filtered if collision)
        3. Synonym + Format Type match
        4. Synonym match
        """
        title = entry.get("title") or ""
        synonyms = entry.get("synonyms") or []
        target_type = normalize_type(entry.get("type"))

        t_norm = normalize(title)
        t_variations = season_variations(t_norm) if t_norm else []

        # 1. Exact Title + Type (including season variations)
        if target_type:
            for v in t_variations:
                candidates = self.by_title_and_type.get((v, target_type))
                if candidates:
                    return candidates[0]["id"], "exact_title_and_type"

        # 2. Exact Title (any type)
        for v in t_variations:
            if v in self.by_title:
                candidates = self.by_title[v]
                type_filtered = [c for c in candidates if normalize_type(c.get("type")) == target_type]
                if type_filtered:
                    return type_filtered[0]["id"], "exact_title_type_filtered"
                return candidates[0]["id"], "exact_title"

        # 3. Synonym + Type
        if target_type:
            for syn in synonyms:
                s_norm = normalize(syn)
                if s_norm:
                    for v in season_variations(s_norm):
                        candidates = self.by_title_and_type.get((v, target_type))
                        if candidates:
                            return candidates[0]["id"], "synonym_and_type"

        # 4. Synonym (any type)
        for syn in synonyms:
            s_norm = normalize(syn)
            if s_norm:
                for v in season_variations(s_norm):
                    if v in self.by_title:
                        candidates = self.by_title[v]
                        type_filtered = [c for c in candidates if normalize_type(c.get("type")) == target_type]
                        if type_filtered:
                            return type_filtered[0]["id"], "synonym_type_filtered"
                        return candidates[0]["id"], "synonym"

        return None, None

    def run(self) -> None:
        """Processes the dataset, performs matching, and writes output files."""
        print("=" * 66)
        print("[*] AniSora DB - Offline Catalog Matcher & Enricher")
        print(f"[*] Input Dataset:     {self.offline_db_path}")
        print(f"[*] HiAnime Catalog:   {self.hianime_catalog_path}")
        print(f"[*] Output JSONL:      {self.output_jsonl_path}")
        print(f"[*] Checkpoint SQL:    {self.checkpoint_sql_path}")
        print("=" * 66)

        self.load_hianime_catalog()

        if not os.path.exists(self.offline_db_path):
            raise FileNotFoundError(f"Offline dataset not found: {self.offline_db_path}")

        print(f"\n[*] Processing records from: {self.offline_db_path}...")
        start_time = time.time()

        total_entries = 0
        matched_entries = 0
        no_match_entries = 0
        matched_hianime_ids: Set[str] = set()

        method_counts = defaultdict(int)

        entries_sql_rows: List[str] = []
        anisora_sql_rows: List[str] = []

        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

        temp_jsonl_path = f"{self.output_jsonl_path}.tmp"

        with open(self.offline_db_path, "r", encoding="utf-8") as in_f, \
             open(temp_jsonl_path, "w", encoding="utf-8", buffering=262144) as out_f:
            
            # Line 1: Header metadata
            first_line = in_f.readline()
            out_f.write(first_line.strip() + "\n")

            line_index = 1
            for raw_line in in_f:
                raw_line = raw_line.strip()
                if not raw_line:
                    continue

                entry = json.loads(raw_line)
                total_entries += 1

                # 1. Assign unique 9-digit AniSora_Id
                anisora_id = self.generate_anisora_id(entry.get("AniSora_Id"))
                entry["AniSora_Id"] = anisora_id

                # 2. Match HiAnime ID
                hianime_id, method = self.match_entry(entry)
                entry["Hianime_Id"] = hianime_id

                if hianime_id:
                    matched_entries += 1
                    matched_hianime_ids.add(hianime_id)
                    method_counts[method] += 1
                    status = "COMPLETED"
                    err_msg = "NULL"
                else:
                    no_match_entries += 1
                    status = "NO_MATCH"
                    err_msg = "NULL"

                # 3. Stream output JSONL
                out_f.write(json.dumps(entry, ensure_ascii=False) + "\n")

                # 4. Prepare SQL rows
                hid_sql = f"'{hianime_id}'" if hianime_id else "NULL"
                entries_sql_rows.append(
                    f"({line_index},{anisora_id},{hid_sql},'{status}',{err_msg},'{now_utc}')"
                )
                anisora_sql_rows.append(
                    f"({anisora_id},{line_index})"
                )

                line_index += 1

                if total_entries % 10000 == 0:
                    pct = total_entries / 41537 * 100
                    print(f"[*] Processed {total_entries:,} / 41,537 ({pct:.1f}%) | Matches: {matched_entries:,}...")

        # Atomic replace JSONL
        if os.path.exists(self.output_jsonl_path):
            try:
                os.replace(temp_jsonl_path, self.output_jsonl_path)
            except OSError:
                os.remove(self.output_jsonl_path)
                os.replace(temp_jsonl_path, self.output_jsonl_path)
        else:
            os.replace(temp_jsonl_path, self.output_jsonl_path)

        # Write SQL Checkpoint file
        print(f"\n[*] Generating SQL checkpoint file: {self.checkpoint_sql_path}...")
        self._write_checkpoint_sql(entries_sql_rows, anisora_sql_rows, total_entries, matched_entries)

        elapsed = time.time() - start_time
        file_size_mb = os.path.getsize(self.output_jsonl_path) / (1024 * 1024)
        sql_size_mb = os.path.getsize(self.checkpoint_sql_path) / (1024 * 1024)

        print("\n" + "=" * 66)
        print("[+] MATCHING & ENRICHMENT COMPLETE!")
        print(f"[*] Total Anime Processed:     {total_entries:,}")
        print(f"[+] HiAnime Matches Found:     {matched_entries:,} ({matched_entries/total_entries*100:.2f}%)")
        print(f"[-] No Matches:                {no_match_entries:,} ({no_match_entries/total_entries*100:.2f}%)")
        print(f"[*] HiAnime Catalog Coverage:  {len(matched_hianime_ids):,} / {len(self.hianime_list):,} ({len(matched_hianime_ids)/len(self.hianime_list)*100:.2f}%)")
        print("--- Match Strategy Breakdown ---")
        for m, cnt in sorted(method_counts.items(), key=lambda x: -x[1]):
            print(f"  - {m:26s}: {cnt:,}")
        print("--- Output Files ---")
        print(f"[*] Enriched JSONL:            {self.output_jsonl_path} ({file_size_mb:.2f} MB)")
        print(f"[*] Checkpoint SQL:            {self.checkpoint_sql_path} ({sql_size_mb:.2f} MB)")
        print(f"[*] Total Time:                {elapsed:.2f} seconds ({total_entries/elapsed:,.0f} entries/sec)")
        print("=" * 66)

    def _write_checkpoint_sql(
        self,
        entries_rows: List[str],
        anisora_rows: List[str],
        total: int,
        matches: int
    ) -> None:
        """Writes fully transactional SQL checkpoint dump."""
        temp_sql = f"{self.checkpoint_sql_path}.tmp"
        chunk_size = 1000

        with open(temp_sql, "w", encoding="utf-8") as f:
            f.write("-- AniSoraDB Checkpoint Dump\n")
            f.write("BEGIN TRANSACTION;\n\n")

            f.write("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);\n")
            f.write("CREATE TABLE IF NOT EXISTS anisora_ids (anisora_id INTEGER PRIMARY KEY, line_index INTEGER NOT NULL);\n")
            f.write("CREATE TABLE IF NOT EXISTS search_cache (query_key TEXT PRIMARY KEY, hianime_id TEXT, status TEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);\n")
            f.write("CREATE TABLE IF NOT EXISTS entries (line_index INTEGER PRIMARY KEY, anisora_id INTEGER UNIQUE NOT NULL, hianime_id TEXT, status TEXT NOT NULL, error_message TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);\n")
            f.write("CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);\n\n")

            # Meta records
            now_iso = datetime.now(timezone.utc).isoformat()
            f.write(f"INSERT OR REPLACE INTO meta VALUES('last_scraped_at','{now_iso}');\n")
            f.write(f"INSERT OR REPLACE INTO meta VALUES('total_records','{total}');\n")
            f.write(f"INSERT OR REPLACE INTO meta VALUES('matched_records','{matches}');\n\n")

            # Entries in batches
            for i in range(0, len(entries_rows), chunk_size):
                chunk = entries_rows[i:i + chunk_size]
                f.write(f"INSERT INTO entries VALUES\n" + ",\n".join(chunk) + ";\n")

            f.write("\n")
            # AniSora IDs in batches
            for i in range(0, len(anisora_rows), chunk_size):
                chunk = anisora_rows[i:i + chunk_size]
                f.write(f"INSERT INTO anisora_ids VALUES\n" + ",\n".join(chunk) + ";\n")

            f.write("\nCOMMIT;\n")

        if os.path.exists(self.checkpoint_sql_path):
            try:
                os.replace(temp_sql, self.checkpoint_sql_path)
            except OSError:
                os.remove(self.checkpoint_sql_path)
                os.replace(temp_sql, self.checkpoint_sql_path)
        else:
            os.replace(temp_sql, self.checkpoint_sql_path)


def main():
    parser = argparse.ArgumentParser(
        description="AniSora DB - Compare and Enrich Anime Offline Database with HiAnime IDs"
    )
    parser.add_argument(
        "-i", "--input",
        default=DEFAULT_OFFLINE_DB,
        help=f"Input anime-offline-database.jsonl path (default: {DEFAULT_OFFLINE_DB})"
    )
    parser.add_argument(
        "-c", "--catalog",
        default=DEFAULT_HIANIME_CATALOG,
        help=f"Input hianime_catalog.json path (default: {DEFAULT_HIANIME_CATALOG})"
    )
    parser.add_argument(
        "-o", "--output",
        default=DEFAULT_OUTPUT_JSONL,
        help=f"Output enriched JSONL path (default: {DEFAULT_OUTPUT_JSONL})"
    )
    parser.add_argument(
        "-s", "--sql",
        default=DEFAULT_CHECKPOINT_SQL,
        help=f"Output checkpoint SQL path (default: {DEFAULT_CHECKPOINT_SQL})"
    )

    args = parser.parse_args()

    matcher = AniSoraMatcher(
        offline_db_path=args.input,
        hianime_catalog_path=args.catalog,
        output_jsonl_path=args.output,
        checkpoint_sql_path=args.sql,
    )

    matcher.run()


if __name__ == "__main__":
    main()
