import type {
  JikanAnimeItem,
  JikanAnimeListResponse,
  JikanAnimeSingleResponse,
  JikanEpisodeItem,
  JikanEpisodesResponse,
  JikanGenreItem,
  JikanResourceItem,
  JikanTitle,
  MALHomeData,
} from '../types/mal.js';
import { aniListService } from './anilist.service.js';

const JIKAN_DEFAULT_BASE_URL = 'https://api.jikan.moe/v4';
const ANIZIP_ENDPOINT = 'https://api.ani.zip/mappings';
const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

export const MAL_GENRES: JikanGenreItem[] = [
  { mal_id: 1, name: 'Action', url: 'https://myanimelist.net/anime/genre/1/Action', count: 5200 },
  { mal_id: 2, name: 'Adventure', url: 'https://myanimelist.net/anime/genre/2/Adventure', count: 4100 },
  { mal_id: 4, name: 'Comedy', url: 'https://myanimelist.net/anime/genre/4/Comedy', count: 7600 },
  { mal_id: 8, name: 'Drama', url: 'https://myanimelist.net/anime/genre/8/Drama', count: 3100 },
  { mal_id: 10, name: 'Fantasy', url: 'https://myanimelist.net/anime/genre/10/Fantasy', count: 5800 },
  { mal_id: 14, name: 'Horror', url: 'https://myanimelist.net/anime/genre/14/Horror', count: 620 },
  { mal_id: 7, name: 'Mystery', url: 'https://myanimelist.net/anime/genre/7/Mystery', count: 980 },
  { mal_id: 22, name: 'Romance', url: 'https://myanimelist.net/anime/genre/22/Romance', count: 2500 },
  { mal_id: 24, name: 'Sci-Fi', url: 'https://myanimelist.net/anime/genre/24/Sci-Fi', count: 3400 },
  { mal_id: 36, name: 'Slice of Life', url: 'https://myanimelist.net/anime/genre/36/Slice_of_Life', count: 2400 },
  { mal_id: 30, name: 'Sports', url: 'https://myanimelist.net/anime/genre/30/Sports', count: 1100 },
  { mal_id: 37, name: 'Supernatural', url: 'https://myanimelist.net/anime/genre/37/Supernatural', count: 1950 },
  { mal_id: 41, name: 'Suspense', url: 'https://myanimelist.net/anime/genre/41/Suspense', count: 350 },
  { mal_id: 9, name: 'Ecchi', url: 'https://myanimelist.net/anime/genre/9/Ecchi', count: 900 },
  { mal_id: 62, name: 'Isekai', url: 'https://myanimelist.net/anime/genre/62/Isekai', count: 520 },
  { mal_id: 18, name: 'Mecha', url: 'https://myanimelist.net/anime/genre/18/Mecha', count: 1300 },
  { mal_id: 19, name: 'Music', url: 'https://myanimelist.net/anime/genre/19/Music', count: 4200 },
  { mal_id: 23, name: 'School', url: 'https://myanimelist.net/anime/genre/23/School', count: 2100 },
  { mal_id: 27, name: 'Shounen', url: 'https://myanimelist.net/anime/genre/27/Shounen', count: 2300 },
  { mal_id: 25, name: 'Shoujo', url: 'https://myanimelist.net/anime/genre/25/Shoujo', count: 750 },
  { mal_id: 42, name: 'Seinen', url: 'https://myanimelist.net/anime/genre/42/Seinen', count: 1100 },
  { mal_id: 43, name: 'Josei', url: 'https://myanimelist.net/anime/genre/43/Josei', count: 160 },
  { mal_id: 38, name: 'Military', url: 'https://myanimelist.net/anime/genre/38/Military', count: 720 },
  { mal_id: 11, name: 'Strategy Game', url: 'https://myanimelist.net/anime/genre/11/Strategy_Game', count: 340 },
  { mal_id: 31, name: 'Super Power', url: 'https://myanimelist.net/anime/genre/31/Super_Power', count: 850 },
  { mal_id: 32, name: 'Vampire', url: 'https://myanimelist.net/anime/genre/32/Vampire', count: 180 },
  { mal_id: 20, name: 'Parody', url: 'https://myanimelist.net/anime/genre/20/Parody', count: 780 },
  { mal_id: 40, name: 'Psychological', url: 'https://myanimelist.net/anime/genre/40/Psychological', count: 490 },
];

