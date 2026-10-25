#!/usr/bin/env python3
"""
================================================================================
AniSora DB - Miruro Matcher & Dataset Enricher
================================================================================
Matches the scraped Miruro catalog from:
    AniSoraDB/miruro_catalog.jsonl (20,802+ anime records)
Against:
    anime_with_hianime.jsonl (41,840 anime records)

Matching Methodology:
  1. Primary Identifier Match:
     Extracts canonical IDs from 'sources' in anime_with_hianime.jsonl:
       - AniList (anilist.co/anime/:id)
       - MyAnimeList (myanimelist.net/anime/:id)
       - Kitsu (kitsu.app/anime/:id_or_slug)
       - AniDB (anidb.net/anime/:id)
       - Anime-Planet (anime-planet.com/anime/:slug)
       - Simkl (simkl.com/anime/:id)
       - AniSearch (anisearch.com/anime/:id)
       - AnimeCountdown (animecountdown.com/:id)
       - LiveChart (livechart.me/anime/:id)
       - AnimeNewsNetwork (animenewsnetwork.com/...id=:id)
     Matches against 'external_ids' in miruro_catalog.jsonl.
  2. Fallback Title Match:
     Exact normalized title and synonym matching for any remaining items.

Outputs:
  - anime_with_hianime.jsonl: Enriched with 'Miruro_Id' (string or null).
  - unmatched-miroru.json: Complete export of unmatched Miruro items.
  - AniSoraDB/unmatched-miroru.json: Mirrored copy in database folder.
================================================================================
"""

import os
import sys
import json
import time
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Set, Tuple

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DEFAULT_TARGET_JSONL = "anime_with_hianime.jsonl"
DEFAULT_MIRURO_JSONL = os.path.join("AniSoraDB", "miruro_catalog.jsonl")
DEFAULT_UNMATCHED_JSON = "unmatched-miroru.json"
DEFAULT_UNMATCHED_ANISORA_JSON = os.path.join("AniSoraDB", "unmatched-miroru.json")


def normalize_title(s: Optional[str]) -> str:
    """Normalizes title string for clean case-insensitive comparison."""
    if not s or not isinstance(s, str):
        return ""
    s = s.lower().strip()
    s = re.sub(r'[\'\"“”‘’`「」『』\(\)\[\]\{\}・]', '', s)
    s = re.sub(r'[\s\-_:;,./\\!?@#%^&*+=~|]+', ' ', s).strip()
    return s


def extract_source_ids(sources: List[str]) -> Dict[str, Set[str]]:
    """Extracts all external database IDs from URLs in sources."""
    ids: Dict[str, Set[str]] = {}
    if not sources or not isinstance(sources, list):
        return ids

    for s in sources:
        if not isinstance(s, str):
            continue

        # AniList
        m = re.search(r'anilist\.co/anime/(\d+)', s)
        if m:
            ids.setdefault('anilist', set()).add(m.group(1))

        # MAL
        m = re.search(r'myanimelist\.net/anime/(\d+)', s)
        if m:
            ids.setdefault('mal', set()).add(m.group(1))

        # Kitsu
        m = re.search(r'kitsu\.app/anime/([^/?#]+)', s)
        if m:
            ids.setdefault('kitsu', set()).add(m.group(1).lower())

        # AniDB
        m = re.search(r'anidb\.net/anime/(\d+)', s)
        if m:
            ids.setdefault('anidb', set()).add(m.group(1))

        # Anime-Planet
        m = re.search(r'anime-planet\.com/anime/([^/?#]+)', s)
        if m:
            ids.setdefault('anime_planet', set()).add(m.group(1).lower())

        # Simkl
        m = re.search(r'simkl\.com/anime/(\d+)', s)
        if m:
            ids.setdefault('simkl', set()).add(m.group(1))

        # AniSearch
        m = re.search(r'anisearch\.(?:com|de)/anime/(\d+)', s)
        if m:
            ids.setdefault('anisearch', set()).add(m.group(1))

        # AnimeCountdown
        m = re.search(r'animecountdown\.com/(\d+)', s)
        if m:
            ids.setdefault('animecountdown', set()).add(m.group(1))

        # LiveChart
        m = re.search(r'livechart\.me/anime/(\d+)', s)
        if m:
            ids.setdefault('livechart', set()).add(m.group(1))

        # AnimeNewsNetwork
        m = re.search(r'animenewsnetwork\.com/encyclopedia/anime\.php\?id=(\d+)', s)
        if m:
            ids.setdefault('animenewsnetwork', set()).add(m.group(1))

    return ids


