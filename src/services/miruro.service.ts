import {
  MiruroAnimeItem,
  MiruroAnimeDetail,
  MiruroEpisode,
  MiruroEpisodeServersResponse,
  MiruroEmbedResponse,
  MiruroHomeData,
  MiruroScheduleEntry,
  MiruroSearchFilters,
  MiruroServerInfo,
  MiruroStreamResponse,
  MiruroStreamSource,
  MiruroStreamSubtitle
} from '../types/miruro.js';
import { buildProxyUrl } from '../extractors/vidnest.common.js';
import {
  UnifiedServerStreamItem,
  buildUnifiedServerStreamItem,
} from '../utils/stream-formatter.js';
import {
  AnimeCard,
  SpotlightAnime,
  TrendingAnime,
  AnimeDetailsData,
  EpisodesData,
  AnimeEpisode
} from '../types/anime.js';


interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const WATCH_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export class MiruroService {
  private baseUrl: string;
  private cache = new Map<string, CacheEntry<any>>();
  private idResolutionCache = new Map<string, { miruroId: string; slug: string; title: string }>();

  constructor() {
    this.baseUrl = (process.env.MIRURO_BASE_URL || 'https://miruro.to').replace(/\/+$/, '');
  }

  // ----------------------------------------------------
  // SvelteKit Devalue Deserializer
  // ----------------------------------------------------
  public parseDevalue(rawData: any[]): any {
    if (!rawData || !Array.isArray(rawData)) return rawData;
    const cache = new Map<number, any>();

    const hydrate = (val: any): any => {
      if (val === undefined || val === null) return val;
      if (typeof val !== 'number') return val;
      if (cache.has(val)) return cache.get(val);

      const item = rawData[val];
      if (item === undefined || item === null) return item;
      if (typeof item !== 'object') {
        cache.set(val, item);
        return item;
      }

      if (Array.isArray(item)) {
        const arr: any[] = [];
        cache.set(val, arr);
        for (let i = 0; i < item.length; i++) {
          arr.push(hydrate(item[i]));
        }
        return arr;
      }

      const obj: Record<string, any> = {};
      cache.set(val, obj);
      for (const [k, v] of Object.entries(item)) {
        obj[k] = hydrate(v);
      }
      return obj;
    };

    return hydrate(0);
  }

  // ----------------------------------------------------
  // SvelteKit HTTP Request Fetcher with Redirect Handling
  // ----------------------------------------------------
  private async fetchSvelteData(pathAndQuery: string): Promise<any[]> {
    const url = `${this.baseUrl}${pathAndQuery}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': `${this.baseUrl}/`,
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!res.ok) {
      throw new Error(`Miruro request failed with status ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    // Check if the first line is a SvelteKit redirect
    try {
      const first = JSON.parse(lines[0]);
      if (first.type === 'redirect' && first.location) {
        const target = new URL(first.location, this.baseUrl);
        const dataPath = `${target.pathname}/__data.json${target.search}`;
        return this.fetchSvelteData(dataPath);
      }
    } catch {
      // not json, continue
    }

    const parsedChunks: any[] = [];
    for (const line of lines) {
      try {
        parsedChunks.push(JSON.parse(line));
      } catch (err) {
        // ignore malformed line
      }
    }
    return parsedChunks;
  }

  private getCached<T>(key: string, ttl = CACHE_TTL_MS): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCached<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // ----------------------------------------------------
  // ----------------------------------------------------
  // ID / Title Resolution
  // ----------------------------------------------------
  public async resolveToMiruroId(idOrQuery: any): Promise<{ miruroId: string; slug: string; title: string }> {
    let raw = idOrQuery;
    if (typeof raw === 'object' && raw !== null) {
      raw = raw.miruroId || raw.id || raw.animeId || raw.slug || '';
    }
    const trimmed = String(raw || '').trim();
    if (!trimmed || trimmed === '[object Object]') {
      throw new Error('Anime identifier or query cannot be empty');
    }

    let cleanTrimmed = trimmed;
    if (cleanTrimmed.includes('?ep=')) {
      cleanTrimmed = cleanTrimmed.split('?ep=')[0].trim();
    }

    if (this.idResolutionCache.has(cleanTrimmed)) {
      return this.idResolutionCache.get(cleanTrimmed)!;
    }

    // 1. If it looks like a genuine Miruro 32-character hash (e.g. ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz)
    // Real Miruro IDs are 32 alphanumeric/base64url characters and NOT lowercase hyphenated English words
    if (/^[a-zA-Z0-9_-]{32}$/.test(cleanTrimmed) && !/^[a-z]+-[a-z]+/i.test(cleanTrimmed) && !cleanTrimmed.includes('--')) {
      try {
        const chunks = await this.fetchSvelteData(`/info/${cleanTrimmed}/_/__data.json`);
        if (chunks.length > 0 && chunks[0].nodes?.[1]?.data) {
          const infoObj = this.parseDevalue(chunks[0].nodes[1].data);
          if (infoObj?.detail && (infoObj.detail.id === cleanTrimmed || infoObj.detail.id)) {
            const miruroId = infoObj.detail.id;
            const slug = infoObj.currentSlug || miruroId;
            const title = infoObj.detail.title?.english || infoObj.detail.title?.romaji || infoObj.detail.title?.native || cleanTrimmed;
            const resolved = { miruroId, slug, title };
            this.idResolutionCache.set(cleanTrimmed, resolved);
            this.idResolutionCache.set(miruroId, resolved);
            return resolved;
          }
        }
      } catch {
        // Fall through to search if hash fetch failed
      }
    }

    // 2. Identify target IDs and Search Title
    let searchTitle = cleanTrimmed;
    let targetAnilistId = '';
    let targetMalId = '';

    if (/^\d+$/.test(cleanTrimmed)) {
      // Numeric: AniList or MAL ID
      targetAnilistId = cleanTrimmed;
      targetMalId = cleanTrimmed;
      try {
        const gql = `query ($id: Int) { Media (id: $id, type: ANIME) { id idMal title { romaji english } } }`;
        const alRes = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: gql, variables: { id: parseInt(cleanTrimmed, 10) } })
        });
        if (alRes.ok) {
          const alJson = (await alRes.json()) as any;
          const media = alJson.data?.Media;
          if (media) {
            searchTitle = media.title?.romaji || media.title?.english || searchTitle;
            if (media.idMal) targetMalId = String(media.idMal);
          }
        }
      } catch {
        // continue with numeric search
      }
    } else {
      // Slug or Title: Clean slug format (e.g. "attack-on-titan-season-2-113" -> "attack on titan season 2")
      const slugTitle = cleanTrimmed.replace(/-\d+$/, '').replace(/-/g, ' ').trim();
      searchTitle = slugTitle;

      // Try resolving AniList ID via aniListService for precise franchise matching
      try {
        const { aniListService } = await import('./anilist.service.js');
        const syncRes = await aniListService.syncAnime(cleanTrimmed);
        if (syncRes?.anilistId) {
          targetAnilistId = String(syncRes.anilistId);
          if (syncRes.malId) targetMalId = String(syncRes.malId);
          searchTitle = syncRes.title?.romaji || syncRes.title?.english || searchTitle;
        }
      } catch {
        // fallback to slugTitle search
      }
    }

    // 3. Search Miruro Catalog
    const matchesId = (val: any, target: string) => {
      if (!val || !target) return false;
      const t = String(target).trim();
      if (Array.isArray(val)) return val.some((v) => String(v).trim() === t);
      return String(val).trim() === t;
    };

    const searchChunks = await this.fetchSvelteData(`/search/__data.json?q=${encodeURIComponent(searchTitle)}`);
    if (searchChunks.length > 0 && searchChunks[0].nodes?.[1]?.data) {
      const sObj = this.parseDevalue(searchChunks[0].nodes[1].data);
      const items: MiruroAnimeItem[] = sObj.items || [];
      if (items.length > 0) {
        // 1. Try finding matching external ID (AniList or MAL)
        let match = items.find((i) => {
          const ext = i.external_ids || i.externalIds;
          if (!ext) return false;
          if (targetAnilistId && matchesId(ext.anilist, targetAnilistId)) return true;
          if (targetMalId && matchesId(ext.mal, targetMalId)) return true;
          return false;
        });

        // 2. If no external ID match, match by title and format
        if (!match) {
          const normQuery = searchTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
          const isMovieQuery = /movie|film|gekijouban/i.test(searchTitle);

          match = items.find((i) => {
            const eTitle = (i.title?.english || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const rTitle = (i.title?.romaji || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return eTitle === normQuery || rTitle === normQuery;
          });

          if (!match && !isMovieQuery) {
            match = items.find((i) => i.format === 'TV' || i.format === 'ONA');
          }

          if (!match) match = items[0];
        }

        const title = match.title?.english || match.title?.romaji || match.title?.native || searchTitle;
        let slug = match.id;
        try {
          const infoChunks = await this.fetchSvelteData(`/info/${match.id}/_/__data.json`);
          if (infoChunks.length > 0 && infoChunks[0].nodes?.[1]?.data) {
            const infoObj = this.parseDevalue(infoChunks[0].nodes[1].data);
            slug = infoObj.currentSlug || slug;
          }
        } catch {
          // fallback to id
        }

        const resolved = { miruroId: match.id, slug, title };
        this.idResolutionCache.set(trimmed, resolved);
        this.idResolutionCache.set(cleanTrimmed, resolved);
        this.idResolutionCache.set(match.id, resolved);
        return resolved;
      }
    }

    throw new Error(`Anime not found on Miruro for identifier: ${idOrQuery}`);
  }

  // ----------------------------------------------------
  // Converters
  // ----------------------------------------------------
  public miruroToAnimeCard(item: any): AnimeCard {
    if (!item || typeof item !== 'object') {
      return {
        id: '',
        name: 'Unknown Title',
        jname: null,
        poster: null,
        type: 'TV',
        episodes: { sub: null, dub: null, eps: null }
      };
    }

    const media = item.anime || item.media || item;
    const title = media.title || {};
    const name = title.english || title.romaji || title.native || media.name || 'Unknown Title';
    const jname = title.romaji || title.native || media.jname || null;
    const rawSub = media.episode_counts?.sub ?? media.episode_count ?? null;
    const rawDub = media.episode_counts?.dub ?? null;
    const totalEps = media.episode_count ?? (rawSub || null);

    return {
      id: media.id || '',
      name,
      jname,
      poster: media.cover_url || media.coverUrl || media.background_url || media.poster || null,
      type: media.format || 'TV',
      duration: (media.episode_duration_minutes || media.durationMinutes) ? `${media.episode_duration_minutes || media.durationMinutes}m` : null,
      episodes: {
        sub: rawSub,
        dub: rawDub,
        eps: totalEps
      }
    };
  }


  public miruroToSpotlight(item: MiruroAnimeItem, rank: number): SpotlightAnime {
    const card = this.miruroToAnimeCard(item);
    const seasonStr = (item.season_year || item.seasonYear)
      ? `${item.season || ''} ${item.season_year || item.seasonYear}`.trim()
      : null;

    return {
      ...card,
      rank,
      description: item.description || null,
      duration: card.duration || null,
      aired: seasonStr,
      quality: 'HD'
    };
  }

  public miruroToTrending(item: MiruroAnimeItem, rank: number): TrendingAnime {
    const card = this.miruroToAnimeCard(item);
    return {
      id: card.id,
      name: card.name,
      jname: card.jname,
      poster: card.poster,
      rank
    };
  }

  // ----------------------------------------------------
  // 1. Home Highlights Feed
  // ----------------------------------------------------
  public async getHome(): Promise<MiruroHomeData> {
    const cacheKey = 'miruro_home';
    const cached = this.getCached<MiruroHomeData>(cacheKey);
    if (cached) return cached;

    const chunks = await this.fetchSvelteData('/__data.json');
    if (!chunks.length) {
      throw new Error('Failed to retrieve Miruro home data');
    }

    let heroes: MiruroAnimeItem[] = [];
    let airingList: MiruroAnimeItem[] = [];
    let upcomingList: MiruroAnimeItem[] = [];
    let dubList: MiruroAnimeItem[] = [];

    // Node 1 data contains hero
    if (chunks[0].nodes?.[1]?.data) {
      const rootObj = this.parseDevalue(chunks[0].nodes[1].data);
      heroes = rootObj.hero || [];
    }

    // Line chunks (id 1, id 2) contain rails and side lists
    for (const chunk of chunks) {
      if (chunk.type === 'chunk' && chunk.data) {
        const chunkObj = this.parseDevalue(chunk.data);
        if (chunkObj.airing) airingList = chunkObj.airing;
        if (chunkObj.upcoming) upcomingList = chunkObj.upcoming;
        if (chunkObj.dub) dubList = chunkObj.dub;
      }
    }

    const spotlights = heroes.map((h, i) => this.miruroToSpotlight(h, i + 1));
    const trendingAnimes = heroes.map((h, i) => this.miruroToTrending(h, i + 1));
    const latestEpisodeAnimes = airingList.map(a => this.miruroToAnimeCard(a));
    const topUpcomingAnimes = upcomingList.map(u => this.miruroToAnimeCard(u));
    const topAiringAnimes = airingList.map(a => this.miruroToAnimeCard(a));
    const mostPopularAnimes = dubList.length > 0 ? dubList.map(d => this.miruroToAnimeCard(d)) : latestEpisodeAnimes;

    const genres = [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
      'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
      'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
    ];

    const result: MiruroHomeData = {
      spotlights,
      trendingAnimes,
      latestEpisodeAnimes,
      topUpcomingAnimes,
      topAiringAnimes,
      mostPopularAnimes,
      genres
    };

    this.setCached(cacheKey, result);
    return result;
  }

  // ----------------------------------------------------
  // 2. Trending Anime
  // ----------------------------------------------------
  public async getTrending(page = 1): Promise<{ animes: AnimeCard[]; totalPages: number; currentPage: number; hasNextPage: boolean }> {
    const cacheKey = `miruro_trending_${page}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    const chunks = await this.fetchSvelteData('/trending/__data.json');
    let items: MiruroAnimeItem[] = [];

    if (chunks.length > 0 && chunks[0].nodes?.[1]?.data) {
      const obj = this.parseDevalue(chunks[0].nodes[1].data);
      items = obj.items || [];
    }

    const animes = items.map(i => this.miruroToAnimeCard(i));
    const result = {
      animes,
      totalPages: Math.max(1, Math.ceil(animes.length / 24)),
      currentPage: page,
      hasNextPage: false
    };

    this.setCached(cacheKey, result);
    return result;
  }

  // ----------------------------------------------------
  // 3. Most Popular / Popular
  // ----------------------------------------------------
  public async getPopular(page = 1): Promise<{ animes: AnimeCard[]; totalPages: number; currentPage: number; hasNextPage: boolean }> {
    const cacheKey = `miruro_popular_${page}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    // Search finished top anime or home dub list
    const searchRes = await this.searchAnime('', page, { sort: 'title' });
    this.setCached(cacheKey, searchRes);
    return searchRes;
  }

  // ----------------------------------------------------
  // 4. Top Rated
  // ----------------------------------------------------
  public async getTopRated(page = 1): Promise<{ animes: AnimeCard[]; totalPages: number; currentPage: number; hasNextPage: boolean }> {
    const cacheKey = `miruro_top_rated_${page}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    const searchRes = await this.searchAnime('', page, { minScore: 80 });
    this.setCached(cacheKey, searchRes);
    return searchRes;
  }

  // ----------------------------------------------------
  // 5. Top Airing
  // ----------------------------------------------------
  public async getTopAiring(page = 1): Promise<{ animes: AnimeCard[]; totalPages: number; currentPage: number; hasNextPage: boolean }> {
    const cacheKey = `miruro_top_airing_${page}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    const searchRes = await this.searchAnime('', page, { status: 'RELEASING' });
    this.setCached(cacheKey, searchRes);
    return searchRes;
  }

  // ----------------------------------------------------
  // 6. Category / Format Shortcuts
  // ----------------------------------------------------
  public async getByCategory(category: string, page = 1): Promise<{ animes: AnimeCard[]; totalPages: number; currentPage: number; hasNextPage: boolean }> {
    const clean = category.toLowerCase().trim();
    switch (clean) {
      case 'movie':
      case 'movies':
        return this.searchAnime('', page, { format: 'MOVIE' });
      case 'tv':
      case 'tv-series':
        return this.searchAnime('', page, { format: 'TV' });
      case 'ova':
      case 'ovas':
        return this.searchAnime('', page, { format: 'OVA' });
      case 'ona':
      case 'onas':
        return this.searchAnime('', page, { format: 'ONA' });
      case 'special':
      case 'specials':
        return this.searchAnime('', page, { format: 'SPECIAL' });
      case 'subbed-anime':
      case 'subbed':
        return this.searchAnime('', page, { tracks: 'sub' });
      case 'dubbed-anime':
      case 'dubbed':
        return this.searchAnime('', page, { tracks: 'dub' });
      case 'most-popular':
      case 'popular':
        return this.getPopular(page);
      case 'top-airing':
        return this.getTopAiring(page);
      case 'top-rated':
      case 'most-favorite':
        return this.getTopRated(page);
      case 'latest-completed':
        return this.searchAnime('', page, { status: 'FINISHED' });
      default:
        return this.searchAnime('', page);
    }
  }

  // ----------------------------------------------------
  // 7. Genres
  // ----------------------------------------------------
  public getGenres(): string[] {
    return [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
      'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
      'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
    ];
  }

  public async getByGenre(genre: string, page = 1): Promise<{ animes: AnimeCard[]; genreName: string; totalPages: number; currentPage: number; hasNextPage: boolean }> {
    const searchRes = await this.searchAnime('', page, { genres: genre });
    return {
      genreName: genre,
      animes: searchRes.animes,
      totalPages: searchRes.totalPages,
      currentPage: searchRes.currentPage,
      hasNextPage: searchRes.hasNextPage
    };
  }

  // ----------------------------------------------------
  // 8. A-Z Directory
  // ----------------------------------------------------
  public async getAZList(letter: string, page = 1): Promise<{ animes: AnimeCard[]; totalPages: number; currentPage: number; hasNextPage: boolean }> {
    const clean = letter.toLowerCase().trim();
    const query = clean === 'other' || clean === '0-9' ? '' : clean;
    return this.searchAnime(query, page, { sort: 'title' });
  }

  // ----------------------------------------------------
  // 9. Search Suggestions
  // ----------------------------------------------------
  public async getSuggestions(keyword: string): Promise<Array<{ id: string; name: string; jname: string | null; poster: string | null; moreInfo: string[] }>> {
    const searchRes = await this.searchAnime(keyword, 1);
    return searchRes.animes.slice(0, 8).map(a => ({
      id: a.id,
      name: a.name,
      jname: a.jname,
      poster: a.poster,
      moreInfo: [
        a.type || 'TV',
        a.duration || '24m',
        `Sub: ${a.episodes.sub ?? '?'}`
      ]
    }));
  }

  // ----------------------------------------------------
  // 10. Search & Filter
  // ----------------------------------------------------
  public async searchAnime(keyword = '', page = 1, filters: MiruroSearchFilters = {}): Promise<{ animes: AnimeCard[]; totalPages: number; currentPage: number; hasNextPage: boolean }> {
    const queryParams = new URLSearchParams();

    if (keyword || filters.q) {
      queryParams.set('q', keyword || filters.q || '');
    }
    if (filters.format) queryParams.set('format', filters.format);
    if (filters.status) queryParams.set('status', filters.status);
    if (filters.genres) queryParams.set('genres', filters.genres);
    if (filters.season) queryParams.set('season', filters.season);
    if (filters.country) queryParams.set('country', filters.country);
    if (filters.tracks) queryParams.set('tracks', filters.tracks);
    if (filters.sort) queryParams.set('sort', filters.sort);
    if (filters.cursor) queryParams.set('cursor', filters.cursor);
    if (filters.yearFrom) queryParams.set('yearFrom', String(filters.yearFrom));
    if (filters.yearTo) queryParams.set('yearTo', String(filters.yearTo));
    if (filters.minScore) queryParams.set('minScore', String(filters.minScore));
    if (filters.maxScore) queryParams.set('maxScore', String(filters.maxScore));

    const cacheKey = `miruro_search_${queryParams.toString()}_page_${page}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    const chunks = await this.fetchSvelteData(`/search/__data.json?${queryParams.toString()}`);
    let items: MiruroAnimeItem[] = [];
    let hasMore = false;

    if (chunks.length > 0 && chunks[0].nodes?.[1]?.data) {
      const sObj = this.parseDevalue(chunks[0].nodes[1].data);
      items = sObj.items || [];
      hasMore = Boolean(sObj.hasMore || sObj.nextCursor);
    }

    const animes = items.map(i => this.miruroToAnimeCard(i));
    const result = {
      animes,
      totalPages: hasMore ? page + 1 : page,
      currentPage: page,
      hasNextPage: hasMore
    };

    this.setCached(cacheKey, result);
    return result;
  }

  public getFilterOptions(): Record<string, string[]> {
    return {
      formats: ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL'],
      statuses: ['FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED'],
      genres: this.getGenres(),
      seasons: ['WINTER', 'SPRING', 'SUMMER', 'FALL'],
      tracks: ['sub', 'dub', 'ssub', 'raw']
    };
  }

  // ----------------------------------------------------
  // 11. Schedule
  // ----------------------------------------------------
  public async getSchedule(date?: string): Promise<{ scheduledAnimes: Array<{ id: string; time: string; name: string; jname: string | null; episodeNumber: number }>; date: string }> {
    const cacheKey = `miruro_schedule_${date || 'current'}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    const chunks = await this.fetchSvelteData('/schedule/__data.json');
    let entries: MiruroScheduleEntry[] = [];

    if (chunks.length > 0 && chunks[0].nodes?.[1]?.data) {
      const sObj = this.parseDevalue(chunks[0].nodes[1].data);
      entries = sObj.entries || [];
    }

    // Filter by date if provided (YYYY-MM-DD)
    const targetDate = date || new Date().toISOString().split('T')[0];
    const filtered = entries.filter(e => {
      if (!e.airingAt) return true;
      const d = new Date(e.airingAt * 1000).toISOString().split('T')[0];
      return d === targetDate;
    });

    const scheduledAnimes = (filtered.length > 0 ? filtered : entries.slice(0, 20)).map(e => {
      const d = new Date(e.airingAt * 1000);
      const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return {
        id: e.media?.id || e.id,
        time,
        name: e.media?.title?.english || e.media?.title?.romaji || 'Unknown Title',
        jname: e.media?.title?.romaji || e.media?.title?.native || null,
        episodeNumber: e.episode
      };
    });

    const result = {
      scheduledAnimes,
      date: targetDate
    };

    this.setCached(cacheKey, result);
    return result;
  }

  // ----------------------------------------------------
  // 12. Random Anime
  // ----------------------------------------------------
  public async getRandomAnime(): Promise<{ id: string; name: string }> {
    const home = await this.getHome();
    const pool = [...home.spotlights, ...home.latestEpisodeAnimes, ...home.topAiringAnimes];
    if (pool.length === 0) {
      return { id: 'ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz', name: 'ONE PIECE' };
    }
    const rand = pool[Math.floor(Math.random() * pool.length)];
    return { id: rand.id, name: rand.name };
  }

  // ----------------------------------------------------
  // 13. Anime Details
  // ----------------------------------------------------
  public async getAnimeDetails(idOrSlug: string): Promise<AnimeDetailsData> {
    const { miruroId, slug } = await this.resolveToMiruroId(idOrSlug);
    const cacheKey = `miruro_details_${miruroId}`;
    const cached = this.getCached<AnimeDetailsData>(cacheKey);
    if (cached) return cached;

    const chunks = await this.fetchSvelteData(`/info/${miruroId}/${slug}/__data.json`);
    if (!chunks.length || !chunks[0].nodes?.[1]?.data) {
      throw new Error(`Failed to retrieve Miruro details for ${idOrSlug}`);
    }

    const infoObj = this.parseDevalue(chunks[0].nodes[1].data);
    const detail: MiruroAnimeDetail = infoObj.detail || {};

    const rawSub = detail.episode_counts?.sub ?? detail.episode_count ?? null;
    const rawDub = detail.episode_counts?.dub ?? null;
    const totalEps = detail.episode_count ?? (rawSub || null);

    const genres = detail.genres || [];
    const studios = (detail.studios || []).join(', ') || null;
    const producers = detail.studios || [];

    const synonyms = detail.alternate_titles
      ? detail.alternate_titles.map(t => t.value).filter(Boolean).slice(0, 5).join('; ')
      : null;

    const aired = (detail.started_on || detail.season_year)
      ? `${detail.season || ''} ${detail.season_year || ''} (${detail.started_on || '?'} to ${detail.ended_on || '?'})`.trim()
      : null;

    // Extract deferred chunks (relations, recommendations)
    let recList: any[] = [];
    let relList: any[] = [];
    for (const chunk of chunks) {
      if (chunk.type === 'chunk' && chunk.data) {
        if (chunk.id === 3) {
          const obj = this.parseDevalue(chunk.data);
          if (Array.isArray(obj)) recList = obj;
        } else if (chunk.id === 2) {
          const obj = this.parseDevalue(chunk.data);
          if (Array.isArray(obj)) relList = obj;
        }
      }
    }

    const recommendedAnimes = recList
      .map(r => this.miruroToAnimeCard(r.anime || r))
      .filter(c => Boolean(c.id));

    const relatedAnimes = relList
      .map(r => this.miruroToAnimeCard(r.anime || r.media || r))
      .filter(c => Boolean(c.id));

    const result: AnimeDetailsData = {
      id: detail.id || miruroId,
      animeId: detail.id || miruroId,
      name: detail.title?.english || detail.title?.romaji || detail.title?.native || 'Unknown Title',
      jname: detail.title?.romaji || detail.title?.native || null,
      poster: detail.cover_url || detail.coverUrl || detail.background_url || null,
      description: detail.description || null,
      stats: {
        rating: detail.mal_score ? String(detail.mal_score) : null,
        quality: 'HD',
        episodes: {
          sub: rawSub,
          dub: rawDub,
          eps: totalEps
        },
        type: detail.format || 'TV',
        duration: detail.episode_duration_minutes ? `${detail.episode_duration_minutes}m` : null
      },
      moreInfo: {
        japanese: detail.title?.native || null,
        synonyms,
        aired,
        premiered: detail.season && detail.season_year ? `${detail.season} ${detail.season_year}` : null,
        duration: detail.episode_duration_minutes ? `${detail.episode_duration_minutes}m` : null,
        status: detail.status || null,
        malScore: detail.mal_score ? String(detail.mal_score) : null,
        genres,
        studios: detail.studios || [],
        producers
      },
      recommendedAnimes,
      relatedAnimes,
      mostPopularAnimes: []
    };


    this.setCached(cacheKey, result);
    return result;
  }

  // ----------------------------------------------------
  // 14. Episodes
  // ----------------------------------------------------
  public async getEpisodes(idOrSlug: any): Promise<EpisodesData> {
    let raw = idOrSlug;
    if (typeof raw === 'object' && raw !== null) {
      raw = raw.miruroId || raw.id || raw.animeId || '';
    }
    const cleanStr = String(raw || '').trim().split('?ep=')[0];
    const { miruroId, slug } = await this.resolveToMiruroId(cleanStr);
    const cacheKey = `miruro_episodes_${miruroId}`;
    const cached = this.getCached<EpisodesData>(cacheKey);
    if (cached) return cached;

    const chunks = await this.fetchSvelteData(`/watch/${miruroId}/${slug}/__data.json?ep=1`);
    let epList: MiruroEpisode[] = [];

    for (const chunk of chunks) {
      if (chunk.type === 'chunk' && chunk.id === 2 && chunk.data) {
        const epObj = this.parseDevalue(chunk.data);
        if (epObj.episodes) epList = epObj.episodes;
      }
    }

    const episodes: AnimeEpisode[] = epList.map(e => ({
      title: e.title || `Episode ${e.number}`,
      name: e.title || `Episode ${e.number}`,
      episodeId: `${miruroId}?ep=${e.number}`,
      number: e.number,
      isFiller: Boolean(e.filler),
      url: `${this.baseUrl}/watch/${miruroId}/${slug}?ep=${e.number}`
    }));

    const result: EpisodesData = {
      animeId: miruroId,
      totalEpisodes: episodes.length,
      episodes
    };

    this.setCached(cacheKey, result);
    return result;
  }


  // ----------------------------------------------------
  // 15. Episode Servers
  // ----------------------------------------------------
  public async getServers(idOrEpisodeId: any, episodeNumber?: number): Promise<MiruroEpisodeServersResponse> {
    let raw = idOrEpisodeId;
    if (typeof raw === 'object' && raw !== null) {
      raw = raw.miruroId || raw.id || raw.animeId || '';
    }
    const cleanStr = String(raw || '').trim();
    let idPart = cleanStr;
    let epNum = episodeNumber || 1;

    if (cleanStr.includes('?ep=')) {
      const parts = cleanStr.split('?ep=');
      idPart = parts[0];
      epNum = parseInt(parts[1], 10) || episodeNumber || 1;
    }

    const resolved = await this.resolveToMiruroId(idPart);
    const miruroId = resolved.miruroId;
    const slug = resolved.slug;
    const cacheKey = `miruro_servers_${miruroId}_ep_${epNum}`;
    const cached = this.getCached<MiruroEpisodeServersResponse>(cacheKey, WATCH_CACHE_TTL_MS);
    if (cached) return cached;

    const chunks = await this.fetchSvelteData(`/watch/${miruroId}/${slug}/__data.json?ep=${epNum}`);
    let trackList: any[] = [];

    for (const chunk of chunks) {
      if (chunk.type === 'chunk' && chunk.id === 3 && chunk.data) {
        const watchObj = this.parseDevalue(chunk.data);
        if (watchObj.tracks) trackList = watchObj.tracks;
      }
    }

    const subServers: MiruroServerInfo[] = [];
    const dubServers: MiruroServerInfo[] = [];
    const rawServers: MiruroServerInfo[] = [];

    for (const track of trackList) {
      const trackType = String(track.track || '').toLowerCase();
      const providers = track.providers || [];

      for (const p of providers) {
        const providerName = String(p.provider || '');
        const srvItems = p.servers || [];

        for (const s of srvItems) {
          const serverName = String(s.server || providerName);
          const embedUrl = s.embed?.url || (s.streams?.find((st: any) => st.embed?.url)?.embed?.url) || null;
          const hasEmbed = Boolean(embedUrl || providerName === 'bun' || providerName === 'kiwi');

          const info: MiruroServerInfo = {
            serverId: `${providerName}-${serverName}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
            serverName,
            provider: providerName,
            category: (trackType === 'dub' ? 'dub' : trackType === 'raw' ? 'raw' : 'sub'),
            hasEmbed,
            embedUrl
          };

          if (trackType === 'dub') {
            dubServers.push(info);
          } else if (trackType === 'raw') {
            rawServers.push(info);
          } else {
            subServers.push(info);
          }
        }
      }
    }

    const result: MiruroEpisodeServersResponse = {
      animeId: miruroId,
      episodeId: `${miruroId}?ep=${epNum}`,
      episodeNumber: epNum,
      sub: subServers,
      dub: dubServers,
      raw: rawServers
    };

    this.setCached(cacheKey, result);
    return result;
  }

  // ----------------------------------------------------
  // 16. Unified Episode Stream & Embed Servers Extractor
  // ----------------------------------------------------
  public async getUnifiedStreamServers(
    idOrEpisodeId: any,
    episodeNumber = 1,
    serverName?: string,
    category: 'sub' | 'dub' | 'raw' | 'ssub' = 'sub'
  ): Promise<UnifiedServerStreamItem[]> {
    let raw = idOrEpisodeId;
    if (typeof raw === 'object' && raw !== null) {
      raw = raw.miruroId || raw.id || raw.animeId || '';
    }
    const cleanStr = String(raw || '').trim();
    let idPart = cleanStr;
    let epNum = episodeNumber;

    if (cleanStr.includes('?ep=')) {
      const parts = cleanStr.split('?ep=');
      idPart = parts[0];
      epNum = parseInt(parts[1], 10) || episodeNumber || 1;
    }

    const resolved = await this.resolveToMiruroId(idPart);
    const miruroId = resolved.miruroId;
    const slug = resolved.slug;
    const catClean = (
      category.toLowerCase() === 'dub' ? 'dub' : category.toLowerCase() === 'raw' ? 'raw' : 'sub'
    ) as 'sub' | 'dub' | 'raw';
    const serverClean = (serverName || 'all').toLowerCase().trim();

    const cacheKey = `miruro_unified_stream_${miruroId}_ep_${epNum}_${serverClean}_${catClean}`;
    const cached = this.getCached<UnifiedServerStreamItem[]>(cacheKey, WATCH_CACHE_TTL_MS);
    if (cached) return cached;

    const chunks = await this.fetchSvelteData(`/watch/${miruroId}/${slug}/__data.json?ep=${epNum}`);
    let trackList: any[] = [];
    let currentEpisode: any = null;
    let aniskipList: any[] = [];

    for (const chunk of chunks) {
      if (chunk.data) {
        const watchObj = this.parseDevalue(chunk.data);
        if (watchObj.tracks) trackList = watchObj.tracks;
        if (watchObj.currentEpisode) currentEpisode = watchObj.currentEpisode;
        if (watchObj.aniskip) aniskipList = watchObj.aniskip;
      }
    }

    // Prioritize ssub over sub for category 'sub' because Miruro hosts modern streams and VTT thumbnails on ssub
    const matchingTracks: any[] = [];
    if (catClean === 'sub') {
      const ssub = trackList.find((t: any) => String(t.track || '').toLowerCase() === 'ssub');
      if (ssub) matchingTracks.push(ssub);
      const sub = trackList.find((t: any) => String(t.track || '').toLowerCase() === 'sub');
      if (sub) matchingTracks.push(sub);
    } else {
      const matched = trackList.find((t: any) => String(t.track || '').toLowerCase() === catClean);
      if (matched) matchingTracks.push(matched);
    }

    if (matchingTracks.length === 0 && trackList.length > 0) {
      matchingTracks.push(trackList[0]);
    }

    // Skip times for this episode
    let intro: { start: number; end: number } | null = null;
    let outro: { start: number; end: number } | null = null;
    const epSkips = aniskipList.filter((a: any) => a.episode === epNum);
    const op = epSkips.find((a: any) => a.type === 'op' || a.type === 'mixed-op');
    const ed = epSkips.find((a: any) => a.type === 'ed');
    if (op && typeof op.start === 'number' && typeof op.end === 'number') {
      intro = { start: op.start, end: op.end };
    }
    if (ed && typeof ed.start === 'number' && typeof ed.end === 'number') {
      outro = { start: ed.start, end: ed.end };
    }

    const videoPreviewImage = currentEpisode?.image || null;

    const serverResults: UnifiedServerStreamItem[] = [];
    const seenServerKeys = new Set<string>();

    // Pre-scan for any valid WebVTT thumbnail across all providers in matchingTracks
    let defaultVttThumb: string | null = null;
    for (const track of matchingTracks) {
      for (const p of track.providers || []) {
        const vttCandidate = p.thumbnails?.vtt || (typeof p.thumbnails === 'string' ? p.thumbnails : null);
        if (typeof vttCandidate === 'string' && vttCandidate.includes('.vtt')) {
          defaultVttThumb = vttCandidate;
          break;
        }
      }
      if (defaultVttThumb) break;
    }

    for (const track of matchingTracks) {
      for (const p of track.providers || []) {
        let pThumb =
          p.thumbnails?.vtt ||
          p.thumbnails?.sprite ||
          (typeof p.thumbnails === 'string' ? p.thumbnails : null) ||
          null;

        // If provider thumbnail is missing or not a .vtt (e.g. points to static .jpeg), fallback to valid episode VTT
        if (!pThumb || !pThumb.includes('.vtt')) {
          pThumb = defaultVttThumb;
        }

        const subs = (p.subtitles || []).map((s: any) => ({
          url: s.file || s.url || '',
          label: s.label || s.language || 'English',
          lang: s.language || s.label || 'English',
          default: Boolean(s.default),
        }));

        for (const s of p.servers || []) {
          const sName = String(s.server || p.provider);
          const pName = String(p.provider || '');
          const serverKey = `${sName}-${pName}`.toLowerCase();
          if (seenServerKeys.has(serverKey)) continue;

          const streamUrl: string | null =
            s.streams?.[0]?.url ||
            s.streams?.find((st: any) => st.url)?.url ||
            null;

          let embedUrl: string | null =
            s.embed?.url ||
            s.streams?.find((st: any) => st.embed?.url)?.embed?.url ||
            null;

          if (!streamUrl && !embedUrl) {
            // Provide fallback embed URL if no direct stream or 3rd-party embed
            embedUrl = `${this.baseUrl}/watch/${miruroId}/${slug}?ep=${epNum}&provider=${pName}`;
          }

          // Headers
          const serverHeaders: Record<string, string> = {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            ...(s.headers || p.headers || { Referer: 'https://miruro.to/' }),
          };

          if (
            streamUrl &&
            /megaplay|shiora|nexabloom|ivorysummit|embermeadow|animanga/i.test(streamUrl)
          ) {
            serverHeaders['Referer'] = 'https://megaplay.buzz/';
            serverHeaders['Origin'] = 'https://megaplay.buzz';
          } else if (
            (streamUrl && /krussdomi/i.test(streamUrl)) ||
            pName === 'hop' ||
            sName.toLowerCase() === 'cat'
          ) {
            serverHeaders['Referer'] = 'https://krussdomi.com/';
            serverHeaders['Origin'] = 'https://krussdomi.com';
          } else if (
            (streamUrl && /savedly/i.test(streamUrl)) ||
            sName.toLowerCase() === 'datsav'
          ) {
            serverHeaders['Referer'] = 'https://miruro.to/';
            serverHeaders['Origin'] = 'https://miruro.to';
          } else if (
            (streamUrl &&
              /ultracloud|keeply|velvetvault|leafshade|leafshore|\.top\/m\/|\/m\//i.test(streamUrl)) ||
            pName === 'sun' ||
            sName.toLowerCase().includes('icarus') ||
            sName.toLowerCase().includes('vault') ||
            sName.toLowerCase().includes('cloudflare')
          ) {
            serverHeaders['Referer'] = 'https://ultracloud.cc/';
            serverHeaders['Origin'] = 'https://ultracloud.cc';
          } else if (
            (streamUrl && /echovideo|vidplay|dpopdrop/i.test(streamUrl)) ||
            sName.toLowerCase() === 'vidplay'
          ) {
            serverHeaders['Referer'] = 'https://play.echovideo.ru/';
            serverHeaders['Origin'] = 'https://play.echovideo.ru';
          }

          const proxyUrl = streamUrl ? buildProxyUrl(streamUrl, serverHeaders) : null;

          const item = buildUnifiedServerStreamItem({
            server: sName,
            provider: pName,
            category: catClean,
            streamUrl,
            embedUrl,
            proxyUrl,
            thumbnailVtt: pThumb,
            videoPreviewImage,
            subtitles: subs,
            intro,
            outro,
            headers: serverHeaders,
            downloads: p.downloads || [],
          });

          serverResults.push(item);
          seenServerKeys.add(serverKey);
        }
      }
    }

    let filtered = serverResults;
    if (serverName && serverClean !== 'all' && serverClean !== 'auto') {
      const match = serverResults.filter(
        (srv) =>
          srv.server.toLowerCase() === serverClean ||
          srv.provider.toLowerCase() === serverClean ||
          srv.server.toLowerCase().includes(serverClean) ||
          srv.provider.toLowerCase().includes(serverClean)
      );
      if (match.length > 0) {
        filtered = match;
      }
    }

    this.setCached(cacheKey, filtered);
    return filtered;
  }

  // ----------------------------------------------------
  // 17. Episode Sources / Embed URL Extractor (Legacy Compatible)
  // ----------------------------------------------------
  public async getEmbedSources(
    idOrEpisodeId: string,
    episodeNumber = 1,
    serverName?: string,
    category: 'sub' | 'dub' | 'raw' | 'ssub' = 'sub'
  ): Promise<MiruroEmbedResponse> {
    const servers = await this.getUnifiedStreamServers(idOrEpisodeId, episodeNumber, serverName, category);
    if (!servers.length) {
      throw new Error(`No streaming servers found for anime ${idOrEpisodeId} episode ${episodeNumber} in ${category}`);
    }
    const s = servers[0];
    return {
      animeId: idOrEpisodeId,
      episodeNumber,
      category,
      server: s.server,
      provider: s.provider,
      embedUrl: s.embedurl || s.streamurl || '',
      fallbackEmbedUrl: s.embedurl || undefined,
      headers: s.headers || null,
      subtitles: (s.subtitle || []).map((sub) => ({
        lang: sub.lang,
        label: sub.label,
        src: sub.url,
        default: sub.default,
      })),
      thumbnails: s.thumbnail ? { vtt: s.thumbnail, sprite: null } : null,
      downloads: s.downloads || [],
    };
  }

  // ----------------------------------------------------
  // 17. Reverse Sync (Miruro ID <-> AniList / MAL)
  // ----------------------------------------------------
  public async syncAnime(idOrSlug: string): Promise<{ miruroId: string; externalIds: any; title: any }> {
    const { miruroId, slug } = await this.resolveToMiruroId(idOrSlug);
    const chunks = await this.fetchSvelteData(`/info/${miruroId}/${slug}/__data.json`);
    if (!chunks.length || !chunks[0].nodes?.[1]?.data) {
      throw new Error(`Failed to retrieve Miruro metadata for ${idOrSlug}`);
    }

    const infoObj = this.parseDevalue(chunks[0].nodes[1].data);
    const detail = infoObj.detail || {};

    return {
      miruroId,
      externalIds: detail.external_ids || detail.externalIds || {},
      title: detail.title || {}
    };
  }

  // ----------------------------------------------------
  // 18. Episode Direct Streams with Proxy (Legacy Compatible)
  // ----------------------------------------------------
  public async getStream(
    idOrEpisodeId: string,
    episodeNumber = 1,
    serverName?: string,
    category: 'sub' | 'dub' | 'raw' = 'sub'
  ): Promise<MiruroStreamResponse> {
    const servers = await this.getUnifiedStreamServers(idOrEpisodeId, episodeNumber, serverName, category);
    if (!servers.length) {
      throw new Error(`No streaming servers found on Miruro for anime ${idOrEpisodeId} episode ${episodeNumber} in category "${category}"`);
    }
    const s = servers[0];
    const availableServers = servers.map((srv) => srv.server);
    const streamSources: MiruroStreamSource[] = servers
      .filter((srv) => Boolean(srv.streamurl))
      .map((srv) => ({
        url: srv.streamurl!,
        proxyUrl: srv.proxyUrl || '',
        isM3U8: Boolean(srv.streamurl?.includes('.m3u8')),
        quality: 'auto',
        format: srv.streamurl?.includes('.m3u8') ? 'hls' : 'mp4',
      }));

    return {
      animeId: idOrEpisodeId,
      episodeNumber,
      category,
      server: s.server,
      provider: s.provider,
      availableServers,
      sources: streamSources,
      m3u8: s.streamurl,
      proxyM3U8: s.proxyUrl,
      headers: s.headers || {},
      embedUrl: s.embedurl,
      subtitles: (s.subtitle || []).map((sub) => ({
        lang: sub.lang,
        label: sub.label,
        src: sub.url,
        proxyUrl: sub.url,
        default: sub.default,
      })),
      thumbnails: s.thumbnail ? { vtt: s.thumbnail, sprite: null } : null,
      intro: s.timestamp.intro,
      outro: s.timestamp.outro,
      downloads: s.downloads || [],
    };
  }
}

export const miruroService = new MiruroService();
