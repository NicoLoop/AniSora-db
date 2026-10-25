import type {
  AniSkipData,
  AniSkipRawResponse,
  AniSkipRawResult,
  FormattedSkipTimes,
  SkipIntervalDetail,
} from '../types/aniskip.js';

interface CachedSkipTimes {
  data: AniSkipData;
  timestamp: number;
}

export class AniSkipService {
  private cache = new Map<string, CachedSkipTimes>();
  private idToMalMap = new Map<string, number>();
  private readonly CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
  private readonly NEGATIVE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes for not found

  /**
   * Helper to fetch with timeout
   */
  private async fetchWithTimeout(url: string, timeoutMs = 3500): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SenkaiSora-AniSkip/2.0',
          Accept: 'application/json',
        },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Resolve any provider ID (AniList, MAL, Miruro hash, HiAnime slug) to a numeric MAL ID using ani.zip or mappings
   */
  public async resolveToMalId(
    rawId: string | number,
    provider?: string
  ): Promise<{ malId: number | null; anilistId: number | null }> {
    const cleanId = String(rawId || '').trim();
    if (!cleanId) return { malId: null, anilistId: null };

    const prov = provider?.toLowerCase().trim();
    const cacheKey = `${cleanId}:${prov || 'auto'}`;

    // Check cached ID resolution
    if (this.idToMalMap.has(cacheKey)) {
      const cachedMal = this.idToMalMap.get(cacheKey)!;
      return { malId: cachedMal, anilistId: /^\d+$/.test(cleanId) ? Number(cleanId) : null };
    }

    const isNumeric = /^\d+$/.test(cleanId);

    // Fast Path A: Provider explicitly specified as 'mal'
    if (prov === 'mal' && isNumeric) {
      const numMal = Number(cleanId);
      this.idToMalMap.set(cacheKey, numMal);
      return { malId: numMal, anilistId: null };
    }

    // Fast Path B: Provider explicitly specified as 'anilist'
    if (prov === 'anilist' && isNumeric) {
      const numAl = Number(cleanId);
      try {
        const aniZipRes = await this.fetchWithTimeout(`https://api.ani.zip/mappings?anilist_id=${numAl}`, 2000);
        if (aniZipRes.ok) {
          const aniZipData = await aniZipRes.json();
          if (aniZipData?.mappings?.mal_id) {
            const mappedMal = Number(aniZipData.mappings.mal_id);
            this.idToMalMap.set(cacheKey, mappedMal);
            return { malId: mappedMal, anilistId: numAl };
          }
        }
      } catch {
        // Fallback
      }
      this.idToMalMap.set(cacheKey, numAl);
      return { malId: numAl, anilistId: numAl };
    }

    // Fast Path C: Provider explicitly specified as 'miruro'
    if (prov === 'miruro') {
      try {
        const { miruroService } = await import('./miruro.service.js');
        const sync = await miruroService.syncAnime(cleanId);
        const ext = sync?.externalIds || {};
        const malVal = ext.mal || ext.mal_id;
        const alVal = ext.anilist || ext.anilist_id;
        const mappedMal = malVal ? Number(Array.isArray(malVal) ? malVal[0] : malVal) : null;
        const mappedAl = alVal ? Number(Array.isArray(alVal) ? alVal[0] : alVal) : null;

        if (mappedMal) {
          this.idToMalMap.set(cacheKey, mappedMal);
          return { malId: mappedMal, anilistId: mappedAl };
        }
      } catch {
        // Fallback
      }
    }

    // Fast Path D: Provider explicitly specified as 'hianime'
    if (prov === 'hianime') {
      try {
        const { aniListService } = await import('./anilist.service.js');
        const slug = cleanId.includes('?ep=') ? cleanId.split('?ep=')[0] : cleanId;
        const syncRes = await aniListService.syncAnime(slug);
        if (syncRes?.malId) {
          this.idToMalMap.set(cacheKey, syncRes.malId);
          return { malId: syncRes.malId, anilistId: syncRes.anilistId || null };
        }
      } catch {
        // Fallback
      }
    }

    // --- AUTO-DETECTION FALLBACK (When provider is omitted or 'auto') ---
    if (isNumeric) {
      const numId = Number(cleanId);
      try {
        const aniZipRes = await this.fetchWithTimeout(`https://api.ani.zip/mappings?anilist_id=${numId}`, 2000);
        if (aniZipRes.ok) {
          const aniZipData = await aniZipRes.json();
          if (aniZipData?.mappings?.mal_id) {
            const mappedMal = Number(aniZipData.mappings.mal_id);
            this.idToMalMap.set(cacheKey, mappedMal);
            return { malId: mappedMal, anilistId: numId };
          }
        }
      } catch {
        // Ignore and fallback
      }

      this.idToMalMap.set(cacheKey, numId);
      return { malId: numId, anilistId: null };
    }

    const isMiruroHash = /^[a-zA-Z0-9_-]{28,36}$/.test(cleanId);
    if (isMiruroHash) {
      try {
        const { miruroService } = await import('./miruro.service.js');
        const sync = await miruroService.syncAnime(cleanId);
        const ext = sync?.externalIds || {};
        const malVal = ext.mal || ext.mal_id;
        const alVal = ext.anilist || ext.anilist_id;
        const mappedMal = malVal ? Number(Array.isArray(malVal) ? malVal[0] : malVal) : null;
        const mappedAl = alVal ? Number(Array.isArray(alVal) ? alVal[0] : alVal) : null;

        if (mappedMal) {
          this.idToMalMap.set(cacheKey, mappedMal);
          return { malId: mappedMal, anilistId: mappedAl };
        }
      } catch {
        // Fallback
      }
    }

    try {
      const { aniListService } = await import('./anilist.service.js');
      const slug = cleanId.includes('?ep=') ? cleanId.split('?ep=')[0] : cleanId;
      const syncRes = await aniListService.syncAnime(slug);
      if (syncRes?.malId) {
        this.idToMalMap.set(cacheKey, syncRes.malId);
        return { malId: syncRes.malId, anilistId: syncRes.anilistId || null };
      }
    } catch {
      // Fallback
    }

    return { malId: null, anilistId: null };
  }

  /**
   * Directly queries the AniSkip v2 API
   */
  private async queryAniSkipRaw(malId: number, episode: number, episodeLength = 0): Promise<AniSkipRawResponse | null> {
    const url = `https://api.aniskip.com/v2/skip-times/${malId}/${episode}?types[]=op&types[]=ed&types[]=mixed-op&types[]=mixed-ed&types[]=recap&episodeLength=${episodeLength}`;
    try {
      const res = await this.fetchWithTimeout(url, 3000);
      if (res.status === 404) {
        return { found: false, results: [], message: 'No skip times found', statusCode: 404 };
      }
      if (!res.ok) {
        return null;
      }
      return (await res.json()) as AniSkipRawResponse;
    } catch (err) {
      console.warn(`[AniSkipService] Request failed for MAL ID ${malId} ep ${episode}:`, err);
      return null;
    }
  }

  /**
   * Main method: Fetch intro & outro timestamps using AniSkip API.
   * Works with ANY provider ID (MAL, AniList, HiAnime slug, Miruro hash).
   * Specify optional `provider` for instant routing and 0-mismatch mapping.
   */
  public async getSkipTimes(options: {
    id: string | number;
    episode?: number;
    episodeLength?: number;
    provider?: string;
  }): Promise<AniSkipData> {
    const { id, provider } = options;
    const episode = options.episode || 1;
    const episodeLength = options.episodeLength || 0;
    const cleanId = String(id || '').trim();
    const provClean = (provider || 'auto').toLowerCase().trim();

    const cacheKey = `${cleanId}:${provClean}:${episode}:${episodeLength}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const ttl = cached.data.found ? this.CACHE_TTL : this.NEGATIVE_CACHE_TTL;
      if (Date.now() - cached.timestamp < ttl) {
        return { ...cached.data, cached: true };
      }
    }

    // Step 1: Resolve input ID to MAL ID with provider awareness
    const { malId, anilistId } = await this.resolveToMalId(cleanId, provClean);

    // If no MAL ID could be determined, return empty result
    if (!malId) {
      const emptyData: AniSkipData = {
        found: false,
        malId: null,
        anilistId: anilistId || null,
        episodeNumber: episode,
        episodeLength,
        skipTimes: {},
        results: [],
        source: 'aniskip',
      };
      this.cache.set(cacheKey, { data: emptyData, timestamp: Date.now() });
      return emptyData;
    }

    // Also check MAL-specific cache key to prevent duplicate queries if different alias used
    const malCacheKey = `${malId}:${episode}:${episodeLength}`;
    const malCached = this.cache.get(malCacheKey);
    if (malCached) {
      const ttl = malCached.data.found ? this.CACHE_TTL : this.NEGATIVE_CACHE_TTL;
      if (Date.now() - malCached.timestamp < ttl) {
        const result = { ...malCached.data, anilistId: anilistId || malCached.data.anilistId, cached: true };
        this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    }

    // Step 2: Query AniSkip API
    const rawRes = await this.queryAniSkipRaw(malId, episode, episodeLength);

    const formatted: FormattedSkipTimes = {};
    const results: AniSkipRawResult[] = rawRes?.results || [];

    for (const item of results) {
      const interval: SkipIntervalDetail = {
        startTime: item.interval.startTime,
        endTime: item.interval.endTime,
        duration: Math.round((item.interval.endTime - item.interval.startTime) * 100) / 100,
        skipId: item.skipId,
        skipType: item.skipType,
      };

      if (item.skipType === 'op' && !formatted.op) {
        formatted.op = interval;
      } else if (item.skipType === 'ed' && !formatted.ed) {
        formatted.ed = interval;
      } else if (item.skipType === 'recap' && !formatted.recap) {
        formatted.recap = interval;
      } else if (item.skipType === 'mixed-op' && !formatted.mixedOp) {
        formatted.mixedOp = interval;
      } else if (item.skipType === 'mixed-ed' && !formatted.mixedEd) {
        formatted.mixedEd = interval;
      }
    }

    const finalData: AniSkipData = {
      found: Boolean(rawRes?.found && results.length > 0),
      malId,
      anilistId,
      episodeNumber: episode,
      episodeLength,
      skipTimes: formatted,
      results,
      source: 'aniskip',
    };

    // Cache results under both the raw input key and the canonical malId key
    this.cache.set(cacheKey, { data: finalData, timestamp: Date.now() });
    this.cache.set(malCacheKey, { data: finalData, timestamp: Date.now() });

    return finalData;
  }
}

export const aniSkipService = new AniSkipService();
export default aniSkipService;
