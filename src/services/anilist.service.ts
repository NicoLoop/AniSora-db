import { scraperService } from './scraper.service.js';
import { extractAnimeDetails } from '../extractors/detail.extractor.js';
import { extractSearchSuggestions } from '../extractors/search.extractor.js';
import type {
  AnimeCard,
  AnimeSyncData,
  AniListToHiAnimeSyncData,
  AniListTrailer,
  AniListCharacterItem,
  AniListStaffItem,
  AniListRelationItem,
  AnimeDetailsData,
  EpisodesData,
  ScheduleData,
  ScheduleDateItem,
  ScheduledAnime,
} from '../types/anime.js';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';
const ANIZIP_ENDPOINT = 'https://api.ani.zip/mappings';

interface AniZipResponse {
  titles?: Record<string, string>;
  mappings?: Record<string, any>;
  episodes?: Record<string, any>;
}

// Single comprehensive query for candidate search
const ANILIST_SEARCH_CANDIDATES_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 8) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        idMal
        title {
          romaji
          english
          native
          userPreferred
        }
        synonyms
        format
        status
        episodes
        duration
        season
        seasonYear
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        genres
        averageScore
        meanScore
        popularity
        description(asHtml: false)
        trailer {
          id
          site
          thumbnail
        }
        studios(isMain: true) {
          nodes {
            id
            name
            isAnimationStudio
          }
        }
        characters(sort: ROLE, perPage: 15) {
          edges {
            role
            node {
              id
              name {
                full
                native
              }
              image {
                medium
                large
              }
            }
            voiceActors(language: JAPANESE) {
              id
              name {
                full
                native
              }
              image {
                medium
              }
              languageV2
            }
          }
        }
        staff(perPage: 10) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                medium
              }
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title {
                romaji
                english
                native
              }
              format
              type
              status
              coverImage {
                medium
              }
            }
          }
        }
        nextAiringEpisode {
          id
          airingAt
          timeUntilAiring
          episode
        }
      }
    }
  }
`;

const ANILIST_MEDIA_QUERY = `
  query ($id: Int, $idMal: Int, $search: String) {
    Media(id: $id, idMal: $idMal, search: $search, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
        native
        userPreferred
      }
      synonyms
      format
      status
      episodes
      duration
      season
      seasonYear
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      genres
      averageScore
      meanScore
      popularity
      description(asHtml: false)
      trailer {
        id
        site
        thumbnail
      }
      studios(isMain: true) {
        nodes {
          id
          name
          isAnimationStudio
        }
      }
      characters(sort: ROLE, perPage: 15) {
        edges {
          role
          node {
            id
            name {
              full
              native
            }
            image {
              medium
              large
            }
          }
          voiceActors(language: JAPANESE) {
            id
            name {
              full
              native
            }
            image {
              medium
            }
            languageV2
          }
        }
      }
      staff(perPage: 10) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              medium
            }
          }
        }
      }
      relations {
        edges {
          relationType
          node {
            id
            idMal
            title {
              romaji
              english
              native
            }
            format
            type
            status
            coverImage {
              medium
            }
          }
        }
      }
      nextAiringEpisode {
        id
        airingAt
        timeUntilAiring
        episode
      }
    }
  }
