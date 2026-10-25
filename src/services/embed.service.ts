import { aniListService } from './anilist.service.js';
import { miruroService } from './miruro.service.js';
import { scraperService } from './scraper.service.js';
import { aniSkipService } from './aniskip.service.js';
import { extractEpisodeServers } from '../extractors/server.extractor.js';
import { extractEpisodeDownloads } from '../extractors/download.extractor.js';
import { extractMegaPlayDataId, extractMegaPlaySources } from '../extractors/megaplay.extractor.js';
import { extractZokoStream } from '../extractors/zoko.extractor.js';
import { fetchAnimePaheStream } from '../extractors/animepahe.extractor.js';
import { fetchAnitakuStream } from '../extractors/anitaku.extractor.js';
import { fetchAniwaveStream } from '../extractors/aniwave.extractor.js';
import { buildProxyUrl } from '../extractors/vidnest.common.js';
import type {
  UniversalEmbedData,
  UniversalEmbedItem,
  UniversalStreamSource,
  UniversalServerOption,
  UniversalCrossMappings,
  UniversalEmbedAnimeInfo,
  UniversalSkipInterval,
  UniversalSubtitleItem,
  UniversalThumbnailItem,
  UniversalDownloadItem,
} from '../types/embed.js';
import type { EpisodeServersData } from '../types/anime.js';

interface ResolvedIds {
  rawId: string;
  anilistId: number | null;
  malId: number | null;
  kitsuId: number | null;
  anidbId: number | null;
  thetvdbId: number | null;
  hianimeSlug: string | null;
  miruroId: string | null;
  miruroSlug: string | null;
  title: {
    english: string | null;
    romaji: string | null;
    native: string | null;
    userPreferred: string | null;
  };
  poster: string | null;
  banner: string | null;
  description: string | null;
  format: string | null;
  status: string | null;
  season?: string | null;
  year?: number | null;
  totalEpisodes: number | null;
  genres: string[];
  rating?: string | null;
  duration?: string | null;
  aniZip?: any | null;
}