export interface MALSearchFilters {
  keyword?: string;
  q?: string;
  page?: number;
  limit?: number;
  type?: string;
  score?: number;
  min_score?: number;
  max_score?: number;
  status?: string;
  rating?: string;
  sfw?: boolean;
  genres?: string | number | number[];
  order_by?: string;
  sort?: 'desc' | 'asc' | string;
  letter?: string;
  producer?: string | number;
  season?: string;
  year?: number;
}

export class MALService {
  private baseUrl: string;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes cache

  private isJikanAvailable: boolean = true;
  private lastJikanCheck: number = 0;
  private consecutiveFailures: number = 0;
  private readonly CIRCUIT_BREAKER_TIMEOUT_MS = 1000 * 60; // 1 minute cooldown

  constructor() {
    this.baseUrl = (process.env.JIKAN_API_BASE_URL || JIKAN_DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  /**
   * Set custom Jikan API Base URL
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
    this.isJikanAvailable = true;
    this.consecutiveFailures = 0;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Fetch from Jikan API with quick timeout, circuit breaker, and automatic cache
   */
  private async fetchJikan<T>(endpoint: string, queryParams: Record<string, any> = {}, timeoutMs: number = 2000): Promise<T | null> {
    // If circuit breaker tripped, skip immediately to fallback without hanging
    if (!this.isJikanAvailable) {
      if (Date.now() - this.lastJikanCheck > this.CIRCUIT_BREAKER_TIMEOUT_MS) {
        // Cooldown passed, test again
        this.isJikanAvailable = true;
      } else {
        return null;
      }
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const queryEntries = Object.entries(queryParams).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    );
    const queryString = queryEntries.length > 0
      ? '?' + new URLSearchParams(queryEntries.map(([k, v]) => [k, String(v)])).toString()
      : '';
    const fullUrl = `${this.baseUrl}${cleanEndpoint}${queryString}`;

    const cacheKey = fullUrl;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AniSora/1.8.2',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.ok) {
        const json = (await res.json()) as T;
        this.consecutiveFailures = 0;
        this.isJikanAvailable = true;
        this.cache.set(cacheKey, { data: json, expiry: Date.now() + this.CACHE_TTL_MS });
        return json;
      } else {
        this.consecutiveFailures++;
      }
    } catch {
      this.consecutiveFailures++;
    }

    if (this.consecutiveFailures >= 2) {
      this.isJikanAvailable = false;
      this.lastJikanCheck = Date.now();
      console.warn(`[MALService] Jikan API unreachable at ${this.baseUrl}. Circuit breaker tripped; using high-speed MAL fallback engine.`);
    }

    return null;
  }