`;

function normalizeTitle(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\b1st season\b/gi, 'season 1')
    .replace(/\b2nd season\b/gi, 'season 2')
    .replace(/\b3rd season\b/gi, 'season 3')
    .replace(/\b4th season\b/gi, 'season 4')
    .replace(/\bseason\s*i\b/gi, 'season 1')
    .replace(/\bseason\s*ii\b/gi, 'season 2')
    .replace(/\bseason\s*iii\b/gi, 'season 3')
    .replace(/\bseason\s*iv\b/gi, 'season 4')
    .replace(/\bpart\s*i\b/gi, 'part 1')
    .replace(/\bpart\s*ii\b/gi, 'part 2')
    .replace(/\bpart\s*iii\b/gi, 'part 3')
    .replace(/\bpart\s*iv\b/gi, 'part 4')
    .replace(/\bseason\s*(\d+)\b/gi, 'season $1')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreCandidate(targetName: string, targetJName: string | null | undefined, candidate: any): number {
  const normTargets = [normalizeTitle(targetJName), normalizeTitle(targetName)].filter(Boolean);
  const titles = [
    candidate.title?.romaji,
    candidate.title?.english,
    candidate.title?.native,
    ...(candidate.synonyms || []),
  ].filter(Boolean).map(normalizeTitle);

  let maxScore = 0;

  for (const target of normTargets) {
    for (const t of titles) {
      if (!t) continue;
      if (t === target) {
        maxScore = Math.max(maxScore, 100);
        continue;
      }

      // Token overlap (Jaccard similarity)
      const targetTokens = new Set(target.split(' '));
      const titleTokens = new Set(t.split(' '));
      let intersection = 0;
      for (const token of targetTokens) {
        if (titleTokens.has(token)) intersection++;
      }
      const union = new Set([...targetTokens, ...titleTokens]).size;
      const jaccard = union > 0 ? (intersection / union) * 85 : 0;
      maxScore = Math.max(maxScore, jaccard);
    }

    // Numeric season marker check
    const targetNumbers = (target.match(/\b\d+\b/g) || []).join(' ');
    const candidateNumbers = (titles[0]?.match(/\b\d+\b/g) || []).join(' ');
    if (targetNumbers && candidateNumbers) {
      if (targetNumbers === candidateNumbers) {
        maxScore += 25;
      } else {
        maxScore -= 35;
      }
    }
  }

  // Format check (e.g. MOVIE vs TV)
  for (const target of normTargets) {
    if (target.includes('movie') && candidate.format === 'MOVIE') {
      maxScore += 15;
    }
  }

  // Popularity tiebreaker
  if (candidate.popularity) {
    maxScore += Math.min(candidate.popularity / 100000, 5);
  }

  return maxScore;
}

function scoreHiAnimeCandidate(
  suggestion: { id: string; name: string; jname: string | null },
  media: any
): number {
  const normSugName = normalizeTitle(suggestion.name);
  const normSugJName = normalizeTitle(suggestion.jname);
  const candTitles = [normSugName, normSugJName].filter(Boolean);

  const mediaTitles = [
    media.title?.romaji,
    media.title?.english,
    media.title?.userPreferred,
    media.title?.native,
    ...(media.synonyms || []),
  ]
    .filter(Boolean)
    .map(normalizeTitle);

  let maxScore = 0;

  for (const ct of candTitles) {
    for (const mt of mediaTitles) {
      if (!mt) continue;
      if (ct === mt) {
        maxScore = Math.max(maxScore, 100);
        continue;
      }

      // Token overlap (Jaccard similarity)
      const cTokens = new Set(ct.split(' '));
      const mTokens = new Set(mt.split(' '));
      let intersection = 0;
      for (const tok of cTokens) {
        if (mTokens.has(tok)) intersection++;
      }
      const union = new Set([...cTokens, ...mTokens]).size;
      const jaccard = union > 0 ? (intersection / union) * 85 : 0;
      maxScore = Math.max(maxScore, jaccard);
    }

    // Numeric season check
    const cNumbers = (ct.match(/\b\d+\b/g) || []).join(' ');
    const mNumbers = (mediaTitles[0]?.match(/\b\d+\b/g) || []).join(' ');
    if (cNumbers && mNumbers) {
      if (cNumbers === mNumbers) {
        maxScore += 25;
      } else {
        maxScore -= 35;
      }
    }
  }

  return maxScore;
}

export class AniListService {
  /**
   * Fetch cross-database mappings from AniZip (MAL <-> AniList <-> Kitsu <-> AniDB)
   */
  public async getAniZipMapping(params: {
    malId?: number;
    anilistId?: number;
  }): Promise<AniZipResponse | null> {
    const queryParam = params.malId
      ? `mal_id=${params.malId}`
      : params.anilistId
      ? `anilist_id=${params.anilistId}`
      : null;

    if (!queryParam) return null;

    try {
      const res = await fetch(`${ANIZIP_ENDPOINT}?${queryParam}`);
      if (!res.ok) return null;
      return (await res.json()) as AniZipResponse;
    } catch (err) {
      console.warn('[AniListService] AniZip lookup failed:', err);
      return null;
    }
  }

  /**
   * Query AniList search candidates
   */
  public async searchAniListCandidates(search: string): Promise<any[]> {
    if (!search || !search.trim()) return [];

    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: ANILIST_SEARCH_CANDIDATES_QUERY,
        variables: { search: search.trim() },
      }),
    });

    if (!res.ok) {
      throw new Error(`AniList search failed with status ${res.status}`);
    }

    const json = (await res.json()) as any;
    if (json.errors && json.errors.length > 0) {
      console.warn('[AniListService] GraphQL warning:', json.errors[0]?.message);
      return [];
    }

    return json?.data?.Page?.media || [];
  }

  /**
   * Query AniList directly by specific ID
   */
  public async queryAniList(variables: {
    id?: number;
    idMal?: number;
    search?: string;
  }): Promise<any> {
    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: ANILIST_MEDIA_QUERY,
        variables,
      }),
    });

    if (!res.ok) {
      throw new Error(`AniList GraphQL returned status ${res.status}`);
    }

    const json = (await res.json()) as any;
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0]?.message || 'AniList GraphQL query error');
    }

    return json?.data?.Media || null;
  }

  /**
   * Primary sync: Takes a HiAnime anime ID / slug (e.g. 'one-piece-1', 'black-clover-season-2-1-10492'),
   * fetches the HiAnime anime details to get the exact 'name' and 'jname',
   * queries AniList using 'jname' (mostly jname) and 'name',
   * analyzes/scores the candidates, and returns comprehensive AniList metadata.
   */
  public async syncAnime(animeId: string): Promise<AnimeSyncData> {
    const rawId = animeId.trim();
    if (!rawId) {
      throw new Error('HiAnime anime ID or slug is required');
    }

    let slug = rawId;

    // 1. If purely numeric (e.g. '1' or '10492'), resolve the full slug from episode list
    if (/^\d+$/.test(slug)) {
      try {
        const epListRes = await scraperService.fetchJson<{ status: boolean; html?: string }>(
          `/api/theme/episode/list/${slug}`
        );
        if (epListRes?.html) {
          const match = epListRes.html.match(/\/watch\/([a-zA-Z0-9-]+)-\d+\?ep=/);
          if (match && match[1]) {
            slug = `${match[1]}-${slug}`;
          }
        }
      } catch {
        // Fallback to raw slug
      }
    }

    // 2. Fetch HiAnime Anime Details for this ID
    let hianimeDetails: AnimeDetailsData | null = null;
    let name: string = '';
    let jname: string | null = null;

    try {
      console.log(`[AniListService] Fetching HiAnime anime details for slug: "${slug}"...`);
      const html = await scraperService.fetchHtml(`/${encodeURIComponent(slug)}`);
      hianimeDetails = extractAnimeDetails(html, slug);
      name = hianimeDetails.name || '';
      jname = hianimeDetails.jname || null;
      console.log(`[AniListService] HiAnime resolved -> name: "${name}", jname: "${jname}"`);
    } catch (err) {
      console.warn(`[AniListService] Failed to fetch HiAnime page for "${slug}":`, err);
    }

    // Detect slug mismatch where HiAnime's URL router routed to wrong anime due to mismatched trailing number
    const cleanSlugTitle = slug.replace(/-\d+$/, '').replace(/-/g, ' ').trim().toLowerCase();
    const cleanName = (name || '').toLowerCase();
    const cleanJname = (jname || '').toLowerCase();
    const hasOverlap =
      !cleanSlugTitle ||
      cleanName.includes(cleanSlugTitle) ||
      cleanSlugTitle.includes(cleanName) ||
      cleanJname.includes(cleanSlugTitle) ||
      cleanSlugTitle.split(' ').some((w) => w.length > 3 && (cleanName.includes(w) || cleanJname.includes(w)));

    if (!hasOverlap && cleanSlugTitle) {
      console.warn(
        `[AniListService] Slug mismatch detected: requested "${cleanSlugTitle}" but HiAnime ID returned "${name}". Auto-correcting via HiAnime search suggestions...`
      );
      try {
        const searchEndpoint = `/api/theme/search/suggestions?keyword=${encodeURIComponent(cleanSlugTitle)}`;
        const searchData = await scraperService.fetchJson<{ status: boolean; html?: string }>(searchEndpoint);
        if (searchData?.html) {
          const parsedSuggestions = extractSearchSuggestions(searchData.html, cleanSlugTitle);
          const matched =
            parsedSuggestions.suggestions?.find(
              (s: any) =>
                s.id?.toLowerCase().includes(slug.replace(/-\d+$/, '').toLowerCase()) ||
                s.name?.toLowerCase().includes(cleanSlugTitle)
            ) || parsedSuggestions.suggestions?.[0];

          if (matched?.id) {
            console.log(`[AniListService] Auto-corrected HiAnime slug from "${slug}" to "${matched.id}" (${matched.name})`);
            slug = matched.id;
            name = matched.name || cleanSlugTitle;
            jname = matched.jname || null;
          }
        }
      } catch (err) {
        console.warn(`[AniListService] Failed to auto-correct slug "${slug}":`, err);
      }
    }

    // Fallback if HiAnime page couldn't be scraped: extract title from slug
    if (!name && !jname) {
      name = cleanSlugTitle;
      jname = cleanSlugTitle;
    }

    // 3. Search AniList: Search jname first (mostly jname), then name
    let candidates: any[] = [];
    let matchedVia: 'jname' | 'name' | 'slug' | 'embed' = 'jname';
    let primarySearch = jname || name;

    if (primarySearch) {
      console.log(`[AniListService] Searching AniList with primary term: "${primarySearch}"...`);
      candidates = await this.searchAniListCandidates(primarySearch);
    }

    // If jname returned nothing or low results, and name is distinct, search by name
    if (candidates.length === 0 && name && name !== jname) {
      console.log(`[AniListService] Searching AniList with fallback term: "${name}"...`);
      candidates = await this.searchAniListCandidates(name);
      matchedVia = 'name';
    } else if (name && name !== jname && candidates.length > 0) {
      // If we have candidates from jname, also consider name candidates if top score is modest
      const initialTopScore = candidates.length > 0 ? scoreCandidate(name, jname, candidates[0]) : 0;
      if (initialTopScore < 80) {
        const secondaryCandidates = await this.searchAniListCandidates(name);
        const existingIds = new Set(candidates.map((c) => c.id));
        for (const sc of secondaryCandidates) {
          if (!existingIds.has(sc.id)) candidates.push(sc);
        }
      }
    }

    if (!candidates || candidates.length === 0) {
      // If purely numeric, fallback to episode server sync
      if (/^\d+$/.test(rawId)) {
        return this.syncEpisode(rawId);
      }
      throw new Error(
        `No AniList anime matches found for name: "${name}" / jname: "${jname}" (HiAnime ID: ${rawId})`
      );
    }

    // 4. Analyze & Score Candidates
    const scored = candidates
      .map((c) => ({
        media: c,
        score: scoreCandidate(name, jname, c),
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const winningMedia = best.media;

    console.log(
      `[AniListService] Matched "${name}" / "${jname}" -> AniList ID ${winningMedia.id} ("${
        winningMedia.title?.english || winningMedia.title?.romaji
      }") with score ${best.score.toFixed(1)}`
    );

    // 5. Concurrently fetch AniZip mappings for cross-database mapping
    let aniZip: AniZipResponse | null = null;
    const lookupIdMal = winningMedia.idMal || undefined;
    const lookupAnilistId = winningMedia.id || undefined;
    if (lookupIdMal || lookupAnilistId) {
      aniZip = await this.getAniZipMapping({
        malId: lookupIdMal,
        anilistId: lookupAnilistId,
      });
    }

    // 6. Format and return full AnimeSyncData
    return this.formatMediaData(winningMedia, {
      hianimeAnimeId: slug,
      matchedTitle: jname || name,
      matchedVia,
      matchScore: Math.round(best.score * 10) / 10,
      aniZip,
      hianimeInfo: hianimeDetails
        ? {
            name: hianimeDetails.name,
            jname: hianimeDetails.jname,
            poster: hianimeDetails.poster,
            type: hianimeDetails.stats?.type || null,
            episodes: hianimeDetails.stats?.episodes || null,
            genres: hianimeDetails.moreInfo?.genres || [],
          }
        : undefined,
    });
  }

  /**
   * Sync HiAnime episode ID to AniList and return full metadata (legacy / fallback method)
   */
  public async syncEpisode(episodeId: string): Promise<AnimeSyncData> {
    const cleanId = episodeId.trim();
    let malId: number | null = null;
    let anilistId: number | null = null;
    let currentEpisode: number | null = null;
    let searchTitle: string | null = null;

    try {
      const serversUrl = `/api/theme/episode/servers?episodeId=${encodeURIComponent(cleanId)}`;
      const serversRes = await scraperService.fetchJson<{ status: boolean; html?: string }>(serversUrl);

      if (serversRes?.html) {
        const epMatch = serversRes.html.match(/Episode\s*<b>(\d+)<\/b>/i);
        if (epMatch) {
          currentEpisode = parseInt(epMatch[1], 10);
        }

        const hashMatches = serversRes.html.matchAll(/data-hash="([A-Za-z0-9+/=]+)"/g);
        for (const match of hashMatches) {
          const b64 = match[1];
          try {
            const decoded = Buffer.from(b64, 'base64').toString('utf8');
            const malMatch = decoded.match(/\/stream\/mal\/(\d+)\/(\d+)\/([a-z]+)/i);
            if (malMatch) {
              malId = parseInt(malMatch[1], 10);
              if (!currentEpisode) currentEpisode = parseInt(malMatch[2], 10);
              break;
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.warn(`[AniListService] Server fetch failed for episodeId ${cleanId}:`, err);
    }

    // Query AniZip mappings if malId is available
    let aniZip: AniZipResponse | null = null;
    if (malId || anilistId) {
      aniZip = await this.getAniZipMapping({
        malId: malId || undefined,
        anilistId: anilistId || undefined,
      });

      if (aniZip?.mappings?.anilist_id && !anilistId) {
        anilistId = Number(aniZip.mappings.anilist_id);
      }
      if (aniZip?.mappings?.mal_id && !malId) {
        malId = Number(aniZip.mappings.mal_id);
      }
      if (!searchTitle && aniZip?.titles) {
        searchTitle = aniZip.titles.en || aniZip.titles['x-jat'] || aniZip.titles.ja || null;
      }
    }

    let media: any = null;
    if (anilistId) {
      media = await this.queryAniList({ id: anilistId });
    }
    if (!media && malId) {
      media = await this.queryAniList({ idMal: malId });
    }
    if (!media && searchTitle) {
      media = await this.queryAniList({ search: searchTitle });
    }

    if (!media) {
      throw new Error(
        `Unable to sync anime for episodeId '${cleanId}'. Could not locate corresponding AniList entry.`
      );
    }

    return this.formatMediaData(media, {
      hianimeAnimeId: cleanId,
      hianimeEpisodeId: cleanId,
      currentEpisode,
      matchedTitle: searchTitle || media.title?.english || media.title?.romaji,
      matchedVia: 'embed',
      aniZip,
    });
  }

  /**
   * Helper to format raw AniList Media object into standardized AnimeSyncData
   */
  private formatMediaData(
    media: any,
    options: {
      hianimeAnimeId: string;
      matchedTitle?: string;
      matchedVia?: 'jname' | 'name' | 'slug' | 'embed';
      matchScore?: number;
      hianimeEpisodeId?: string | null;
      currentEpisode?: number | null;
      aniZip?: AniZipResponse | null;
      hianimeInfo?: {
        name: string;
        jname: string | null;
        poster: string | null;
        type: string | null;
        episodes: any;
        genres: string[];
      };
    }
  ): AnimeSyncData {
    // Structure Trailer
    let trailer: AniListTrailer | null = null;
    if (media.trailer && media.trailer.id) {
      const site = media.trailer.site?.toLowerCase();
      let url: string | null = null;
      if (site === 'youtube') {
        url = `https://www.youtube.com/watch?v=${media.trailer.id}`;
      } else if (site === 'dailymotion') {
        url = `https://www.dailymotion.com/video/${media.trailer.id}`;
      }

      trailer = {
        id: media.trailer.id,
        site: media.trailer.site || null,
        thumbnail: media.trailer.thumbnail || null,
        url,
      };
    }

    // Structure Characters / Casts
    const casts: AniListCharacterItem[] = Array.isArray(media.characters?.edges)
      ? media.characters.edges.map((edge: any) => {
          const charNode = edge.node;
          const va = edge.voiceActors?.[0] || null;
          return {
            id: charNode.id,
            role: edge.role,
            name: {
              full: charNode.name?.full || 'Unknown',
              native: charNode.name?.native || null,
            },
            image: {
              medium: charNode.image?.medium || null,
              large: charNode.image?.large || null,
            },
            voiceActor: va
              ? {
                  id: va.id,
                  name: {
                    full: va.name?.full || 'Unknown',
                    native: va.name?.native || null,
                  },
                  image: {
                    medium: va.image?.medium || null,
                  },
                  language: va.languageV2 || 'Japanese',
                }
              : null,
          };
        })
      : [];

    // Structure Staff
    const staff: AniListStaffItem[] = Array.isArray(media.staff?.edges)
      ? media.staff.edges.map((edge: any) => ({
          role: edge.role,
          id: edge.node.id,
          name: edge.node.name?.full || 'Unknown',
          image: edge.node.image?.medium || null,
        }))
      : [];

    // Structure Relations
    const relations: AniListRelationItem[] = Array.isArray(media.relations?.edges)
      ? media.relations.edges.map((edge: any) => ({
          relationType: edge.relationType,
          id: edge.node.id,
          idMal: edge.node.idMal || null,
          title: {
            romaji: edge.node.title?.romaji || 'Unknown',
            english: edge.node.title?.english || null,
          },
          format: edge.node.format || null,
          type: edge.node.type || null,
          status: edge.node.status || null,
          coverImage: edge.node.coverImage?.medium || null,
        }))
      : [];

    // Structure Studios
    const studios: string[] = Array.isArray(media.studios?.nodes)
      ? media.studios.nodes.map((s: any) => s.name).filter(Boolean)
      : [];

    // Clean description html tags
    const cleanDesc = media.description
      ? media.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
      : null;

    return {
      hianimeAnimeId: options.hianimeAnimeId,
      hianimeInfo: options.hianimeInfo,
      matchedTitle: options.matchedTitle,
      matchedVia: options.matchedVia,
      matchScore: options.matchScore,
      hianimeEpisodeId: options.hianimeEpisodeId || null,
      currentEpisode: options.currentEpisode || null,
      anilistId: media.id,
      malId: media.idMal || null,
      title: {
        romaji: media.title?.romaji || 'Unknown',
        english: media.title?.english || null,
        native: media.title?.native || null,
        userPreferred: media.title?.userPreferred || null,
      },
      synonyms: media.synonyms || [],
      description: cleanDesc,
      format: media.format || null,
      status: media.status || null,
      season: media.season || null,
      seasonYear: media.seasonYear || null,
      episodes: media.episodes || null,
      duration: media.duration || null,
      genres: media.genres || [],
      averageScore: media.averageScore || null,
      meanScore: media.meanScore || null,
      popularity: media.popularity || null,
      coverImage: {
        extraLarge: media.coverImage?.extraLarge || null,
        large: media.coverImage?.large || null,
        medium: media.coverImage?.medium || null,
        color: media.coverImage?.color || null,
      },
      bannerImage: media.bannerImage || null,
      trailer,
      casts,
      staff,
      studios,
      relations,
      nextAiringEpisode: media.nextAiringEpisode
        ? {
            episode: media.nextAiringEpisode.episode,
            airingAt: media.nextAiringEpisode.airingAt,
            timeUntilAiring: media.nextAiringEpisode.timeUntilAiring,
          }
        : null,
      mappings: options.aniZip?.mappings || {
        anilist_id: media.id,
        mal_id: media.idMal || null,
      },
    };
  }

  /**
   * Fetch full AniList media details by AniList ID
   */
  public async getAniListMediaById(id: number): Promise<any | null> {
    try {
      const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: ANILIST_MEDIA_QUERY,
          variables: { id },
        }),
      });

      if (!res.ok) {
        console.warn(`[AniListService] AniList query for ID ${id} failed with status ${res.status}`);
        return null;
      }

      const json: any = await res.json();
      return json?.data?.Media || null;
    } catch (err) {
      console.error(`[AniListService] Error fetching AniList media ${id}:`, err);
      return null;
    }
  }

  /**
   * Reverse Sync: Given an AniList ID, search and match the anime on HiAnime and return full HiAnime details.
   */
  public async syncFromAniList(anilistId: number): Promise<AniListToHiAnimeSyncData> {
    console.log(`[AniListService] Starting reverse sync for AniList ID: ${anilistId}`);

    // 1. Fetch AniList media details
    const media = await this.getAniListMediaById(anilistId);
    if (!media) {
      throw new Error(`AniList anime with ID '${anilistId}' not found.`);
    }

    // 2. Fetch AniZip mapping
    const aniZip = await this.getAniZipMapping({
      anilistId: media.id,
      malId: media.idMal,
    });

    // 3. Prepare search queries in priority order
    const queries: { query: string; source: string }[] = [];
    if (media.title?.english) queries.push({ query: media.title.english, source: 'title.english' });
    if (media.title?.romaji) queries.push({ query: media.title.romaji, source: 'title.romaji' });
    if (
      media.title?.userPreferred &&
      media.title.userPreferred !== media.title.english &&
      media.title.userPreferred !== media.title.romaji
    ) {
      queries.push({ query: media.title.userPreferred, source: 'title.userPreferred' });
    }
    if (
      aniZip?.titles?.['x-jat'] &&
      !queries.some((q) => q.query.toLowerCase() === aniZip.titles!['x-jat'].toLowerCase())
    ) {
      queries.push({ query: aniZip.titles['x-jat'], source: 'anizip.x-jat' });
    }
    if (Array.isArray(media.synonyms)) {
      for (const syn of media.synonyms) {
        if (
          syn &&
          syn.length > 2 &&
          !queries.some((q) => q.query.toLowerCase() === syn.toLowerCase())
        ) {
          queries.push({ query: syn, source: 'synonym' });
        }
      }
    }

    // 4. Search HiAnime suggestions for candidate matches
    interface CandidateMatch {
      id: string;
      name: string;
      jname: string | null;
      score: number;
      matchedVia: string;
      matchedKeyword: string;
    }

    let bestCandidate: CandidateMatch | null = null;

    for (const qObj of queries) {
      try {
        const suggestUrl = `/api/theme/search/suggestions?keyword=${encodeURIComponent(qObj.query)}`;
        const data = await scraperService.fetchJson<{ success: boolean; html?: string }>(suggestUrl);

        if (data && data.html) {
          const suggestionsData = extractSearchSuggestions(data.html, qObj.query);
          for (const sug of suggestionsData.suggestions) {
            const score = scoreHiAnimeCandidate(sug, media);
            if (!bestCandidate || score > bestCandidate.score) {
              bestCandidate = {
                id: sug.id,
                name: sug.name,
                jname: sug.jname,
                score,
                matchedVia: qObj.source,
                matchedKeyword: qObj.query,
              };
            }
          }

          // If we found a confident match (>= 80), stop querying further
          if (bestCandidate && bestCandidate.score >= 80) {
            break;
          }
        }
      } catch (err) {
        console.warn(`[AniListService] Failed suggest search for "${qObj.query}":`, err);
      }
    }

    // 5. Fallback: if no suggestion found or score too low, try direct browse search
    if (!bestCandidate || bestCandidate.score < 40) {
      for (const qObj of queries.slice(0, 2)) {
        try {
          const searchUrl = `/search?keyword=${encodeURIComponent(qObj.query)}`;
          const html = await scraperService.fetchHtml(searchUrl);
          const { extractListingPage } = await import('../extractors/list.extractor.js');
          const listing = extractListingPage(html, 1);
          if (listing.animes && listing.animes.length > 0) {
            for (const item of listing.animes) {
              const score = scoreHiAnimeCandidate(
                { id: item.id, name: item.name, jname: item.jname },
                media
              );
              if (!bestCandidate || score > bestCandidate.score) {
                bestCandidate = {
                  id: item.id,
                  name: item.name,
                  jname: item.jname,
                  score,
                  matchedVia: `${qObj.source}-browse`,
                  matchedKeyword: qObj.query,
                };
              }
            }
            if (bestCandidate && bestCandidate.score >= 60) break;
          }
        } catch (err) {
          console.warn(`[AniListService] Fallback browse search failed for "${qObj.query}":`, err);
        }
      }
    }

    if (!bestCandidate) {
      throw new Error(
        `Could not find a matching anime on HiAnime for AniList ID ${anilistId} ("${
          media.title?.romaji || media.title?.english || 'Unknown'
        }")`
      );
    }

    console.log(
      `[AniListService] Best HiAnime match for AniList ID ${anilistId}: ${bestCandidate.id} (Score: ${bestCandidate.score}, via: ${bestCandidate.matchedVia})`
    );

    // 6. Fetch full HiAnime details
    const hianimeHtml = await scraperService.fetchHtml(`/${bestCandidate.id}`);
    const hianimeDetails = extractAnimeDetails(hianimeHtml, bestCandidate.id);

    // 7. Format trailer
    const trailer: AniListTrailer | null = media.trailer
      ? {
          id: media.trailer.id || null,
          site: media.trailer.site || null,
          thumbnail: media.trailer.thumbnail || null,
          url:
            media.trailer.site === 'youtube' && media.trailer.id
              ? `https://www.youtube.com/watch?v=${media.trailer.id}`
              : null,
        }
      : null;

    return {
      anilistId: media.id,
      malId: media.idMal || null,
      matchedVia: bestCandidate.matchedVia,
      matchedKeyword: bestCandidate.matchedKeyword,
      matchScore: Math.round(bestCandidate.score),
      anilistTitle: {
        romaji: media.title?.romaji || 'Unknown',
        english: media.title?.english || null,
        native: media.title?.native || null,
        userPreferred: media.title?.userPreferred || null,
      },
      anilistMetadata: {
        format: media.format || null,
        status: media.status || null,
        season: media.season || null,
        seasonYear: media.seasonYear || null,
        episodes: media.episodes || null,
        duration: media.duration || null,
        genres: media.genres || [],
        coverImage: {
          extraLarge: media.coverImage?.extraLarge || null,
          large: media.coverImage?.large || null,
          medium: media.coverImage?.medium || null,
          color: media.coverImage?.color || null,
        },
        bannerImage: media.bannerImage || null,
        trailer,
      },
      hianime: hianimeDetails,
      mappings: aniZip?.mappings || {
        anilist_id: media.id,
        mal_id: media.idMal || null,
      },
    };
  }

  // ==========================================
  // ANILIST NATIVE PROVIDER IMPLEMENTATION
  // ==========================================

  /**
   * Generic GraphQL request handler for AniList
   */
  public async fetchGraphQL<T = any>(
    query: string,
    variables: Record<string, any> = {}
  ): Promise<T> {
    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AniList GraphQL Error [${res.status}]: ${text}`);
    }

    const json = (await res.json()) as any;
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors.map((e: any) => e.message).join(' | '));
    }
    return json.data as T;
  }

  /**
   * Helper to format an AniList media item into an AnimeCard
   */
  public formatMediaCard(media: any): AnimeCard & {
    englishName: string | null;
    nativeName: string | null;
    seasonYear: number | null;
    averageScore: number | null;
    genres: string[];
    color: string | null;
  } {
    const english = media.title?.english || null;
    const romaji = media.title?.romaji || media.title?.userPreferred || 'Unknown';
    const native = media.title?.native || null;
    const totalEps =
      typeof media.episodes === 'number'
        ? media.episodes
        : media.nextAiringEpisode
        ? media.nextAiringEpisode.episode - 1
        : null;

    return {
      id: String(media.id),
      name: english || romaji,
      jname: native || romaji,
      poster:
        media.coverImage?.extraLarge ||
        media.coverImage?.large ||
        media.coverImage?.medium ||
        null,
      type: media.format || null,
      duration: media.duration ? `${media.duration}m` : null,
      episodes: {
        sub: totalEps,
        dub: totalEps,
        eps: totalEps,
      },
      englishName: english,
      nativeName: native,
      seasonYear: media.seasonYear || null,
      averageScore: media.averageScore || null,
      genres: Array.isArray(media.genres) ? media.genres : [],
      color: media.coverImage?.color || null,
    };
  }

  /**
   * Helper to execute paginated media queries
   */
  public async getPaginatedList(variables: Record<string, any>): Promise<{
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    total: number;
    animes: (AnimeCard & {
      englishName: string | null;
      nativeName: string | null;
      seasonYear: number | null;
      averageScore: number | null;
      genres: string[];
      color: string | null;
    })[];
  }> {
    const query = `
      query (
        $page: Int,
        $perPage: Int,
        $sort: [MediaSort],
        $format: MediaFormat,
        $format_in: [MediaFormat],
        $status: MediaStatus,
        $genre: String,
        $genre_in: [String],
        $season: MediaSeason,
        $seasonYear: Int,
        $search: String
      ) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          media(
            type: ANIME,
            sort: $sort,
            format: $format,
            format_in: $format_in,
            status: $status,
            genre: $genre,
            genre_in: $genre_in,
            season: $season,
            seasonYear: $seasonYear,
            search: $search,
            isAdult: false
          ) {
            id
            idMal
            title {
              romaji
              english
              native
              userPreferred
            }
            format
            status
            episodes
            duration
            season
            seasonYear
            averageScore
            popularity
            genres
            coverImage {
              extraLarge
              large
              medium
              color
            }
            nextAiringEpisode {
              episode
              airingAt
              timeUntilAiring
            }
          }
        }
      }
    `;

    const data = await this.fetchGraphQL(query, variables);
    const pageInfo = data.Page?.pageInfo || {};
    const mediaList = data.Page?.media || [];

    return {
      currentPage: pageInfo.currentPage || 1,
      totalPages: pageInfo.lastPage || 1,
      hasNextPage: Boolean(pageInfo.hasNextPage),
      total: pageInfo.total || mediaList.length,
      animes: mediaList.map((m: any) => this.formatMediaCard(m)),
    };
  }

  /**
   * 1. Home Highlights Feed
   */
  public async getHome(): Promise<any> {
    const query = `
      fragment MediaCard on Media {
        id
        idMal
        title {
          romaji
          english
          native
          userPreferred
        }
        format
        status
        episodes
        duration
        season
        seasonYear
        averageScore
        popularity
        genres
        coverImage {
          extraLarge
          large
          medium
          color
        }
        nextAiringEpisode {
          episode
          airingAt
          timeUntilAiring
        }
      }
      query {
        spotlight: Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            ...MediaCard
            description(asHtml: false)
            bannerImage
          }
        }
        trending: Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            ...MediaCard
          }
        }
        latestEpisodes: Page(page: 1, perPage: 12) {
          media(type: ANIME, status: RELEASING, sort: UPDATED_AT_DESC, isAdult: false) {
            ...MediaCard
          }
        }
        topUpcoming: Page(page: 1, perPage: 12) {
          media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
            ...MediaCard
          }
        }
        topAiring: Page(page: 1, perPage: 12) {
          media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
            ...MediaCard
          }
        }
        mostPopular: Page(page: 1, perPage: 12) {
          media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
            ...MediaCard
          }
        }
        mostFavorite: Page(page: 1, perPage: 12) {
          media(type: ANIME, sort: FAVOURITES_DESC, isAdult: false) {
            ...MediaCard
          }
        }
        latestCompleted: Page(page: 1, perPage: 12) {
          media(type: ANIME, status: FINISHED, sort: END_DATE_DESC, isAdult: false) {
            ...MediaCard
          }
        }
        genres: GenreCollection
      }
    `;

    const data = await this.fetchGraphQL(query);

    const spotlightAnimes = (data.spotlight?.media || []).map((m: any, idx: number) => ({
      ...this.formatMediaCard(m),
      rank: idx + 1,
      description: m.description ? m.description.replace(/<[^>]+>/g, '').trim() : null,
      banner: m.bannerImage || null,
      quality: 'HD',
      aired:
        m.season && m.seasonYear
          ? `${m.season} ${m.seasonYear}`
          : m.seasonYear
          ? String(m.seasonYear)
          : null,
    }));

    const trendingAnimes = (data.trending?.media || []).map((m: any, idx: number) => ({
      ...this.formatMediaCard(m),
      rank: idx + 1,
    }));

    const top10Animes = {
      today: trendingAnimes.slice(0, 10),
      week: (data.mostPopular?.media || []).slice(0, 10).map((m: any, idx: number) => ({
        ...this.formatMediaCard(m),
        rank: idx + 1,
      })),
      month: (data.mostFavorite?.media || []).slice(0, 10).map((m: any, idx: number) => ({
        ...this.formatMediaCard(m),
        rank: idx + 1,
      })),
    };

    return {
      provider: 'AniList',
      spotlightAnimes,
      trendingAnimes,
      latestEpisodeAnimes: (data.latestEpisodes?.media || []).map((m: any) => this.formatMediaCard(m)),
      topUpcomingAnimes: (data.topUpcoming?.media || []).map((m: any) => this.formatMediaCard(m)),
      topAiringAnimes: (data.topAiring?.media || []).map((m: any) => this.formatMediaCard(m)),
      mostPopularAnimes: (data.mostPopular?.media || []).map((m: any) => this.formatMediaCard(m)),
      mostFavoriteAnimes: (data.mostFavorite?.media || []).map((m: any) => this.formatMediaCard(m)),
      latestCompletedAnimes: (data.latestCompleted?.media || []).map((m: any) => this.formatMediaCard(m)),
      top10Animes,
      genres: data.genres || [],
    };
  }

  /**
   * 2. Trending Anime
   */
  public async getTrending(page = 1, perPage = 20): Promise<any> {
    return this.getPaginatedList({ sort: ['TRENDING_DESC'], page, perPage });
  }

  /**
   * 3. Most Popular Anime
   */
  public async getPopular(page = 1, perPage = 20): Promise<any> {
    return this.getPaginatedList({ sort: ['POPULARITY_DESC'], page, perPage });
  }

  /**
   * 4. Top Rated / Top Score Anime
   */
  public async getTopRated(page = 1, perPage = 20): Promise<any> {
    return this.getPaginatedList({ sort: ['SCORE_DESC'], page, perPage });
  }

  /**
   * 5. Category (movies, tv, ovas, onas, specials, subbed, dubbed, airing, upcoming)
   */
  public async getByCategory(categorySlug: string, page = 1, perPage = 20): Promise<any> {
    const slug = categorySlug.toLowerCase().trim();
    const vars: any = { page, perPage, sort: ['POPULARITY_DESC'] };

    switch (slug) {
      case 'movie':
      case 'movies':
        vars.format = 'MOVIE';
        break;
      case 'tv':
      case 'tv-series':
        vars.format = 'TV';
        break;
      case 'ova':
      case 'ovas':
        vars.format = 'OVA';
        break;
      case 'ona':
      case 'onas':
        vars.format = 'ONA';
        break;
      case 'special':
      case 'specials':
        vars.format = 'SPECIAL';
        break;
      case 'top-airing':
      case 'airing':
        vars.status = 'RELEASING';
        break;
      case 'top-upcoming':
      case 'upcoming':
        vars.status = 'NOT_YET_RELEASED';
        break;
      case 'completed':
      case 'latest-completed':
        vars.status = 'FINISHED';
        vars.sort = ['END_DATE_DESC'];
        break;
      case 'trending':
        vars.sort = ['TRENDING_DESC'];
        break;
      case 'popular':
      case 'most-popular':
        vars.sort = ['POPULARITY_DESC'];
        break;
      case 'top-rated':
      case 'top-10':
        vars.sort = ['SCORE_DESC'];
        break;
      case 'favorite':
      case 'most-favorite':
        vars.sort = ['FAVOURITES_DESC'];
        break;
      case 'subbed-anime':
      case 'subbed':
      case 'dubbed-anime':
      case 'dubbed':
      default:
        break;
    }

    const listing = await this.getPaginatedList(vars);
    return {
      category: slug,
      ...listing,
    };
  }

  /**
   * 6. Genres Collection & By Genre
   */
  public async getGenres(): Promise<string[]> {
    const data = await this.fetchGraphQL(`query { GenreCollection }`);
    return data.GenreCollection || [];
  }

  public async getByGenre(genre: string, page = 1, perPage = 20): Promise<any> {
    const listing = await this.getPaginatedList({
      genre,
      sort: ['POPULARITY_DESC'],
      page,
      perPage,
    });
    return {
      genreName: genre,
      ...listing,
    };
  }

  /**
   * 7. A-Z List Directory
   */
  public async getAZList(rawLetter: string = 'all', page = 1, perPage = 20): Promise<any> {
    const letter = (rawLetter || 'all').toLowerCase().trim();

    if (letter === 'all') {
      const listing = await this.getPaginatedList({ sort: ['TITLE_ROMAJI'], page, perPage });
      return {
        letter: 'all',
        ...listing,
      };
    }

    // Query popular anime and filter by initial character
    const fetchPage = Math.max(1, page);
    const data = await this.getPaginatedList({
      sort: ['POPULARITY_DESC'],
      page: fetchPage,
      perPage: 50,
    });

    let filtered = data.animes.filter((m: any) => {
      const title = (m.name || m.jname || '').trim();
      if (letter === '0-9') return /^[0-9]/.test(title);
      if (letter === 'other') return /^[^a-zA-Z0-9]/.test(title);
      return title.toUpperCase().startsWith(letter.toUpperCase());
    });

    if (filtered.length < perPage && data.hasNextPage) {
      const nextData = await this.getPaginatedList({
        sort: ['POPULARITY_DESC'],
        page: fetchPage + 1,
        perPage: 50,
      });
      const nextFiltered = nextData.animes.filter((m: any) => {
        const title = (m.name || m.jname || '').trim();
        if (letter === '0-9') return /^[0-9]/.test(title);
        if (letter === 'other') return /^[^a-zA-Z0-9]/.test(title);
        return title.toUpperCase().startsWith(letter.toUpperCase());
      });
      filtered = [...filtered, ...nextFiltered];
    }

    return {
      letter,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(filtered.length / perPage)),
      hasNextPage: filtered.length > perPage,
      total: filtered.length,
      animes: filtered.slice(0, perPage),
    };
  }

  /**
   * 8. Search Suggestions (Typeahead)
   */
  public async getSuggestions(keyword: string): Promise<any> {
    const query = `
      query ($search: String) {
        Page(page: 1, perPage: 8) {
          media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
            id
            title {
              english
              romaji
              native
              userPreferred
            }
            coverImage {
              large
              medium
            }
            format
            seasonYear
            averageScore
          }
        }
      }
    `;

    const data = await this.fetchGraphQL(query, { search: keyword });
    const suggestions = (data.Page?.media || []).map((m: any) => ({
      id: String(m.id),
      name: m.title?.english || m.title?.romaji || m.title?.userPreferred || 'Unknown',
      jname: m.title?.native || m.title?.romaji || null,
      poster: m.coverImage?.large || m.coverImage?.medium || null,
      moreInfo: [
        m.format || 'Anime',
        m.seasonYear ? String(m.seasonYear) : '',
        m.averageScore ? `Score: ${m.averageScore}%` : '',
      ].filter(Boolean),
    }));

    return {
      keyword,
      suggestions,
    };
  }

  /**
   * 9. Catalog Search & Filtering
   */
  public async searchAnime(params: {
    keyword?: string;
    format?: string;
    status?: string;
    genre?: string;
    season?: string;
    seasonYear?: number;
    sort?: string;
    page?: number;
    perPage?: number;
  }): Promise<any> {
    const page = params.page || 1;
    const perPage = params.perPage || 20;
    const sort = params.sort
      ? [params.sort]
      : params.keyword
      ? ['SEARCH_MATCH']
      : ['POPULARITY_DESC'];

    const vars: any = {
      page,
      perPage,
      sort,
      search: params.keyword || undefined,
      format: params.format || undefined,
      status: params.status || undefined,
      genre: params.genre || undefined,
      season: params.season || undefined,
      seasonYear: params.seasonYear || undefined,
    };

    const listing = await this.getPaginatedList(vars);
    return {
      keyword: params.keyword || null,
      ...listing,
    };
  }

  /**
   * 10. Filter Options
   */
  public getFilterOptions() {
    return {
      formats: [
        { label: 'TV Series', value: 'TV' },
        { label: 'TV Short', value: 'TV_SHORT' },
        { label: 'Movie', value: 'MOVIE' },
        { label: 'Special', value: 'SPECIAL' },
        { label: 'OVA', value: 'OVA' },
        { label: 'ONA', value: 'ONA' },
        { label: 'Music Video', value: 'MUSIC' },
      ],
      statuses: [
        { label: 'Finished Airing', value: 'FINISHED' },
        { label: 'Currently Releasing', value: 'RELEASING' },
        { label: 'Not Yet Released', value: 'NOT_YET_RELEASED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'On Hiatus', value: 'HIATUS' },
      ],
      seasons: [
        { label: 'Winter', value: 'WINTER' },
        { label: 'Spring', value: 'SPRING' },
        { label: 'Summer', value: 'SUMMER' },
        { label: 'Fall', value: 'FALL' },
      ],
      sorts: [
        { label: 'Trending', value: 'TRENDING_DESC' },
        { label: 'Most Popular', value: 'POPULARITY_DESC' },
        { label: 'Top Rated / Score', value: 'SCORE_DESC' },
        { label: 'Most Favorited', value: 'FAVOURITES_DESC' },
        { label: 'Recently Added', value: 'START_DATE_DESC' },
        { label: 'Alphabetical', value: 'TITLE_ROMAJI' },
        { label: 'Episode Count', value: 'EPISODES_DESC' },
      ],
    };
  }

  /**
   * 11. Airing Schedule
   */
  public async getSchedule(dateString?: string, page = 1, perPage = 25): Promise<ScheduleData> {
    let targetDate = new Date();
    if (dateString) {
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    const year = targetDate.getUTCFullYear();
    const month = targetDate.getUTCMonth();
    const day = targetDate.getUTCDate();
    const startOfDay = Math.floor(Date.UTC(year, month, day, 0, 0, 0) / 1000);
    const endOfDay = Math.floor(Date.UTC(year, month, day, 23, 59, 59) / 1000);

    const query = `
      query ($airingAt_greater: Int, $airingAt_lesser: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage }
          airingSchedules(
            airingAt_greater: $airingAt_greater,
            airingAt_lesser: $airingAt_lesser,
            sort: TIME
          ) {
            id
            airingAt
            timeUntilAiring
            episode
            media {
              id
              idMal
              title {
                romaji
                english
                native
                userPreferred
              }
              format
              status
              episodes
              coverImage {
                large
                medium
              }
            }
          }
        }
      }
    `;

    const data = await this.fetchGraphQL(query, {
      airingAt_greater: startOfDay,
      airingAt_lesser: endOfDay,
      page,
      perPage,
    });

    const scheduledAnimes: ScheduledAnime[] = (data.Page?.airingSchedules || []).map((item: any) => {
      const airingDate = new Date(item.airingAt * 1000);
      const hours = String(airingDate.getUTCHours()).padStart(2, '0');
      const mins = String(airingDate.getUTCMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${mins}`;

      const name =
        item.media.title.english ||
        item.media.title.romaji ||
        item.media.title.userPreferred ||
        'Unknown';
      const jname = item.media.title.native || item.media.title.romaji || null;

      return {
        id: String(item.media.id),
        time: timeStr,
        name,
        jname,
        airingEpisode: `Ep ${item.episode}`,
        episodeNumber: item.episode,
      };
    });

    const availableDates: ScheduleDateItem[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(targetDate);
      d.setUTCDate(targetDate.getUTCDate() + i);
      const iso = d.toISOString().split('T')[0];
      availableDates.push({
        date: iso,
        dayOfWeek: days[d.getUTCDay()],
        displayDate: `${d.getUTCDate()} ${d.toLocaleString('en-US', { month: 'short' })}`,
        isActive: i === 0,
      });
    }

    const isoDate = targetDate.toISOString().split('T')[0];
    return {
      date: isoDate,
      tzOffset: 0,
      availableDates,
      scheduledAnimes,
    };
  }

  /**
   * 12. Random Anime
   */
  public async getRandomAnime(): Promise<any> {
    const randomPage = Math.floor(Math.random() * 50) + 1;
    const data = await this.getPaginatedList({
      sort: ['POPULARITY_DESC'],
      page: randomPage,
      perPage: 1,
    });
    if (data.animes && data.animes.length > 0) {
      const id = Number(data.animes[0].id);
      return this.getAnimeDetails(id);
    }
    return this.getAnimeDetails(21);
  }

  /**
   * 13. Anime Details
   */
  public async getAnimeDetails(id: number): Promise<AnimeDetailsData & Record<string, any>> {
    const media = await this.getAniListMediaById(id);
    if (!media) {
      throw new Error(`Anime not found on AniList with ID: ${id}`);
    }

    const english = media.title?.english || null;
    const romaji = media.title?.romaji || media.title?.userPreferred || 'Unknown';
    const native = media.title?.native || null;
    const cleanDesc = media.description
      ? media.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
      : null;

    const totalEps =
      typeof media.episodes === 'number'
        ? media.episodes
        : media.nextAiringEpisode
        ? media.nextAiringEpisode.episode - 1
        : null;

    const characters = Array.isArray(media.characters?.edges)
      ? media.characters.edges.map((e: any) => ({
          role: e.role || 'SUPPORTING',
          character: {
            id: e.node?.id || null,
            name: e.node?.name?.full || 'Unknown',
            nativeName: e.node?.name?.native || null,
            image: e.node?.image?.large || e.node?.image?.medium || null,
          },
          voiceActor: e.voiceActors?.[0]
            ? {
                id: e.voiceActors[0].id,
                name: e.voiceActors[0].name?.full || 'Unknown',
                nativeName: e.voiceActors[0].name?.native || null,
                image: e.voiceActors[0].image?.medium || null,
                language: e.voiceActors[0].languageV2 || 'Japanese',
              }
            : null,
        }))
      : [];

    const studios: string[] = Array.isArray(media.studios?.nodes)
      ? media.studios.nodes.map((s: any) => s.name).filter(Boolean)
      : [];

    const relatedAnimes: AnimeCard[] = Array.isArray(media.relations?.edges)
      ? media.relations.edges
          .filter((r: any) => r.node?.type === 'ANIME')
          .map((r: any) => this.formatMediaCard(r.node))
      : [];

    const recommendedAnimes: AnimeCard[] = Array.isArray(media.recommendations?.nodes)
      ? media.recommendations.nodes
          .filter((rec: any) => rec.mediaRecommendation && rec.mediaRecommendation.type === 'ANIME')
          .map((rec: any) => this.formatMediaCard(rec.mediaRecommendation))
      : [];

    const trailer = media.trailer
      ? {
          id: media.trailer.id || null,
          site: media.trailer.site || null,
          thumbnail: media.trailer.thumbnail || null,
          url:
            media.trailer.site === 'youtube' && media.trailer.id
              ? `https://www.youtube.com/watch?v=${media.trailer.id}`
              : null,
        }
      : null;

    return {
      id: String(media.id),
      animeId: String(media.id),
      name: english || romaji,
      jname: native || romaji,
      poster:
        media.coverImage?.extraLarge ||
        media.coverImage?.large ||
        media.coverImage?.medium ||
        null,
      banner: media.bannerImage || null,
      description: cleanDesc,
      stats: {
        rating: media.averageScore ? `${media.averageScore}%` : null,
        quality: 'HD',
        episodes: {
          sub: totalEps,
          dub: totalEps,
          eps: totalEps,
        },
        type: media.format || null,
        duration: media.duration ? `${media.duration}m` : null,
      },
      moreInfo: {
        japanese: native,
        synonyms: Array.isArray(media.synonyms) ? media.synonyms.join(', ') : null,
        aired: media.startDate
          ? `${media.startDate.year || ''}-${media.startDate.month || ''}-${
              media.startDate.day || ''
            }`
          : null,
        premiered:
          media.season && media.seasonYear ? `${media.season} ${media.seasonYear}` : null,
        duration: media.duration ? `${media.duration}m` : null,
        status: media.status || null,
        malScore: media.averageScore ? (media.averageScore / 10).toFixed(1) : null,
        genres: Array.isArray(media.genres) ? media.genres : [],
        studios,
        producers: [],
      },
      characters,
      relations: relatedAnimes,
      relatedAnimes: [],
      recommendedAnimes,
      mostPopularAnimes: [],
      trailer,
      nextAiringEpisode: media.nextAiringEpisode
        ? {
            episode: media.nextAiringEpisode.episode,
            airingAt: media.nextAiringEpisode.airingAt,
            timeUntilAiring: media.nextAiringEpisode.timeUntilAiring,
          }
        : null,
    };
  }

  /**
   * 14. Episodes List
   */
  public async getEpisodes(id: number): Promise<EpisodesData & Record<string, any>> {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { romaji english userPreferred }
          episodes
          status
          nextAiringEpisode { episode airingAt timeUntilAiring }
          streamingEpisodes { title thumbnail url site }
        }
      }
    `;

    const data = await this.fetchGraphQL(query, { id });
    const media = data.Media;
    if (!media) {
      throw new Error(`Anime not found on AniList with ID: ${id}`);
    }

    let aniZipEpisodes: Record<string, any> = {};
    try {
      const azRes = await fetch(`${ANIZIP_ENDPOINT}?anilist_id=${id}`);
      if (azRes.ok) {
        const azJson = (await azRes.json()) as any;
        if (azJson && azJson.episodes) {
          aniZipEpisodes = azJson.episodes;
        }
      }
    } catch {
      // Fallback
    }

    const totalCount =
      typeof media.episodes === 'number' && media.episodes > 0
        ? media.episodes
        : media.nextAiringEpisode
        ? media.nextAiringEpisode.episode - 1
        : Object.keys(aniZipEpisodes).length > 0
        ? Object.keys(aniZipEpisodes).length
        : media.streamingEpisodes?.length || 1;

    const episodes: any[] = [];
    const loopLimit = Math.max(totalCount, media.streamingEpisodes?.length || 0);

    for (let i = 1; i <= loopLimit; i++) {
      const azEp = aniZipEpisodes[String(i)];
      const streamEp = media.streamingEpisodes?.[i - 1];

      const epTitle =
        azEp?.title?.en ||
        azEp?.title?.['x-jat'] ||
        streamEp?.title ||
        `Episode ${i}`;

      const thumbnail = azEp?.image || streamEp?.thumbnail || null;

      episodes.push({
        title: epTitle,
        episodeId: `${id}?ep=${i}`,
        number: i,
        name: `Episode ${i}`,
        isFiller: Boolean(azEp?.airdate === null ? false : azEp?.rating === 'filler'),
        url: streamEp?.url || `/api/v1/anilist/anime/${id}`,
        thumbnail,
        overview: azEp?.overview || azEp?.summary || null,
        airDate: azEp?.airDate || azEp?.airdate || null,
      });
    }

    return {
      animeId: String(id),
      totalEpisodes: episodes.length,
      nextAiringEpisode: media.nextAiringEpisode
        ? {
            episode: media.nextAiringEpisode.episode,
            airingAt: media.nextAiringEpisode.airingAt,
            timeUntilAiring: media.nextAiringEpisode.timeUntilAiring,
          }
        : null,
      episodes,
    };
  }
}

export const aniListService = new AniListService();
export default aniListService;