class MiruroMatcher:
    def __init__(
        self,
        target_jsonl: str = DEFAULT_TARGET_JSONL,
        miruro_jsonl: str = DEFAULT_MIRURO_JSONL,
        unmatched_json: str = DEFAULT_UNMATCHED_JSON,
        unmatched_anisora_json: str = DEFAULT_UNMATCHED_ANISORA_JSON,
    ):
        self.target_jsonl = target_jsonl
        self.miruro_jsonl = miruro_jsonl
        self.unmatched_json = unmatched_json
        self.unmatched_anisora_json = unmatched_anisora_json

        # External provider indexes: provider -> external_id -> line_index (0-based)
        self.provider_indexes: Dict[str, Dict[str, int]] = {
            'anilist': {},
            'mal': {},
            'kitsu': {},
            'anidb': {},
            'anime_planet': {},
            'simkl': {},
            'anisearch': {},
            'animecountdown': {},
            'livechart': {},
            'animenewsnetwork': {},
        }
        # Title index: normalized title/synonym -> line_index
        self.title_index: Dict[str, int] = {}

        # Matching results: line_index -> miruro_id
        self.line_to_miruro: Dict[int, str] = {}
        self.matched_miruro_ids: Set[str] = set()
        self.unmatched_miruro_list: List[Dict[str, Any]] = []

        self.match_stats = {
            'anilist': 0,
            'mal': 0,
            'kitsu': 0,
            'anidb': 0,
            'anime_planet': 0,
            'simkl': 0,
            'anisearch': 0,
            'animecountdown': 0,
            'livechart': 0,
            'animenewsnetwork': 0,
            'title': 0,
        }

    def index_target_database(self) -> int:
        """Indexes all external IDs and titles in anime_with_hianime.jsonl."""
        print(f"[*] Reading and indexing database: {self.target_jsonl}...")
        t0 = time.time()
        line_count = 0

        with open(self.target_jsonl, "r", encoding="utf-8") as f:
            # Skip line 1 (header metadata)
            header = f.readline()

            for line_idx, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                line_count += 1
                try:
                    obj = json.loads(line)
                except Exception:
                    continue

                # Index source IDs
                src_ids = extract_source_ids(obj.get("sources", []))
                for prov, id_set in src_ids.items():
                    if prov in self.provider_indexes:
                        for ext_id in id_set:
                            # Keep first occurrence
                            if ext_id not in self.provider_indexes[prov]:
                                self.provider_indexes[prov][ext_id] = line_idx

                # Index main title & synonyms
                norm_title = normalize_title(obj.get("title"))
                if norm_title and norm_title not in self.title_index:
                    self.title_index[norm_title] = line_idx

                for syn in obj.get("synonyms", []):
                    norm_syn = normalize_title(syn)
                    if norm_syn and norm_syn not in self.title_index:
                        self.title_index[norm_syn] = line_idx

        elapsed = time.time() - t0
        print(f"[+] Indexed {line_count:,} anime records in {elapsed:.2f}s.")
        print(f"    - AniList keys:     {len(self.provider_indexes['anilist']):,}")
        print(f"    - MyAnimeList keys: {len(self.provider_indexes['mal']):,}")
        print(f"    - Kitsu keys:       {len(self.provider_indexes['kitsu']):,}")
        print(f"    - Anime-Planet keys:{len(self.provider_indexes['anime_planet']):,}")
        print(f"    - AniDB keys:       {len(self.provider_indexes['anidb']):,}")
        print(f"    - Indexed titles:   {len(self.title_index):,}")
        return line_count

    def match_miruro_catalog(self) -> int:
        """Matches all records from miruro_catalog.jsonl to the indexed database."""
        print(f"\n[*] Matching Miruro catalog: {self.miruro_jsonl}...")
        t0 = time.time()
        total_miruro = 0

        with open(self.miruro_jsonl, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                total_miruro += 1
                m_obj = json.loads(line)
                mid = m_obj.get("id")
                ext = m_obj.get("external_ids") or {}

                matched_line_idx: Optional[int] = None
                matched_method: Optional[str] = None

                # 1. AniList Match (highest accuracy)
                for al_id in ext.get("anilist", []):
                    al_str = str(al_id).strip()
                    if al_str in self.provider_indexes["anilist"]:
                        matched_line_idx = self.provider_indexes["anilist"][al_str]
                        matched_method = "anilist"
                        break

                # 2. MAL Match
                if matched_line_idx is None:
                    for mal_id in ext.get("mal", []):
                        mal_str = str(mal_id).strip()
                        if mal_str in self.provider_indexes["mal"]:
                            matched_line_idx = self.provider_indexes["mal"][mal_str]
                            matched_method = "mal"
                            break

                # 3. Kitsu Match
                if matched_line_idx is None:
                    for k_id in ext.get("kitsu", []):
                        k_str = str(k_id).strip().lower()
                        if k_str in self.provider_indexes["kitsu"]:
                            matched_line_idx = self.provider_indexes["kitsu"][k_str]
                            matched_method = "kitsu"
                            break

                # 4. AniDB Match
                if matched_line_idx is None:
                    for adb_id in ext.get("anidb", []):
                        adb_str = str(adb_id).strip()
                        if adb_str in self.provider_indexes["anidb"]:
                            matched_line_idx = self.provider_indexes["anidb"][adb_str]
                            matched_method = "anidb"
                            break

                # 5. Anime-Planet Match
                if matched_line_idx is None:
                    for ap_slug in ext.get("anime_planet", []):
                        ap_str = str(ap_slug).strip().lower()
                        if ap_str in self.provider_indexes["anime_planet"]:
                            matched_line_idx = self.provider_indexes["anime_planet"][ap_str]
                            matched_method = "anime_planet"
                            break

                # 6. Secondary Providers (Simkl, AniSearch, AnimeCountdown, LiveChart, ANN)
                if matched_line_idx is None:
                    for prov in ("simkl", "anisearch", "animecountdown", "livechart", "animenewsnetwork"):
                        for pid in ext.get(prov, []):
                            p_str = str(pid).strip()
                            if p_str in self.provider_indexes[prov]:
                                matched_line_idx = self.provider_indexes[prov][p_str]
                                matched_method = prov
                                break
                        if matched_line_idx is not None:
                            break

                # 7. Fallback Title Match (Exact normalized title)
                if matched_line_idx is None:
                    t_dict = m_obj.get("title") or {}
                    candidate_titles = [
                        t_dict.get("english"),
                        t_dict.get("romaji"),
                        m_obj.get("name"),
                    ]
                    for cand in candidate_titles:
                        norm_cand = normalize_title(cand)
                        if norm_cand and norm_cand in self.title_index:
                            matched_line_idx = self.title_index[norm_cand]
                            matched_method = "title"
                            break

                # Record match outcome
                if matched_line_idx is not None and mid:
                    self.match_stats[matched_method] += 1
                    self.matched_miruro_ids.add(mid)
                    # Assign Miruro_Id to line (first match wins if multiple Miruro entries point to same DB line)
                    if matched_line_idx not in self.line_to_miruro:
                        self.line_to_miruro[matched_line_idx] = mid
                else:
                    self.unmatched_miruro_list.append(m_obj)

        elapsed = time.time() - t0
        matched_count = len(self.matched_miruro_ids)
        unmatched_count = len(self.unmatched_miruro_list)
        pct = (matched_count / total_miruro * 100) if total_miruro > 0 else 0

        print(f"[+] Matching completed in {elapsed:.2f}s:")
        print(f"    - Total Miruro Catalog:  {total_miruro:,}")
        print(f"    - Successfully Matched:  {matched_count:,} ({pct:.2f}%)")
        print(f"    - Unmatched:             {unmatched_count:,} ({100 - pct:.2f}%)")
        print(f"    - Assigned DB Records:   {len(self.line_to_miruro):,}")
        print("\n[*] Matches by Method:")
        for method, count in self.match_stats.items():
            if count > 0:
                print(f"    - {method:18s}: {count:,}")

        return total_miruro

    def write_enriched_database(self):
        """Rewrites anime_with_hianime.jsonl with 'Miruro_Id' field added to every line."""
        print(f"\n[*] Writing enriched records to {self.target_jsonl}...")
        t0 = time.time()
        temp_target = self.target_jsonl + ".tmp"

        total_lines_written = 0
        assigned_count = 0

        with open(self.target_jsonl, "r", encoding="utf-8") as in_f, \
             open(temp_target, "w", encoding="utf-8") as out_f:

            # Preserve header line 1 untouched
            header_line = in_f.readline()
            out_f.write(header_line)

            for line_idx, line in enumerate(in_f):
                line = line.strip()
                if not line:
                    continue

                obj = json.loads(line)
                miruro_id = self.line_to_miruro.get(line_idx, None)
                if miruro_id:
                    assigned_count += 1

                # Add Miruro_Id in consistent schema order
                obj["Miruro_Id"] = miruro_id

                out_f.write(json.dumps(obj, ensure_ascii=False) + "\n")
                total_lines_written += 1

        # Replace file atomically
        os.replace(temp_target, self.target_jsonl)
        elapsed = time.time() - t0
        size_mb = os.path.getsize(self.target_jsonl) / (1024 * 1024)

        print(f"[+] Successfully updated {self.target_jsonl} in {elapsed:.2f}s.")
        print(f"    - Total Anime Records:   {total_lines_written:,}")
        print(f"    - Assigned Miruro_Id:    {assigned_count:,}")
        print(f"    - Null Miruro_Id:        {total_lines_written - assigned_count:,}")
        print(f"    - Updated File Size:     {size_mb:.2f} MB")

    def export_unmatched_miruro(self, total_miruro: int):
        """Exports unmatched Miruro items to unmatched-miroru.json and AniSoraDB."""
        unmatched_count = len(self.unmatched_miruro_list)
        coverage_pct = ((total_miruro - unmatched_count) / total_miruro * 100) if total_miruro > 0 else 0

        payload = {
            "metadata": {
                "description": "Miruro catalog entries present in Miruro but not matched in the anime database",
                "total_unmatched": unmatched_count,
                "total_miruro_catalog": total_miruro,
                "coverage_pct": round(coverage_pct, 2),
                "generated_at": datetime.now(timezone.utc).isoformat(),
            },
            "unmatched_animes": self.unmatched_miruro_list,
        }

        # 1. Save to root unmatched-miroru.json
        print(f"\n[*] Saving unmatched items to {self.unmatched_json}...")
        with open(self.unmatched_json, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        print(f"[+] Saved {unmatched_count:,} records to {self.unmatched_json}")

        # 2. Save to AniSoraDB/unmatched-miroru.json
        print(f"[*] Saving copy to {self.unmatched_anisora_json}...")
        os.makedirs(os.path.dirname(os.path.abspath(self.unmatched_anisora_json)), exist_ok=True)
        with open(self.unmatched_anisora_json, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        print(f"[+] Saved {unmatched_count:,} records to {self.unmatched_anisora_json}")

    def run(self):
        print("=" * 76)
        print("         ANISORA DB - MIRURO MATCHER & DATASET ENRICHER")
        print("=" * 76)
        print(f"[*] Target Database:    {self.target_jsonl}")
        print(f"[*] Miruro Catalog:     {self.miruro_jsonl}")
        print(f"[*] Unmatched Output:   {self.unmatched_json}")
        print("=" * 76 + "\n")

        self.index_target_database()
        total_miruro = self.match_miruro_catalog()
        self.write_enriched_database()
        self.export_unmatched_miruro(total_miruro)

        print("\n" + "=" * 76)
        print("[+] ENRICHMENT COMPLETE & DATASET SYNCHRONIZED!")
        print("=" * 76)


def main():
    matcher = MiruroMatcher()
    matcher.run()


if __name__ == "__main__":
    main()