  /**
   * Map AniList media or AnimeCard into official Jikan v4 Anime item format
   */
  public mediaToJikanAnime(media: any): JikanAnimeItem {
    const malId = parseInt(String(media.idMal || media.id), 10) || 1;
    const poster = media.poster || '';
    const largeImg =
      media.coverImage?.extraLarge ||
      media.coverImage?.large ||
      media.coverImage?.medium ||
      poster ||
      'https://cdn.myanimelist.net/images/anime/default.jpg';
    const mediumImg =
      media.coverImage?.large ||
      media.coverImage?.medium ||
      media.coverImage?.extraLarge ||
      poster ||
      'https://cdn.myanimelist.net/images/anime/default.jpg';
    const smallImg =
      media.coverImage?.medium ||
      media.coverImage?.large ||
      poster ||
      'https://cdn.myanimelist.net/images/anime/default.jpg';

    const romaji = media.title?.romaji || media.title?.userPreferred || media.title?.english || media.name || 'Unknown Title';
    const english = media.title?.english || media.name || null;
    const native = media.title?.native || media.jname || null;

    const titles: JikanTitle[] = [{ type: 'Default', title: romaji }];
    if (english && english !== romaji) titles.push({ type: 'English', title: english });
    if (native) titles.push({ type: 'Japanese', title: native });

    const genres: JikanResourceItem[] = (media.genres || []).map((g: string) => {
      const found = MAL_GENRES.find((mg) => mg.name.toLowerCase() === g.toLowerCase());
      const gId = found ? found.mal_id : 0;
      return {
        mal_id: gId,
        type: 'anime',
        name: g,
        url: `https://myanimelist.net/anime/genre/${gId}/${encodeURIComponent(g)}`,
      };
    });

    const studios: JikanResourceItem[] = (media.studios?.nodes || []).map((s: any, idx: number) => ({
      mal_id: s.id || idx + 1,
      type: 'anime',
      name: s.name,
      url: `https://myanimelist.net/anime/producer/${s.id || idx + 1}`,
    }));

    const relations = (media.relations?.edges || []).map((edge: any) => ({
      relation: edge.relationType || 'Related',
      entry: [
        {
          mal_id: edge.node?.idMal || edge.node?.id || 0,
          type: 'anime',
          name: edge.node?.title?.romaji || edge.node?.title?.english || 'Unknown',
          url: `https://myanimelist.net/anime/${edge.node?.idMal || edge.node?.id || 0}`,
        },
      ],
    }));

    const isAiring = media.status === 'RELEASING' || media.status === 'Currently Airing';
    const statusStr =
      media.status === 'FINISHED'
        ? 'Finished Airing'
        : media.status === 'RELEASING' || media.status === 'Currently Airing'
        ? 'Currently Airing'
        : media.status === 'NOT_YET_RELEASED'
        ? 'Not yet aired'
        : media.status || 'Finished Airing';

    const score = media.averageScore
      ? Number((media.averageScore / 10).toFixed(2))
      : media.meanScore
      ? Number((media.meanScore / 10).toFixed(2))
      : (media.score ? Number(media.score) : 8.0);

    const episodes = media.episodes && typeof media.episodes === 'object'
      ? (media.episodes.sub || media.episodes.eps || null)
      : (typeof media.episodes === 'number' ? media.episodes : null);

    const duration = media.duration
      ? (typeof media.duration === 'number' ? `${media.duration} min per ep` : String(media.duration))
      : null;

    const synopsis = media.description
      ? media.description.replace(/<[^>]+>/g, '').trim()
      : `MyAnimeList entry for ${romaji}.`;

    return {
      mal_id: malId,
      url: `https://myanimelist.net/anime/${malId}`,
      images: {
        jpg: {
          image_url: mediumImg,
          small_image_url: smallImg,
          large_image_url: largeImg,
        },
        webp: {
          image_url: mediumImg,
          small_image_url: smallImg,
          large_image_url: largeImg,
        },
      },
      trailer: media.trailer?.id
        ? {
            youtube_id: media.trailer.id,
            url: `https://www.youtube.com/watch?v=${media.trailer.id}`,
            embed_url: `https://www.youtube.com/embed/${media.trailer.id}`,
          }
        : null,
      approved: true,
      titles,
      title: romaji,
      title_english: english,
      title_japanese: native,
      title_synonyms: media.synonyms || [],
      type: media.format || media.type || 'TV',
      source: 'Original',
      episodes,
      status: statusStr,
      airing: isAiring,
      aired: {
        from: media.seasonYear ? `${media.seasonYear}-01-01T00:00:00+00:00` : null,
        to: null,
        prop: {
          from: { day: null, month: null, year: media.seasonYear || null },
          to: { day: null, month: null, year: null },
        },
        string: media.seasonYear ? `${media.season || ''} ${media.seasonYear}`.trim() : null,
      },
      duration,
      rating: 'PG-13 - Teens 13 or older',
      score,
      scored_by: media.popularity ? Math.round(media.popularity * 1.5) : 85000,
      rank: media.rank || null,
      popularity: media.popularity || 500,
      members: media.popularity ? media.popularity * 2 : 150000,
      favorites: media.popularity ? Math.round(media.popularity * 0.08) : 5000,
      synopsis,
      background: null,
      season: media.season ? media.season.toLowerCase() : null,
      year: media.seasonYear || null,
      studios,
      genres,
      relations,
    };
  }