export class UniversalEmbedService {
  private resolvedCache = new Map<string, { data: ResolvedIds; timestamp: number }>();
  private embedCache = new Map<string, { data: UniversalEmbedData; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 mins
  private readonly EMBED_CACHE_TTL = 10 * 60 * 1000; // 10 mins

  /**
   * Helper to execute a promise with a timeout fallback
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }

  // -----------------------------------------------------------------
  // 1. Cross-Platform ID Resolution (Optimized with Provider Routing)
  // -----------------------------------------------------------------
  public async resolveAnime(rawQueryId: string, provider?: string): Promise<ResolvedIds> {
    const cleanId = String(rawQueryId || '').trim();
    if (!cleanId) {
      throw new Error('Anime ID or query is required');
    }

    const provClean = (provider || 'auto').toLowerCase().trim();
    const cacheKey = `${cleanId.toLowerCase()}:${provClean}`;
    const cached = this.resolvedCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    console.log(`[UniversalEmbedService] Fast-resolving anime for "${cleanId}" (provider: ${provClean})...`);

    let anilistId: number | null = null;
    let malId: number | null = null;
    let hianimeSlug: string | null = null;
    let miruroId: string | null = null;
    let miruroSlug: string | null = null;
    let primaryTitle = cleanId;

    let mediaObj: any = null;
    let aniZipObj: any = null;

    const isNumeric = /^\d+$/.test(cleanId);
    const isMiruroHash = /^[a-zA-Z0-9_-]{32}$/.test(cleanId) && !cleanId.includes('-') && !isNumeric;

    // --- DIRECT PROVIDER FAST-PATHS (Zero guesswork & no ID mismatch) ---

    // Direct Provider: MAL
    if (provClean === 'mal' && isNumeric) {
      malId = parseInt(cleanId, 10);
      const [alMediaRes, aniZipRes] = await Promise.allSettled([
        this.withTimeout(aniListService.queryAniList({ idMal: malId }), 2000, null),
        this.withTimeout(aniListService.getAniZipMapping({ malId }), 2000, null),
      ]);

      if (alMediaRes.status === 'fulfilled' && alMediaRes.value) {
        mediaObj = alMediaRes.value;
        anilistId = mediaObj.id;
        primaryTitle = mediaObj.title?.english || mediaObj.title?.romaji || primaryTitle;
      }
      if (aniZipRes.status === 'fulfilled' && aniZipRes.value) {
        aniZipObj = aniZipRes.value;
        if (!anilistId && aniZipObj.mappings?.anilist_id) anilistId = Number(aniZipObj.mappings.anilist_id);
      }
    }

    // Direct Provider: AniList
    else if (provClean === 'anilist' && isNumeric) {
      anilistId = parseInt(cleanId, 10);
      const [alMediaRes, aniZipRes] = await Promise.allSettled([
        this.withTimeout(aniListService.getAniListMediaById(anilistId), 2000, null),
        this.withTimeout(aniListService.getAniZipMapping({ anilistId }), 2000, null),
      ]);

      if (alMediaRes.status === 'fulfilled' && alMediaRes.value) {
        mediaObj = alMediaRes.value;
        malId = mediaObj.idMal || null;
        primaryTitle = mediaObj.title?.english || mediaObj.title?.romaji || primaryTitle;
      }
      if (aniZipRes.status === 'fulfilled' && aniZipRes.value) {
        aniZipObj = aniZipRes.value;
        if (!malId && aniZipObj.mappings?.mal_id) malId = Number(aniZipObj.mappings.mal_id);
      }
    }

    // Direct Provider: Miruro
    else if (provClean === 'miruro') {
      try {
        const resolved = await this.withTimeout(miruroService.resolveToMiruroId(cleanId), 2500, null);
        if (resolved) {
          miruroId = resolved.miruroId;
          miruroSlug = resolved.slug;
          primaryTitle = resolved.title || primaryTitle;
        } else if (isMiruroHash) {
          miruroId = cleanId;
        }

        if (miruroId) {
          const miruroSync = await this.withTimeout(miruroService.syncAnime(miruroId), 2500, null as any);
          if (miruroSync) {
            const ext = miruroSync.externalIds || {};
            const alVal = ext.anilist || ext.anilist_id;
            if (alVal) anilistId = Number(Array.isArray(alVal) ? alVal[0] : alVal);
            const malVal = ext.mal || ext.mal_id;
            if (malVal) malId = Number(Array.isArray(malVal) ? malVal[0] : malVal);

            primaryTitle =
              miruroSync.title?.english ||
              miruroSync.title?.romaji ||
              miruroSync.title?.native ||
              primaryTitle;
          }
        }
      } catch (err) {
        console.warn(`[UniversalEmbedService] Miruro sync failed for ${cleanId}:`, err);
      }
    }

    // Direct Provider: HiAnime
    else if (provClean === 'hianime') {
      let candidateSlug = cleanId;
      if (candidateSlug.includes('?ep=')) {
        candidateSlug = candidateSlug.split('?ep=')[0];
      }
      hianimeSlug = candidateSlug;
      const cleanSlugTitle = candidateSlug.replace(/-\d+$/, '').replace(/-/g, ' ').trim();

      // Concurrently race AniList candidate search and HiAnime sync for ultra-fast resolution
      try {
        const [syncRes, searchRes] = await Promise.allSettled([
          this.withTimeout(aniListService.syncAnime(candidateSlug), 1800, null),
          cleanSlugTitle
            ? this.withTimeout(aniListService.searchAniListCandidates(cleanSlugTitle), 1500, [])
            : Promise.resolve([]),
        ]);

        if (syncRes.status === 'fulfilled' && syncRes.value) {
          anilistId = syncRes.value.anilistId;
          malId = syncRes.value.malId || null;
          primaryTitle = syncRes.value.title?.english || syncRes.value.title?.romaji || primaryTitle;
          if (syncRes.value.hianimeAnimeId) {
            hianimeSlug = syncRes.value.hianimeAnimeId;
          }
        }

        if (!anilistId && searchRes.status === 'fulfilled' && searchRes.value && searchRes.value.length > 0) {
          mediaObj = searchRes.value[0];
          anilistId = mediaObj.id;
          malId = mediaObj.idMal || null;
          primaryTitle = mediaObj.title?.english || mediaObj.title?.romaji || cleanSlugTitle || primaryTitle;
        }
      } catch {
        // Fallback
      }
    }

    // --- AUTO-DETECTION FALLBACK (When provider is omitted or 'auto') ---
    else {
      // CASE A: Input is a Miruro Hash ID
      if (isMiruroHash) {
        try {
          miruroId = cleanId;
          const miruroSync = await this.withTimeout(miruroService.syncAnime(cleanId), 2500, null as any);
          if (miruroSync) {
            const ext = miruroSync.externalIds || {};
            const alVal = ext.anilist || ext.anilist_id;
            if (alVal) anilistId = Number(Array.isArray(alVal) ? alVal[0] : alVal);
            const malVal = ext.mal || ext.mal_id;
            if (malVal) malId = Number(Array.isArray(malVal) ? malVal[0] : malVal);

            primaryTitle =
              miruroSync.title?.english ||
              miruroSync.title?.romaji ||
              miruroSync.title?.native ||
              primaryTitle;
          }
        } catch (err) {
          console.warn(`[UniversalEmbedService] Miruro sync failed for hash ${cleanId}:`, err);
        }
      }

      // CASE B: Input is Numeric (AniList ID or MAL ID)
      if (isNumeric && !anilistId) {
        const numId = parseInt(cleanId, 10);
        const [alMediaRes, aniZipRes] = await Promise.allSettled([
          this.withTimeout(aniListService.getAniListMediaById(numId), 2000, null),
          this.withTimeout(aniListService.getAniZipMapping({ anilistId: numId, malId: numId }), 2000, null),
        ]);

        if (alMediaRes.status === 'fulfilled' && alMediaRes.value) {
          mediaObj = alMediaRes.value;
          anilistId = mediaObj.id;
          malId = mediaObj.idMal || null;
          primaryTitle = mediaObj.title?.english || mediaObj.title?.romaji || primaryTitle;
        }

        if (aniZipRes.status === 'fulfilled' && aniZipRes.value) {
          aniZipObj = aniZipRes.value;
          if (!malId && aniZipObj.mappings?.mal_id) malId = Number(aniZipObj.mappings.mal_id);
          if (!anilistId && aniZipObj.mappings?.anilist_id) anilistId = Number(aniZipObj.mappings.anilist_id);
        }

        if (!anilistId) {
          try {
            mediaObj = await this.withTimeout(aniListService.queryAniList({ idMal: numId }), 1500, null);
            if (mediaObj) {
              anilistId = mediaObj.id;
              malId = mediaObj.idMal || numId;
              primaryTitle = mediaObj.title?.english || mediaObj.title?.romaji || primaryTitle;
            } else {
              malId = numId;
            }
          } catch {
            malId = numId;
          }
        }
      }

      // CASE C: Input is a HiAnime Slug or contains '?ep='
      if (!anilistId && !isNumeric && !isMiruroHash) {
        let candidateSlug = cleanId;
        if (candidateSlug.includes('?ep=')) {
          candidateSlug = candidateSlug.split('?ep=')[0];
        }
        hianimeSlug = candidateSlug;
        const cleanSlugTitle = candidateSlug.replace(/-\d+$/, '').replace(/-/g, ' ').trim();

        try {
          const [syncRes, searchRes] = await Promise.allSettled([
            this.withTimeout(aniListService.syncAnime(candidateSlug), 3500, null),
            cleanSlugTitle
              ? this.withTimeout(aniListService.searchAniListCandidates(cleanSlugTitle), 1500, [])
              : Promise.resolve([]),
          ]);

          if (syncRes.status === 'fulfilled' && syncRes.value) {
            anilistId = syncRes.value.anilistId;
            malId = syncRes.value.malId || null;
            primaryTitle = syncRes.value.title?.english || syncRes.value.title?.romaji || primaryTitle;
            if (syncRes.value.hianimeAnimeId) {
              hianimeSlug = syncRes.value.hianimeAnimeId;
            }
          }

          if (!anilistId && searchRes.status === 'fulfilled' && searchRes.value && searchRes.value.length > 0) {
            mediaObj = searchRes.value[0];
            anilistId = mediaObj.id;
            malId = mediaObj.idMal || null;
            primaryTitle = mediaObj.title?.english || mediaObj.title?.romaji || cleanSlugTitle || primaryTitle;
          }
        } catch {
          // ignore
        }
      }
    }

    // Parallel background resolutions for remaining missing metadata:
    const tasks: Promise<any>[] = [];

    // 1. Fetch complete AniList Media if not loaded
    if (anilistId && !mediaObj) {
      tasks.push(
        (async () => {
          try {
            mediaObj = await this.withTimeout(aniListService.getAniListMediaById(anilistId!), 1500, null);
          } catch {
            // ignore
          }
        })()
      );
    }

    // 2. Fetch AniZip Mapping if not loaded
    if ((anilistId || malId) && !aniZipObj) {
      tasks.push(
        (async () => {
          try {
            aniZipObj = await this.withTimeout(
              aniListService.getAniZipMapping({
                anilistId: anilistId || undefined,
                malId: malId || undefined,
              }),
              1500,
              null
            );
            if (aniZipObj?.mappings) {
              if (!malId && aniZipObj.mappings.mal_id) malId = Number(aniZipObj.mappings.mal_id);
              if (!anilistId && aniZipObj.mappings.anilist_id) anilistId = Number(aniZipObj.mappings.anilist_id);
            }
          } catch {
            // ignore
          }
        })()
      );
    }

    // 3. Resolve HiAnime Slug if missing or unverified
    if ((!hianimeSlug || hianimeSlug === cleanId) && anilistId) {
      tasks.push(
        (async () => {
          try {
            const hianimeSync = await this.withTimeout(aniListService.syncFromAniList(anilistId!), 2500, null);
            const hiObj = hianimeSync?.hianime as any;
            const resolvedHiSlug =
              hiObj?.animeId ||
              hiObj?.id ||
              hiObj?.anime?.info?.id;
            if (resolvedHiSlug) {
              hianimeSlug = String(resolvedHiSlug);
            }
          } catch {
            // ignore
          }
        })()
      );
    }

    // 4. Resolve Miruro ID if missing
    if (!miruroId) {
      tasks.push(
        (async () => {
          try {
            const targetQuery = anilistId ? String(anilistId) : malId ? String(malId) : primaryTitle;
            const resolved = await this.withTimeout(miruroService.resolveToMiruroId(targetQuery), 2500, null);
            if (resolved) {
              miruroId = resolved.miruroId;
              miruroSlug = resolved.slug;
            }
          } catch {
            // ignore
          }
        })()
      );
    }

    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }

    // Fallback: If still no Miruro ID, resolve from anilistId, malId, or primaryTitle
    if (!miruroId && (anilistId || malId || primaryTitle)) {
      try {
        const target = anilistId ? String(anilistId) : malId ? String(malId) : primaryTitle;
        const res = await this.withTimeout(miruroService.resolveToMiruroId(target), 2000, null);
        if (res) {
          miruroId = res.miruroId;
          miruroSlug = res.slug;
        }
      } catch {
        // ignore
      }
    }

    // Fallback: If still no HiAnime slug, search suggestions by primary title
    if (!hianimeSlug && primaryTitle) {
      try {
        const searchTitle = primaryTitle.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
        const suggestRes = await this.withTimeout(
          scraperService.fetchJson<{ status: boolean; html?: string }>(
            `/api/theme/search/suggestions?keyword=${encodeURIComponent(searchTitle)}`
          ),
          1200,
          null
        );
        if (suggestRes?.html) {
          const match = suggestRes.html.match(/href="\/watch\/([^"?]+)/i);
          if (match && match[1]) {
            hianimeSlug = match[1];
          }
        }
      } catch {
        // ignore
      }
    }

    const titleEnglish =
      mediaObj?.title?.english ||
      aniZipObj?.titles?.en ||
      primaryTitle ||
      null;

    const titleRomaji =
      mediaObj?.title?.romaji ||
      aniZipObj?.titles?.['x-jat'] ||
      primaryTitle ||
      null;

    const titleNative =
      mediaObj?.title?.native ||
      aniZipObj?.titles?.ja ||
      null;

    const titleUserPreferred =
      mediaObj?.title?.userPreferred ||
      titleEnglish ||
      titleRomaji ||
      null;

    const resolvedData: ResolvedIds = {
      rawId: cleanId,
      anilistId: anilistId || null,
      malId: malId || null,
      kitsuId: aniZipObj?.mappings?.kitsu_id ? Number(aniZipObj.mappings.kitsu_id) : null,
      anidbId: aniZipObj?.mappings?.anidb_id ? Number(aniZipObj.mappings.anidb_id) : null,
      thetvdbId: aniZipObj?.mappings?.thetvdb_id ? Number(aniZipObj.mappings.thetvdb_id) : null,
      hianimeSlug: hianimeSlug || null,
      miruroId: miruroId || null,
      miruroSlug: miruroSlug || null,
      title: {
        english: titleEnglish,
        romaji: titleRomaji,
        native: titleNative,
        userPreferred: titleUserPreferred,
      },
      poster:
        mediaObj?.coverImage?.extraLarge ||
        mediaObj?.coverImage?.large ||
        aniZipObj?.images?.[0]?.coverUrl ||
        null,
      banner: mediaObj?.bannerImage || null,
      description: mediaObj?.description || null,
      format: mediaObj?.format || 'TV',
      status: mediaObj?.status || 'FINISHED',
      season: mediaObj?.season || null,
      year: mediaObj?.seasonYear || (mediaObj?.startDate?.year ? Number(mediaObj.startDate.year) : null),
      totalEpisodes: mediaObj?.episodes || (aniZipObj?.episodeCount ? Number(aniZipObj.episodeCount) : null),
      genres: mediaObj?.genres || [],
      rating: mediaObj?.averageScore ? `${mediaObj.averageScore}%` : null,
      duration: mediaObj?.duration ? `${mediaObj.duration}m` : null,
      aniZip: aniZipObj,
    };

    // Cache under multiple alias keys for instant lookup across providers
    const now = Date.now();
    this.resolvedCache.set(cleanId.toLowerCase(), { data: resolvedData, timestamp: now });
    if (anilistId) this.resolvedCache.set(String(anilistId), { data: resolvedData, timestamp: now });
    if (malId) this.resolvedCache.set(String(malId), { data: resolvedData, timestamp: now });
    if (hianimeSlug) this.resolvedCache.set(hianimeSlug.toLowerCase(), { data: resolvedData, timestamp: now });
    if (miruroId) this.resolvedCache.set(miruroId.toLowerCase(), { data: resolvedData, timestamp: now });

    return resolvedData;
  }

  // -----------------------------------------------------------------
  // 2. Main Universal Embed Resolver (Heavily Optimized)
  // -----------------------------------------------------------------
  public async getUniversalEmbed(options: {
    id: string;
    episodeNumber?: number;
    category?: 'sub' | 'dub' | 'raw';
    preferredServer?: string;
    provider?: string;
  }): Promise<UniversalEmbedData> {
    const { id, preferredServer, provider } = options;
    const category: 'sub' | 'dub' | 'raw' =
      options.category?.toLowerCase() === 'dub'
        ? 'dub'
        : options.category?.toLowerCase() === 'raw'
        ? 'raw'
        : 'sub';

    let episodeNum = options.episodeNumber || 1;

    let cleanId = id;
    let initialHianimeEpId: string | null = null;
    let initialMiruroEpId: string | null = null;

    if (id.includes('?ep=')) {
      const parts = id.split('?ep=');
      cleanId = parts[0];
      const epVal = parts[1];
      if (/^\d+$/.test(epVal)) {
        const parsed = parseInt(epVal, 10);
        if (parsed < 2000) {
          episodeNum = parsed;
        }
      }
      initialHianimeEpId = id;
      initialMiruroEpId = id;
    }

    const provClean = (provider || 'auto').toLowerCase().trim();

    // Check full embed cache for instant response (< 2ms)
    const embedCacheKey = `${cleanId.toLowerCase()}:${provClean}:${episodeNum}:${category}:${preferredServer || 'default'}`;
    const cachedEmbed = this.embedCache.get(embedCacheKey);
    if (cachedEmbed && Date.now() - cachedEmbed.timestamp < this.EMBED_CACHE_TTL) {
      return cachedEmbed.data;
    }

    // Step 1: Cross-Resolve all Provider IDs with explicit provider routing
    const ids = await this.resolveAnime(cleanId, provClean);

    // Step 2: Resolve Episode IDs & Metadata in Parallel with Timeouts
    let hianimeEpisodeId =
      ids.hianimeSlug && initialHianimeEpId && initialHianimeEpId.startsWith(ids.hianimeSlug)
        ? initialHianimeEpId
        : null;
    let miruroEpisodeId =
      ids.miruroId && initialMiruroEpId && initialMiruroEpId.startsWith(ids.miruroId)
        ? initialMiruroEpId
        : null;
    let episodeTitle: string | null = null;
    let episodeThumbnail: string | null = null;
    let episodeAired: string | null = null;
    let episodeDuration: string | null = null;

    // Fast fallback from AniZip if available
    if (ids.aniZip?.episodes?.[String(episodeNum)]) {
      const azEp = ids.aniZip.episodes[String(episodeNum)];
      if (!episodeTitle) episodeTitle = azEp.title?.en || azEp.title?.['x-jat'] || null;
      if (!episodeAired) episodeAired = azEp.airdate || null;
      if (!episodeThumbnail && azEp.image) episodeThumbnail = azEp.image;
    }

    // Query Miruro and HiAnime episode lists concurrently
    await Promise.allSettled([
      // Miruro episode lookup
      (async () => {
        if (!ids.miruroId || (episodeTitle && miruroEpisodeId)) return;
        try {
          const miruroEps = await this.withTimeout(miruroService.getEpisodes(ids.miruroId), 1500, null);
          if (miruroEps?.episodes) {
            const matchEp = miruroEps.episodes.find((ep) => ep.number === episodeNum);
            if (matchEp) {
              miruroEpisodeId = matchEp.episodeId;
              if (!episodeTitle) episodeTitle = matchEp.title || matchEp.name || null;
              if (!episodeThumbnail) episodeThumbnail = matchEp.url || null;
            }
          }
        } catch {
          // ignore
        }
      })(),

      // HiAnime episode lookup
      (async () => {
        if (hianimeEpisodeId || !ids.hianimeSlug) return;
        try {
          const slugParts = ids.hianimeSlug.split('-');
          const lastNum = slugParts[slugParts.length - 1];
          const queryId = /^\d+$/.test(lastNum) ? lastNum : ids.hianimeSlug;
          const epListRes = await this.withTimeout(
            scraperService.fetchJson<{ status: boolean; html?: string }>(
              `/api/theme/episode/list/${encodeURIComponent(queryId)}`
            ),
            1500,
            null
          );
          if (epListRes?.html) {
            const matchTag = epListRes.html.match(new RegExp(`<a[^>]*?data-number=["']${episodeNum}["'][^>]*?>`, 'i'));
            if (matchTag) {
              const dataIdMatch = matchTag[0].match(/data-id=["'](\d+)["']/i);
              const epMatch = matchTag[0].match(/[?&]ep=(\d+)/i);
              const epId = dataIdMatch?.[1] || epMatch?.[1];
              if (epId) {
                hianimeEpisodeId = `${ids.hianimeSlug}?ep=${epId}`;
              }
            }
          }
          if (!hianimeEpisodeId && ids.hianimeSlug) {
            hianimeEpisodeId = `${ids.hianimeSlug}?ep=${episodeNum}`;
          }
        } catch {
          if (!hianimeEpisodeId && ids.hianimeSlug) {
            hianimeEpisodeId = `${ids.hianimeSlug}?ep=${episodeNum}`;
          }
        }
      })(),
    ]);

    // Step 3: Aggregate Embeds, Streams, and Servers from All Providers
    const embeds: UniversalEmbedItem[] = [];
    const streams: UniversalStreamSource[] = [];
    const serverOptionsSub: UniversalServerOption[] = [];
    const serverOptionsDub: UniversalServerOption[] = [];
    const serverOptionsRaw: UniversalServerOption[] = [];
    const subtitlesMap = new Map<string, UniversalSubtitleItem>();
    let timelineThumbnails: UniversalThumbnailItem | null = null;
    let serverIntro: UniversalSkipInterval | null = null;
    let serverOutro: UniversalSkipInterval | null = null;
    let aniskipIntro: UniversalSkipInterval | null = null;
    let aniskipOutro: UniversalSkipInterval | null = null;
    let introInterval: UniversalSkipInterval | null = null;
    let outroInterval: UniversalSkipInterval | null = null;
    const downloads: UniversalDownloadItem[] = [];

    // --- TASK 0: Instant AniSkip Intro/Outro Lookup (< 300 ms) ---
    const aniskipTask = async () => {
      const targetId = ids.malId || ids.anilistId || cleanId;
      const skipProvider = ids.malId ? 'mal' : provClean !== 'auto' ? provClean : undefined;
      try {
        const skipRes = await this.withTimeout(
          aniSkipService.getSkipTimes({ id: targetId, episode: episodeNum, provider: skipProvider }),
          2000,
          null
        );
        if (skipRes?.found) {
          if (skipRes.skipTimes.op) {
            aniskipIntro = {
              start: skipRes.skipTimes.op.startTime,
              end: skipRes.skipTimes.op.endTime,
            };
          }
          if (skipRes.skipTimes.ed) {
            aniskipOutro = {
              start: skipRes.skipTimes.ed.startTime,
              end: skipRes.skipTimes.ed.endTime,
            };
          }
        }
      } catch {
        // ignore
      }
    };

    // --- TASK 1: Miruro Servers, Embed & Direct Stream Extraction ---
    const miruroTask = async () => {
      if (!ids.miruroId) return;
      try {
        // Run getServers, getUnifiedStreamServers, and getEmbedSources concurrently!
        const [mServersRes, mUnifiedStreamsRes, mEmbedRes] = await Promise.allSettled([
          this.withTimeout(miruroService.getServers(ids.miruroId, episodeNum), 3000, null),
          this.withTimeout(miruroService.getUnifiedStreamServers(ids.miruroId, episodeNum, undefined, category), 4000, []),
          this.withTimeout(miruroService.getEmbedSources(ids.miruroId, episodeNum, preferredServer, category), 3000, null),
        ]);

        const unifiedStreams = mUnifiedStreamsRes.status === 'fulfilled' ? (mUnifiedStreamsRes.value || []) : [];

        if (mServersRes.status === 'fulfilled' && mServersRes.value) {
          const mServers = mServersRes.value;
          for (const s of mServers.sub) {
            const streamMatch = unifiedStreams.find((st) => st.server.toLowerCase() === s.serverName.toLowerCase());
            serverOptionsSub.push({
              serverId: s.serverId,
              serverName: s.serverName,
              provider: `miruro (${s.provider})`,
              category: 'sub',
              hasStream: Boolean(streamMatch?.streamurl) || s.hasEmbed,
              hasEmbed: true,
              intro: streamMatch?.timestamp?.intro || null,
              outro: streamMatch?.timestamp?.outro || null,
            });
          }
          for (const s of mServers.dub) {
            serverOptionsDub.push({
              serverId: s.serverId,
              serverName: s.serverName,
              provider: `miruro (${s.provider})`,
              category: 'dub',
              hasStream: Boolean(s.hasEmbed),
              hasEmbed: true,
            });
          }
          for (const s of mServers.raw) {
            serverOptionsRaw.push({
              serverId: s.serverId,
              serverName: s.serverName,
              provider: `miruro (${s.provider})`,
              category: 'raw',
              hasStream: Boolean(s.hasEmbed),
              hasEmbed: true,
            });
          }
        }

        // Direct Proxied Streams from Miruro unified servers
        for (const ms of unifiedStreams) {
          if (ms.streamurl) {
            streams.push({
              server: ms.server,
              provider: 'miruro',
              category,
              url: ms.streamurl,
              proxyUrl: ms.proxyUrl,
              quality: 'auto',
              isM3U8: Boolean(ms.streamurl?.includes('.m3u8')),
              intro: ms.timestamp?.intro || null,
              outro: ms.timestamp?.outro || null,
              thumbnails: ms.thumbnail || null,
              headers: ms.headers || undefined,
            });

            if (ms.timestamp?.intro && !serverIntro) serverIntro = ms.timestamp.intro;
            if (ms.timestamp?.outro && !serverOutro) serverOutro = ms.timestamp.outro;
            if (ms.thumbnail && !timelineThumbnails) {
              timelineThumbnails = { url: ms.thumbnail, vtt: ms.thumbnail, format: 'vtt' };
            }
          }

          if (ms.subtitle?.length) {
            for (const sub of ms.subtitle) {
              const lang = sub.label || sub.lang || 'English';
              if (!subtitlesMap.has(lang)) {
                subtitlesMap.set(lang, {
                  language: lang,
                  url: sub.url,
                  proxyUrl: sub.url,
                  format: 'vtt',
                  default: sub.default,
                });
              }
            }
          }

          if (ms.downloads?.length) {
            for (const dl of ms.downloads) {
              if (dl.url && !downloads.some((d) => d.url === dl.url)) {
                downloads.push({
                  resolution: dl.quality || undefined,
                  quality: dl.quality,
                  url: dl.url,
                  size: dl.size,
                  fansub: 'Miruro UltraCloud',
                  provider: 'Miruro',
                });
              }
            }
          }
        }

        if (mEmbedRes.status === 'fulfilled' && mEmbedRes.value) {
          const mEmbed = mEmbedRes.value;
          if (mEmbed?.embedUrl) {
            const mappedSubs: UniversalSubtitleItem[] = (mEmbed.subtitles || []).map((s) => ({
              language: s.label || s.lang || 'English',
              url: s.src,
              format: 'vtt',
              default: Boolean(s.default),
            }));

            const mappedDownloads: UniversalDownloadItem[] = (mEmbed.downloads || []).map((dl) => ({
              resolution: dl.quality || undefined,
              quality: dl.quality,
              url: dl.url,
              size: dl.size,
              fansub: dl.fansub || 'Miruro UltraCloud',
              provider: 'Miruro',
            }));

            const mappedThumbnails: UniversalThumbnailItem | null = mEmbed.thumbnails
              ? {
                  url: mEmbed.thumbnails.vtt || undefined,
                  vtt: mEmbed.thumbnails.vtt,
                  sprite: mEmbed.thumbnails.sprite,
                  format: 'vtt',
                }
              : null;

            embeds.push({
              server: mEmbed.server,
              provider: 'miruro',
              category: (mEmbed.category as 'sub' | 'dub' | 'raw') || category,
              embedUrl: mEmbed.embedUrl,
              fallbackEmbedUrl: mEmbed.fallbackEmbedUrl,
              type: 'iframe',
              subtitles: mappedSubs,
              thumbnails: mappedThumbnails,
              downloads: mappedDownloads,
              headers: mEmbed.headers || undefined,
            });

            for (const sub of mappedSubs) {
              if (!subtitlesMap.has(sub.language)) {
                subtitlesMap.set(sub.language, sub);
              }
            }

            if (mappedThumbnails && !timelineThumbnails) {
              timelineThumbnails = mappedThumbnails;
            }

            for (const dl of mappedDownloads) {
              if (dl.url && !downloads.some((d) => d.url === dl.url)) {
                downloads.push(dl);
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[UniversalEmbedService] Miruro embed task failed for ${ids.miruroId}:`, err);
      }
    };

    // --- TASK 2: HiAnime Episode Servers & HD-1 MegaPlay Extraction ---
    const hianimeTask = async () => {
      if (!hianimeEpisodeId) return;
      try {
        const epIdClean = hianimeEpisodeId.includes('?ep=')
          ? hianimeEpisodeId.split('?ep=')[1]
          : hianimeEpisodeId;

        const serversUrl = `/api/theme/episode/servers?episodeId=${encodeURIComponent(epIdClean)}`;
        const serversRes = await this.withTimeout(
          scraperService.fetchJson<{ status: boolean; html?: string }>(serversUrl),
          2000,
          null
        );

        if (serversRes?.html) {
          const parsedServers: EpisodeServersData = extractEpisodeServers(serversRes.html, hianimeEpisodeId);

          for (const s of parsedServers.sub) {
            serverOptionsSub.push({
              serverName: s.serverName,
              provider: 'hianime',
              category: 'sub',
              embedUrl: s.streamUrl,
              hasStream: s.serverName.includes('HD-1') || s.serverName.includes('Zoko'),
              hasEmbed: Boolean(s.streamUrl),
            });
            if (s.streamUrl) {
              embeds.push({
                server: s.serverName,
                provider: 'hianime',
                category: 'sub',
                embedUrl: s.streamUrl,
                type: 'iframe',
              });
            }
          }

          for (const s of parsedServers.dub) {
            serverOptionsDub.push({
              serverName: s.serverName,
              provider: 'hianime',
              category: 'dub',
              embedUrl: s.streamUrl,
              hasStream: s.serverName.includes('HD-1') || s.serverName.includes('Zoko'),
              hasEmbed: Boolean(s.streamUrl),
            });
            if (s.streamUrl) {
              embeds.push({
                server: s.serverName,
                provider: 'hianime',
                category: 'dub',
                embedUrl: s.streamUrl,
                type: 'iframe',
              });
            }
          }

          for (const s of parsedServers.raw) {
            serverOptionsRaw.push({
              serverName: s.serverName,
              provider: 'hianime',
              category: 'raw',
              embedUrl: s.streamUrl,
              hasStream: false,
              hasEmbed: Boolean(s.streamUrl),
            });
          }

          // Check if MegaPlay HD-1 stream URL is present in the requested category
          const targetList = category === 'dub' ? parsedServers.dub : parsedServers.sub;
          const megaServer = targetList.find((srv) => srv.serverName.includes('HD-1') || srv.streamUrl?.includes('megaplay'));

          if (megaServer && megaServer.streamUrl) {
            try {
              const pageHtml = await this.withTimeout(
                scraperService.fetchDirect(megaServer.streamUrl, {
                  Referer: `${scraperService.getActiveBaseUrl()}/`,
                }),
                1500,
                ''
              );
              if (pageHtml) {
                const dataId = extractMegaPlayDataId(pageHtml);
                const sourcesUrl = `https://megaplay.buzz/stream/getSources?id=${encodeURIComponent(dataId)}`;
                const sourcesRaw = await this.withTimeout(
                  scraperService.fetchDirect(sourcesUrl, {
                    Referer: megaServer.streamUrl,
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json, text/javascript, */*; q=0.01',
                  }),
                  1800,
                  ''
                );
                if (sourcesRaw) {
                  const sourcesData = JSON.parse(sourcesRaw);
                  const extractedMega = extractMegaPlaySources(sourcesData, megaServer.streamUrl);

                  if (extractedMega.sources?.length) {
                    for (const src of extractedMega.sources) {
                      streams.push({
                        server: 'HD-1 (MegaPlay)',
                        provider: 'hianime',
                        category,
                        url: src.url,
                        quality: 'auto',
                        isM3U8: src.isM3U8,
                        intro: extractedMega.intro || null,
                        outro: extractedMega.outro || null,
                        thumbnails: extractedMega.thumbnails || null,
                      });
                    }
                  }

                  if (extractedMega.intro && !serverIntro) serverIntro = extractedMega.intro;
                  if (extractedMega.outro && !serverOutro) serverOutro = extractedMega.outro;
                  if (extractedMega.thumbnails) {
                    timelineThumbnails = {
                      url: extractedMega.thumbnails,
                      vtt: extractedMega.thumbnails,
                      format: 'vtt',
                    };
                  }

                  if (extractedMega.subtitles) {
                    for (const trk of extractedMega.subtitles) {
                      const lang = trk.label || trk.lang || 'English';
                      if (!subtitlesMap.has(lang)) {
                        subtitlesMap.set(lang, {
                          language: lang,
                          url: trk.src,
                          format: 'vtt',
                          default: Boolean(trk.default),
                        });
                      }
                    }
                  }
                }
              }
            } catch {
              // MegaPlay extraction fallback
            }
          }

          // HiAnime Real Kiwi Sub/Dub Downloads
          try {
            const resolvedDataId = await scraperService.resolveEpisodeDataId(
              hianimeEpisodeId || ids.hianimeSlug || '',
              episodeNum
            );
            if (resolvedDataId) {
              const dlRes = await this.withTimeout(
                scraperService.fetchJson<{ status: boolean; html?: string }>(
                  `/api/theme/episode/downloads?episodeId=${encodeURIComponent(resolvedDataId)}`
                ),
                2500,
                null
              );
              if (dlRes?.html) {
                const extractedDl = extractEpisodeDownloads(dlRes.html, resolvedDataId);
                for (const dl of extractedDl.downloads || []) {
                  if (dl.url && !downloads.some((d) => d.url === dl.url)) {
                    downloads.push({
                      quality: dl.quality,
                      resolution: dl.quality,
                      url: dl.url,
                      fansub: `HiAnime (${dl.source || 'Kiwi'})`,
                      provider: 'HiAnime',
                    });
                  }
                }
              }
            }
          } catch {
            // ignore download fetch error
          }
        }
      } catch (err) {
        console.warn(`[UniversalEmbedService] HiAnime task failed for ${ids.hianimeSlug}:`, err);
      }
    };

    // --- TASK 3: ZokoAnime Direct Streams ---
    const zokoTask = async () => {
      const zokoId = ids.malId ? ids.malId : ids.anilistId;
      const zokoProvider = ids.malId ? 'mal' : 'anilist';
      if (!zokoId) return;

      try {
        const cat = category === 'dub' ? 'dub' : 'sub';
        const zokoUrl = ids.malId
          ? `https://zokoanime.video/embed/${ids.malId}/${episodeNum}/${cat}`
          : `https://zokoanime.video/stream/${zokoProvider}/${zokoId}/${episodeNum}/${cat}`;

        const listToUpdate = cat === 'dub' ? serverOptionsDub : serverOptionsSub;
        if (!listToUpdate.some((s) => s.serverName === 'ZokoAnime')) {
          listToUpdate.push({
            serverName: 'ZokoAnime',
            provider: 'zoko',
            category,
            embedUrl: zokoUrl,
            hasStream: true,
            hasEmbed: true,
          });
        }

        const zokoHtml = await this.withTimeout(
          scraperService.fetchDirect(zokoUrl, {
            Referer: `${scraperService.getActiveBaseUrl()}/`,
          }),
          2000,
          ''
        );

        if (zokoHtml) {
          const zokoData = extractZokoStream(zokoHtml, zokoUrl);
          if (zokoData.sources?.length) {
            const zokoHeaders = {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Referer: 'https://zokoanime.video/',
              Origin: 'https://zokoanime.video',
            };
            for (const src of zokoData.sources) {
              streams.push({
                server: 'ZokoAnime',
                provider: 'zoko',
                category,
                url: src.url,
                proxyUrl: buildProxyUrl(src.url, zokoHeaders),
                quality: 'auto',
                isM3U8: src.isM3U8,
                intro: zokoData.intro || null,
                outro: zokoData.outro || null,
              });
            }
          }

          if (zokoData.downloadUrl) {
            downloads.push({
              quality: '1080p',
              resolution: '1080p',
              url: zokoData.downloadUrl,
              fansub: 'ZokoAnime Direct',
              provider: 'ZokoAnime',
            });
          }

          if (zokoData.intro && !serverIntro) serverIntro = zokoData.intro;
          if (zokoData.outro && !serverOutro) serverOutro = zokoData.outro;

          if (zokoData.subtitles) {
            for (const sub of zokoData.subtitles) {
              const lang = sub.label || sub.lang || 'English';
              if (!subtitlesMap.has(lang)) {
                subtitlesMap.set(lang, { language: lang, url: sub.src, format: 'vtt', default: sub.default });
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[UniversalEmbedService] ZokoAnime task failed for MAL/AniList ID ${zokoId}:`, err);
      }
    };

    // --- TASK 4: AnimePahe, Anitaku, Aniwave Direct Streams ---
    const directExtractorsTask = async () => {
      if (!ids.anilistId) return;
      const anilistIdStr = String(ids.anilistId);
      const cat = category === 'dub' ? 'dub' : 'sub';
      const listToUpdate = cat === 'dub' ? serverOptionsDub : serverOptionsSub;

      const results = await Promise.allSettled([
        this.withTimeout(fetchAnimePaheStream(anilistIdStr, episodeNum, cat), 2500, null),
        this.withTimeout(fetchAnitakuStream(anilistIdStr, episodeNum, cat), 2500, null),
        this.withTimeout(fetchAniwaveStream(anilistIdStr, episodeNum, cat), 2500, null),
      ]);

      // AnimePahe
      if (results[0].status === 'fulfilled' && results[0].value) {
        const pahe = results[0].value;
        if (!listToUpdate.some((s) => s.serverName === 'AnimePahe')) {
          listToUpdate.push({
            serverName: 'AnimePahe',
            provider: 'vidnest',
            category,
            hasStream: true,
            hasEmbed: false,
            intro: pahe.intro || null,
            outro: pahe.outro || null,
          });
        }
        for (const src of pahe.sources) {
          streams.push({
            server: 'AnimePahe',
            provider: 'vidnest',
            category,
            url: src.url,
            proxyUrl: src.proxyUrl,
            quality: src.quality,
            isM3U8: src.isM3U8,
            intro: pahe.intro || null,
            outro: pahe.outro || null,
          });
        }
        if (pahe.intro && !serverIntro) serverIntro = pahe.intro;
        if (pahe.outro && !serverOutro) serverOutro = pahe.outro;
        if (pahe.subtitles) {
          for (const sub of pahe.subtitles) {
            const lang = sub.label || sub.lang || 'English';
            if (!subtitlesMap.has(lang)) {
              subtitlesMap.set(lang, { language: lang, url: sub.src, format: 'vtt', default: sub.default });
            }
          }
        }
      }

      // Anitaku
      if (results[1].status === 'fulfilled' && results[1].value) {
        const anitaku = results[1].value;
        if (!listToUpdate.some((s) => s.serverName === 'Anitaku')) {
          listToUpdate.push({
            serverName: 'Anitaku',
            provider: 'vidnest',
            category,
            hasStream: true,
            hasEmbed: false,
          });
        }
        for (const src of anitaku.sources) {
          streams.push({
            server: 'Anitaku',
            provider: 'vidnest',
            category,
            url: src.url,
            proxyUrl: src.proxyUrl,
            quality: src.quality,
            isM3U8: src.isM3U8,
          });
        }
      }

      // Aniwave
      if (results[2].status === 'fulfilled' && results[2].value) {
        const aniwave = results[2].value;
        if (!listToUpdate.some((s) => s.serverName === 'Aniwave')) {
          listToUpdate.push({
            serverName: 'Aniwave',
            provider: 'vidnest',
            category,
            hasStream: true,
            hasEmbed: false,
          });
        }
        for (const src of aniwave.sources) {
          streams.push({
            server: 'Aniwave',
            provider: 'vidnest',
            category,
            url: src.url,
            proxyUrl: src.proxyUrl,
            quality: src.quality,
            isM3U8: src.isM3U8,
          });
        }
      }
    };

    // Execute all stream extraction and embed gathering tasks concurrently with a maximum total race limit
    await Promise.allSettled([
      aniskipTask(),
      miruroTask(),
      hianimeTask(),
      zokoTask(),
      directExtractorsTask(),
    ]);

    // Use server intro/outro first; fallback to AniSkip if server has none
    const effectiveIntro = serverIntro || aniskipIntro || null;
    const effectiveOutro = serverOutro || aniskipOutro || null;
    introInterval = effectiveIntro;
    outroInterval = effectiveOutro;

    // Ensure all server options have intro & outro populated
    for (const s of serverOptionsSub) {
      if (!s.intro) s.intro = effectiveIntro;
      if (!s.outro) s.outro = effectiveOutro;
    }
    for (const s of serverOptionsDub) {
      if (!s.intro) s.intro = effectiveIntro;
      if (!s.outro) s.outro = effectiveOutro;
    }
    for (const s of serverOptionsRaw) {
      if (!s.intro) s.intro = effectiveIntro;
      if (!s.outro) s.outro = effectiveOutro;
    }

    // Ensure all direct stream items have intro & outro populated
    for (const st of streams) {
      if (!st.intro) st.intro = effectiveIntro;
      if (!st.outro) st.outro = effectiveOutro;
    }

    // Step 4: Determine Primary Embed Item
    let primaryEmbed: UniversalEmbedItem | null = null;

    if (preferredServer) {
      primaryEmbed = embeds.find((e) => e.server.toLowerCase().includes(preferredServer.toLowerCase())) || null;
    }

    if (!primaryEmbed && provClean !== 'auto') {
      primaryEmbed = embeds.find((e) => e.provider.toLowerCase() === provClean && e.embedUrl.startsWith('http')) || null;
    }

    if (!primaryEmbed) {
      // Prioritize fast direct HLS or Miruro fast iframe embeds (Kwik, MegaCloud, Vidplay)
      primaryEmbed =
        embeds.find((e) => e.provider === 'miruro' && e.embedUrl.startsWith('http')) ||
        embeds.find((e) => e.server.includes('HD-1') || e.embedUrl.includes('megaplay')) ||
        embeds.find((e) => e.server.includes('Zoko') || e.embedUrl.includes('zoko')) ||
        (embeds.length > 0 ? embeds[0] : null);
    }

    // Prepare unified Anime and Cross-Mappings payload
    const animeInfo: UniversalEmbedAnimeInfo = {
      id: cleanId,
      resolvedId: ids.miruroId || ids.hianimeSlug || String(ids.anilistId) || cleanId,
      title: ids.title,
      poster: ids.poster,
      banner: ids.banner,
      description: ids.description,
      format: ids.format,
      status: ids.status,
      season: ids.season,
      year: ids.year,
      totalEpisodes: ids.totalEpisodes,
      currentEpisode: episodeNum,
      episodeTitle: episodeTitle || `Episode ${episodeNum}`,
      episodeThumbnail,
      episodeAired,
      episodeDuration,
      genres: ids.genres,
      rating: ids.rating,
      duration: ids.duration,
    };

    const crossMappings: UniversalCrossMappings = {
      anilistId: ids.anilistId,
      malId: ids.malId,
      kitsuId: ids.kitsuId,
      anidbId: ids.anidbId,
      thetvdbId: ids.thetvdbId,
      hianime: ids.hianimeSlug
        ? {
            animeId: ids.hianimeSlug,
            episodeId: hianimeEpisodeId,
            episodeNo: episodeNum,
          }
        : null,
      miruro: ids.miruroId
        ? {
            id: ids.miruroId,
            slug: ids.miruroSlug || undefined,
            episodeId: miruroEpisodeId,
            episodeNo: episodeNum,
          }
        : null,
    };

    // Deduplicate servers options by serverName and category
    const dedupeServers = (list: UniversalServerOption[]) => {
      const seen = new Set<string>();
      return list.filter((s) => {
        const key = `${s.serverName.toLowerCase()}-${s.category}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const finalData: UniversalEmbedData = {
      anime: animeInfo,
      mappings: crossMappings,
      primaryEmbed,
      embeds,
      streams,
      servers: {
        sub: dedupeServers(serverOptionsSub),
        dub: dedupeServers(serverOptionsDub),
        raw: dedupeServers(serverOptionsRaw),
      },
      subtitles: Array.from(subtitlesMap.values()),
      thumbnails: timelineThumbnails,
      intro: introInterval,
      outro: outroInterval,
      downloads,
    };

    // Cache final response for 10 minutes
    this.embedCache.set(embedCacheKey, { data: finalData, timestamp: Date.now() });

    return finalData;
  }
}

export const universalEmbedService = new UniversalEmbedService();
export default universalEmbedService;