  /**
   * 1. Home Highlights Feed
   * GET /api/v1/mal/home
   */
  public async getHome(): Promise<MALHomeData> {
    // Attempt Jikan top calls
    const [airingRes, popularRes, topRatedRes, upcomingRes] = await Promise.all([
      this.fetchJikan<JikanAnimeListResponse>('/top/anime', { filter: 'airing', limit: 10 }),
      this.fetchJikan<JikanAnimeListResponse>('/top/anime', { filter: 'bypopularity', limit: 10 }),
      this.fetchJikan<JikanAnimeListResponse>('/top/anime', { limit: 10 }),
      this.fetchJikan<JikanAnimeListResponse>('/top/anime', { filter: 'upcoming', limit: 10 }),
    ]);

    if (airingRes?.data && popularRes?.data && topRatedRes?.data) {
      return {
        spotlight: airingRes.data.slice(0, 10),
        topAiring: airingRes.data,
        mostPopular: popularRes.data,
        topRated: topRatedRes.data,
        topUpcoming: upcomingRes?.data || [],
        genres: MAL_GENRES,
        schedule: airingRes.data.slice(0, 8),
      };
    }

    // High-speed fallback via AniList GraphQL
    const anilistHome = await aniListService.getHome();

    const toJikanList = (cards: any[]): JikanAnimeItem[] => {
      return (cards || []).map((card) => {
        const malId = parseInt(card.id, 10) || 1;
        return {
          mal_id: malId,
          url: `https://myanimelist.net/anime/${malId}`,
          images: {
            jpg: {
              image_url: card.poster || '',
              small_image_url: card.poster || '',
              large_image_url: card.poster || '',
            },
            webp: {
              image_url: card.poster || '',
              small_image_url: card.poster || '',
              large_image_url: card.poster || '',
            },
          },
          titles: [{ type: 'Default', title: card.name }],
          title: card.name,
          title_english: card.name,
          title_japanese: card.jname || null,
          title_synonyms: [],
          type: card.type || 'TV',
          episodes: card.episodes?.sub || card.episodes?.eps || null,
          status: 'Currently Airing',
          airing: true,
          aired: {
            from: null,
            to: null,
            prop: { from: { day: null, month: null, year: null }, to: { day: null, month: null, year: null } },
            string: null,
          },
          duration: card.duration || null,
          rating: 'PG-13',
          score: card.averageScore ? Number((card.averageScore / 10).toFixed(2)) : 8.5,
          scored_by: 120000,
          rank: card.rank || 1,
          popularity: 200000,
          members: 300000,
          favorites: 15000,
          synopsis: card.description || `Watch ${card.name} on MyAnimeList.`,
          season: 'fall',
          year: 2026,
          studios: [],
          genres: (card.genres || ['Action']).map((g: string) => ({
            mal_id: 1,
            type: 'anime',
            name: g,
            url: `https://myanimelist.net/anime/genre/1/${encodeURIComponent(g)}`,
          })),
        };
      });
    };

    return {
      spotlight: toJikanList(anilistHome.spotlightAnimes || []),
      topAiring: toJikanList(anilistHome.topAiringAnimes || []),
      mostPopular: toJikanList(anilistHome.mostPopularAnimes || []),
      topRated: toJikanList(anilistHome.top10Animes?.week || []),
      topUpcoming: toJikanList(anilistHome.topUpcomingAnimes || []),
      genres: MAL_GENRES,
      schedule: toJikanList(anilistHome.topAiringAnimes?.slice(0, 8) || []),
    };
  }

  /**
   * 2. Trending Anime (Top Airing)
   * GET /api/v1/mal/trending?page=1&limit=25
   */
  public async getTrending(page: number = 1, limit: number = 25): Promise<JikanAnimeListResponse> {
    const jikanRes = await this.fetchJikan<JikanAnimeListResponse>('/top/anime', {
      filter: 'airing',
      page,
      limit,
    });
    if (jikanRes?.data) return jikanRes;

    const anilistTrending = await aniListService.getTrending(page, limit);
    return {
      pagination: {
        last_visible_page: anilistTrending.totalPages,
        has_next_page: anilistTrending.hasNextPage,
        current_page: anilistTrending.currentPage,
        items: {
          count: anilistTrending.animes.length,
          total: anilistTrending.animes.length * anilistTrending.totalPages,
          per_page: limit,
        },
      },
      data: anilistTrending.animes.map((a: any) => this.mediaToJikanAnime(a)),
    };
  }

  /**
   * 3. Most Popular Anime
   * GET /api/v1/mal/popular?page=1&limit=25
   */
  public async getPopular(page: number = 1, limit: number = 25): Promise<JikanAnimeListResponse> {
    const jikanRes = await this.fetchJikan<JikanAnimeListResponse>('/top/anime', {
      filter: 'bypopularity',
      page,
      limit,
    });
    if (jikanRes?.data) return jikanRes;

    const anilistPopular = await aniListService.getPopular(page, limit);
    return {
      pagination: {
        last_visible_page: anilistPopular.totalPages,
        has_next_page: anilistPopular.hasNextPage,
        current_page: anilistPopular.currentPage,
        items: {
          count: anilistPopular.animes.length,
          total: anilistPopular.animes.length * anilistPopular.totalPages,
          per_page: limit,
        },
      },
      data: anilistPopular.animes.map((a: any) => this.mediaToJikanAnime(a)),
    };
  }

  /**
   * 4. Top Rated / Top Score Anime
   * GET /api/v1/mal/top-rated?page=1&limit=25
   */
  public async getTopRated(page: number = 1, limit: number = 25): Promise<JikanAnimeListResponse> {
    const jikanRes = await this.fetchJikan<JikanAnimeListResponse>('/top/anime', {
      page,
      limit,
    });
    if (jikanRes?.data) return jikanRes;

    const anilistTop = await aniListService.getTopRated(page, limit);
    return {
      pagination: {
        last_visible_page: anilistTop.totalPages,
        has_next_page: anilistTop.hasNextPage,
        current_page: anilistTop.currentPage,
        items: {
          count: anilistTop.animes.length,
          total: anilistTop.animes.length * anilistTop.totalPages,
          per_page: limit,
        },
      },
      data: anilistTop.animes.map((a: any) => this.mediaToJikanAnime(a)),
    };
  }

  /**
   * 5. Category / Format Listing
   * GET /api/v1/mal/category/:category?page=1&limit=25
   */
  public async getByCategory(category: string, page: number = 1, limit: number = 25): Promise<JikanAnimeListResponse> {
    const cat = category.toLowerCase().trim();

    // Map categories to Jikan params
    let jikanParams: Record<string, any> = { page, limit };
    if (cat === 'movie' || cat === 'movies') {
      jikanParams.type = 'movie';
    } else if (cat === 'tv' || cat === 'tv-series') {
      jikanParams.type = 'tv';
    } else if (cat === 'ova' || cat === 'ovas') {
      jikanParams.type = 'ova';
    } else if (cat === 'ona' || cat === 'onas') {
      jikanParams.type = 'ona';
    } else if (cat === 'special' || cat === 'specials') {
      jikanParams.type = 'special';
    } else if (cat === 'top-airing' || cat === 'airing') {
      jikanParams.filter = 'airing';
    } else if (cat === 'top-upcoming' || cat === 'upcoming') {
      jikanParams.filter = 'upcoming';
    } else if (cat === 'most-popular' || cat === 'popular') {
      jikanParams.filter = 'bypopularity';
    } else if (cat === 'most-favorite' || cat === 'favorite') {
      jikanParams.filter = 'favorite';
    }

    const jikanRes = await this.fetchJikan<JikanAnimeListResponse>('/top/anime', jikanParams);
    if (jikanRes?.data) return jikanRes;

    const anilistCat = await aniListService.getByCategory(category, page, limit);
    return {
      pagination: {
        last_visible_page: anilistCat.totalPages,
        has_next_page: anilistCat.hasNextPage,
        current_page: anilistCat.currentPage,
        items: {
          count: anilistCat.animes.length,
          total: anilistCat.animes.length * anilistCat.totalPages,
          per_page: limit,
        },
      },
      data: anilistCat.animes.map((a: any) => this.mediaToJikanAnime(a)),
    };
  }

  /**
   * 6. Genres List
   * GET /api/v1/mal/genres
   */
  public async getGenres(): Promise<{ data: JikanGenreItem[] }> {
    const jikanRes = await this.fetchJikan<{ data: JikanGenreItem[] }>('/genres/anime');
    if (jikanRes?.data && jikanRes.data.length > 0) {
      return jikanRes;
    }
    return { data: MAL_GENRES };
  }

  /**
   * 7. Anime by Genre
   * GET /api/v1/mal/genres/:genre?page=1&limit=25
   */
  public async getByGenre(genre: string | number, page: number = 1, limit: number = 25): Promise<JikanAnimeListResponse> {
    let genreId: number | null = null;
    let genreName: string = String(genre);

    if (typeof genre === 'number' || /^\d+$/.test(String(genre))) {
      genreId = parseInt(String(genre), 10);
      const matched = MAL_GENRES.find((g) => g.mal_id === genreId);
      if (matched) genreName = matched.name;
    } else {
      const clean = genreName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matched = MAL_GENRES.find(
        (g) => g.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
      );
      if (matched) {
        genreId = matched.mal_id;
        genreName = matched.name;
      }
    }

    if (genreId) {
      const jikanRes = await this.fetchJikan<JikanAnimeListResponse>('/anime', {
        genres: genreId,
        page,
        limit,
      });
      if (jikanRes?.data) return jikanRes;
    }

    const anilistGenre = await aniListService.getByGenre(genreName, page, limit);
    return {
      pagination: {
        last_visible_page: anilistGenre.totalPages,
        has_next_page: anilistGenre.hasNextPage,
        current_page: anilistGenre.currentPage,
        items: {
          count: anilistGenre.animes.length,
          total: anilistGenre.animes.length * anilistGenre.totalPages,
          per_page: limit,
        },
      },
      data: anilistGenre.animes.map((a: any) => this.mediaToJikanAnime(a)),
    };
  }

  /**
   * 8. A-Z Directory
   * GET /api/v1/mal/az-list/:letter?page=1&limit=25
   */
  public async getAZList(letter: string = 'all', page: number = 1, limit: number = 25): Promise<JikanAnimeListResponse> {
    const cleanLetter = letter.trim().toLowerCase();

    if (cleanLetter !== 'all' && /^[a-z0-9]$/.test(cleanLetter)) {
      const jikanRes = await this.fetchJikan<JikanAnimeListResponse>('/anime', {
        letter: cleanLetter,
        order_by: 'popularity',
        sort: 'desc',
        page,
        limit,
      });
      if (jikanRes?.data) return jikanRes;
    }

    const anilistAZ = await aniListService.getAZList(cleanLetter, page, limit);
    return {
      pagination: {
        last_visible_page: anilistAZ.totalPages,
        has_next_page: anilistAZ.hasNextPage,
        current_page: anilistAZ.currentPage,
        items: {
          count: anilistAZ.animes.length,
          total: anilistAZ.animes.length * anilistAZ.totalPages,
          per_page: limit,
        },
      },
      data: anilistAZ.animes.map((a: any) => this.mediaToJikanAnime(a)),
    };
  }

  /**
   * 9. Search Suggestions
   * GET /api/v1/mal/search/suggestions?keyword=naruto
   */
  public async getSuggestions(keyword: string): Promise<{ suggestions: Array<{ id: number; title: string; image: string; type: string; score: number | null }> }> {
    const jikanRes = await this.fetchJikan<JikanAnimeListResponse>('/anime', {
      q: keyword,
      limit: 8,
    });

    if (jikanRes?.data) {
      return {
        suggestions: jikanRes.data.map((item) => ({
          id: item.mal_id,
          title: item.title,
          image: item.images?.jpg?.image_url || '',
          type: item.type || 'TV',
          score: item.score,
        })),
      };
    }

    const anilistSug = await aniListService.getSuggestions(keyword);
    return {
      suggestions: anilistSug.suggestions.map((s: any) => ({
        id: parseInt(s.id, 10) || 1,
        title: s.name,
        image: s.poster || '',
        type: 'Anime',
        score: null,
      })),
    };
  }

  /**
   * 10. Catalog Search & Filter
   * GET /api/v1/mal/search?keyword=naruto&page=1&limit=25
   */
  public async searchAnime(filters: MALSearchFilters): Promise<JikanAnimeListResponse> {
    const page = filters.page || 1;
    const limit = Math.min(25, filters.limit || 25);
    const query = filters.keyword || filters.q;

    const jikanParams: Record<string, any> = {
      q: query,
      page,
      limit,
      type: filters.type,
      score: filters.score,
      min_score: filters.min_score,
      max_score: filters.max_score,
      status: filters.status,
      rating: filters.rating,
      sfw: filters.sfw,
      genres: Array.isArray(filters.genres) ? filters.genres.join(',') : filters.genres,
      order_by: filters.order_by,
      sort: filters.sort,
      letter: filters.letter,
      producer: filters.producer,
    };

    const jikanRes = await this.fetchJikan<JikanAnimeListResponse>('/anime', jikanParams);
    if (jikanRes?.data) return jikanRes;

    // Fallback via AniList GraphQL
    const anilistSearch = await aniListService.searchAnime({
      keyword: query,
      format: filters.type ? filters.type.toUpperCase() : undefined,
      status: filters.status ? filters.status.toUpperCase() : undefined,
      season: filters.season ? filters.season.toUpperCase() : undefined,
      seasonYear: filters.year,
      page,
      perPage: limit,
    });

    return {
      pagination: {
        last_visible_page: anilistSearch.totalPages,
        has_next_page: anilistSearch.hasNextPage,
        current_page: anilistSearch.currentPage,
        items: {
          count: anilistSearch.animes.length,
          total: anilistSearch.animes.length * anilistSearch.totalPages,
          per_page: limit,
        },
      },
      data: anilistSearch.animes.map((a: any) => this.mediaToJikanAnime(a)),
    };
  }

  /**
   * 11. Filter Options
   * GET /api/v1/mal/filter/options
   */
  public getFilterOptions(): {
    types: Array<{ label: string; value: string }>;
    statuses: Array<{ label: string; value: string }>;
    ratings: Array<{ label: string; value: string }>;
    order_by: Array<{ label: string; value: string }>;
    sort: Array<{ label: string; value: string }>;
    genres: JikanGenreItem[];
  } {
    return {
      types: [
        { label: 'TV Series', value: 'tv' },
        { label: 'Movie', value: 'movie' },
        { label: 'OVA', value: 'ova' },
        { label: 'ONA', value: 'ona' },
        { label: 'Special', value: 'special' },
        { label: 'Music', value: 'music' },
      ],
      statuses: [
        { label: 'Currently Airing', value: 'airing' },
        { label: 'Finished Airing', value: 'complete' },
        { label: 'Upcoming', value: 'upcoming' },
      ],
      ratings: [
        { label: 'G - All Ages', value: 'g' },
        { label: 'PG - Children', value: 'pg' },
        { label: 'PG-13 - Teens 13 or older', value: 'pg13' },
        { label: 'R - 17+ (violence & profanity)', value: 'r17' },
        { label: 'R+ - Mild Nudity', value: 'r' },
        { label: 'Rx - Hentai', value: 'rx' },
      ],
      order_by: [
        { label: 'Popularity', value: 'popularity' },
        { label: 'Score', value: 'score' },
        { label: 'Title', value: 'title' },
        { label: 'Start Date', value: 'start_date' },
        { label: 'End Date', value: 'end_date' },
        { label: 'Rank', value: 'rank' },
        { label: 'Members', value: 'members' },
        { label: 'Episodes', value: 'episodes' },
      ],
      sort: [
        { label: 'Descending', value: 'desc' },
        { label: 'Ascending', value: 'asc' },
      ],
      genres: MAL_GENRES,
    };
  }

  /**
   * 12. Airing Schedule
   * GET /api/v1/mal/schedule?day=monday&page=1
   */
  public async getSchedule(dayOrDate?: string, page: number = 1, limit: number = 25): Promise<JikanAnimeListResponse> {
    let day = (dayOrDate || '').toLowerCase().trim();

    // If a YYYY-MM-DD date is provided, convert to day of week
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const d = new Date(day);
      if (!isNaN(d.getTime())) {
        day = days[d.getUTCDay()];
      }
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'other', 'unknown'];
    const filter = validDays.includes(day) ? day : undefined;

    const jikanRes = await this.fetchJikan<JikanAnimeListResponse>('/schedules', {
      filter,
      page,
      limit,
    });
    if (jikanRes?.data) return jikanRes;

    const anilistSched = await aniListService.getSchedule(dayOrDate, page, limit);
    const mediaList = anilistSched.scheduledAnimes.map((item) => ({
      id: item.id,
      idMal: item.id,
      name: item.name,
      jname: item.jname,
      title: { romaji: item.name, english: item.name, native: item.jname },
      format: 'TV',
      episodes: item.episodeNumber || 1,
      seasonYear: 2026,
    }));

    return {
      pagination: {
        last_visible_page: 1,
        has_next_page: false,
        current_page: 1,
        items: {
          count: mediaList.length,
          total: mediaList.length,
          per_page: limit,
        },
      },
      data: mediaList.map((m: any) => this.mediaToJikanAnime(m)),
    };
  }

  /**
   * 13. Random Anime
   * GET /api/v1/mal/random
   */
  public async getRandomAnime(): Promise<JikanAnimeSingleResponse> {
    const jikanRes = await this.fetchJikan<JikanAnimeSingleResponse>('/random/anime');
    if (jikanRes?.data) return jikanRes;

    const anilistRandom = await aniListService.getRandomAnime();
    return {
      data: this.mediaToJikanAnime(anilistRandom),
    };
  }

  /**
   * 14. Full Anime Details
   * GET /api/v1/mal/anime/:id
   */
  public async getAnimeDetails(id: number): Promise<JikanAnimeSingleResponse> {
    const jikanRes = await this.fetchJikan<JikanAnimeSingleResponse>(`/anime/${id}/full`);
    if (jikanRes?.data) return jikanRes;

    // Fallback: Query AniList by idMal
    const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        query: `
          query ($idMal: Int) {
            Media(idMal: $idMal, type: ANIME) {
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
                    }
                    format
                  }
                }
              }
            }
          }
        `,
        variables: { idMal: id },
      }),
    });

    if (res.ok) {
      const json = (await res.json()) as any;
      if (json?.data?.Media) {
        return { data: this.mediaToJikanAnime(json.data.Media) };
      }
    }

    throw new Error(`Anime with MAL ID ${id} not found`);
  }

  /**
   * 15. Episodes List
   * GET /api/v1/mal/episodes/:id?page=1
   */
  public async getEpisodes(id: number, page: number = 1): Promise<JikanEpisodesResponse> {
    const jikanRes = await this.fetchJikan<JikanEpisodesResponse>(`/anime/${id}/episodes`, { page });
    if (jikanRes?.data && jikanRes.data.length > 0) return jikanRes;

    // Fallback via AniZip mappings by mal_id
    try {
      const azRes = await fetch(`${ANIZIP_ENDPOINT}?mal_id=${id}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'AniSora/1.8.2' },
      });

      if (azRes.ok) {
        const az = (await azRes.json()) as any;
        const epsObj = az?.episodes || {};
        const epNumbers = Object.keys(epsObj)
          .map((n) => parseInt(n, 10))
          .filter((n) => !isNaN(n) && n > 0)
          .sort((a, b) => a - b);

        if (epNumbers.length > 0) {
          const perPage = 100;
          const startIndex = (page - 1) * perPage;
          const pageNumbers = epNumbers.slice(startIndex, startIndex + perPage);

          const data: JikanEpisodeItem[] = pageNumbers.map((epNum) => {
            const epData = epsObj[String(epNum)] || {};
            const titleEn = epData.title?.en || epData.title?.['x-jat'] || epData.title?.ja || `Episode ${epNum}`;
            const titleJa = epData.title?.ja || null;
            const titleRom = epData.title?.['x-jat'] || epData.title?.en || null;

            return {
              mal_id: epNum,
              url: `https://myanimelist.net/anime/${id}/episode/${epNum}`,
              title: titleEn,
              title_japanese: titleJa,
              title_romanji: titleRom,
              aired: epData.airDate || epData.airdate || null,
              score: epData.rating ? parseFloat(epData.rating) : null,
              filler: false,
              recap: false,
              image: epData.image || null,
              summary: epData.overview || epData.summary || null,
            };
          });

          return {
            pagination: {
              last_visible_page: Math.ceil(epNumbers.length / perPage),
              has_next_page: startIndex + perPage < epNumbers.length,
              current_page: page,
            },
            data,
          };
        }
      }
    } catch {
      // Continue to next fallback
    }

    // Ultimate fallback: Query episode count and generate list
    try {
      const details = await this.getAnimeDetails(id);
      const total = details.data.episodes || 12;
      const data: JikanEpisodeItem[] = [];
      for (let i = 1; i <= Math.min(total, 100); i++) {
        data.push({
          mal_id: i,
          url: `https://myanimelist.net/anime/${id}/episode/${i}`,
          title: `Episode ${i}`,
          title_japanese: null,
          title_romanji: `Episode ${i}`,
          aired: null,
          score: null,
          filler: false,
          recap: false,
        });
      }
      return {
        pagination: {
          last_visible_page: 1,
          has_next_page: false,
          current_page: 1,
        },
        data,
      };
    } catch (e: any) {
      throw new Error(`Failed to fetch episodes for MAL ID ${id}: ${e?.message}`);
    }
  }

  /**
   * 16. Reverse Sync (MAL ID -> HiAnime / AniList)
   * GET /api/v1/mal/sync/:malId
   */
  public async syncFromMal(malId: number): Promise<any> {
    // 1. Resolve AniList ID and title from AniZip or MAL details
    let anilistId: number | null = null;
    let malTitle = '';

    try {
      const azRes = await fetch(`${ANIZIP_ENDPOINT}?mal_id=${malId}`);
      if (azRes.ok) {
        const az = (await azRes.json()) as any;
        anilistId = az.mappings?.anilist_id ? parseInt(az.mappings.anilist_id, 10) : null;
        malTitle = az.titles?.en || az.titles?.['x-jat'] || az.titles?.ja || '';
      }
    } catch {
      // ignore
    }

    if (!anilistId) {
      const details = await this.getAnimeDetails(malId);
      malTitle = details.data.title;
      // Search anilist for idMal
      const anilistMedia = await aniListService.queryAniList({ idMal: malId });
      if (anilistMedia?.id) {
        anilistId = anilistMedia.id;
      }
    }

    if (anilistId) {
      return aniListService.syncFromAniList(anilistId);
    }

    throw new Error(`Unable to map MAL ID ${malId} to streaming source`);
  }
}

export const malService = new MALService();
export default malService;
