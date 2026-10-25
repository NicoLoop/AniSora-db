import { Request, Response } from 'express';
import { miruroService } from '../services/miruro.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class MiruroController {
  /**
   * Home Highlights Feed
   * GET /api/v1/miruro/home
   */
  public async getHome(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[MiruroController] Fetching Miruro Home Highlights Feed...`);
      const data = await miruroService.getHome();
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MiruroController] Error fetching home highlights:', error);
      sendError(res, 'Failed to fetch Miruro home highlights', 500, error);
    }
  }

  /**
   * Trending Anime
   * GET /api/v1/miruro/trending?page=1
   */
  public async getTrending(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      console.log(`[MiruroController] Fetching trending anime (page ${page})...`);
      const data = await miruroService.getTrending(page);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MiruroController] Error fetching trending anime:', error);
      sendError(res, 'Failed to fetch trending anime from Miruro', 500, error);
    }
  }

  /**
   * Most Popular Anime
   * GET /api/v1/miruro/most-popular?page=1
   * GET /api/v1/miruro/popular
   */
  public async getPopular(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      console.log(`[MiruroController] Fetching popular anime (page ${page})...`);
      const data = await miruroService.getPopular(page);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MiruroController] Error fetching popular anime:', error);
      sendError(res, 'Failed to fetch popular anime from Miruro', 500, error);
    }
  }

  /**
   * Top Rated Anime
   * GET /api/v1/miruro/top-rated?page=1
   * GET /api/v1/miruro/top-10
   */
  public async getTopRated(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      console.log(`[MiruroController] Fetching top rated anime (page ${page})...`);
      const data = await miruroService.getTopRated(page);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MiruroController] Error fetching top rated anime:', error);
      sendError(res, 'Failed to fetch top rated anime from Miruro', 500, error);
    }
  }

  /**
   * Top Airing Anime
   * GET /api/v1/miruro/top-airing?page=1
   */
  public async getTopAiring(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      console.log(`[MiruroController] Fetching top airing anime (page ${page})...`);
      const data = await miruroService.getTopAiring(page);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MiruroController] Error fetching top airing anime:', error);
      sendError(res, 'Failed to fetch top airing anime from Miruro', 500, error);
    }
  }

  /**
   * Movies Shortcut
   * GET /api/v1/miruro/movie
   * GET /api/v1/miruro/movies
   */
  public async getMovies(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      const data = await miruroService.getByCategory('movie', page);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 'Failed to fetch anime movies from Miruro', 500, error);
    }
  }

  /**
   * TV Series Shortcut
   * GET /api/v1/miruro/tv
   * GET /api/v1/miruro/tv-series
   */
  public async getTvSeries(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      const data = await miruroService.getByCategory('tv', page);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 'Failed to fetch TV series from Miruro', 500, error);
    }
  }

  /**
   * OVAs Shortcut
   * GET /api/v1/miruro/ova
   * GET /api/v1/miruro/ovas
   */
  public async getOvas(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      const data = await miruroService.getByCategory('ova', page);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 'Failed to fetch OVAs from Miruro', 500, error);
    }
  }

  /**
   * ONAs Shortcut
   * GET /api/v1/miruro/ona
   * GET /api/v1/miruro/onas
   */
  public async getOnas(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      const data = await miruroService.getByCategory('ona', page);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 'Failed to fetch ONAs from Miruro', 500, error);
    }
  }

  /**
   * Specials Shortcut
   * GET /api/v1/miruro/special
   * GET /api/v1/miruro/specials
   */
  public async getSpecials(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      const data = await miruroService.getByCategory('special', page);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 'Failed to fetch specials from Miruro', 500, error);
    }
  }

  /**
   * Subbed Anime Shortcut
   * GET /api/v1/miruro/subbed-anime
   */
  public async getSubbedAnime(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      const data = await miruroService.getByCategory('subbed-anime', page);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 'Failed to fetch subbed anime from Miruro', 500, error);
    }
  }

  /**
   * Dubbed Anime Shortcut
   * GET /api/v1/miruro/dubbed-anime
   */
  public async getDubbedAnime(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      const data = await miruroService.getByCategory('dubbed-anime', page);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 'Failed to fetch dubbed anime from Miruro', 500, error);
    }
  }

  /**
   * Generic Category Endpoint
   * GET /api/v1/miruro/category/:category?page=1
   */
  public async getCategory(req: Request, res: Response): Promise<void> {
    const rawCat = req.params.category;
    const category = typeof rawCat === 'string' ? rawCat : '';
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);

    if (!category) {
      sendError(res, 'Category name is required', 400);
      return;
    }

    try {
      console.log(`[MiruroController] Fetching category "${category}" (page ${page})...`);
      const data = await miruroService.getByCategory(category, page);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MiruroController] Error fetching category "${category}":`, error);
      sendError(res, `Failed to fetch category "${category}" from Miruro`, 500, error);
    }
  }

  /**
   * Genre List
   * GET /api/v1/miruro/genres
   */
  public getGenres(req: Request, res: Response): void {
    const genres = miruroService.getGenres();
    sendSuccess(res, { genres });
  }

  /**
   * Anime by Genre
   * GET /api/v1/miruro/genres/:genre?page=1
   * GET /api/v1/miruro/genre/:genre
   */
  public async getAnimeByGenre(req: Request, res: Response): Promise<void> {
    const genre = String(req.params.genre || req.query.genre || '').trim();
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);

    if (!genre) {
      sendError(res, 'Genre name is required', 400);
      return;
    }

    try {
      console.log(`[MiruroController] Fetching anime by genre "${genre}" (page ${page})...`);
      const data = await miruroService.getByGenre(genre, page);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MiruroController] Error fetching genre "${genre}":`, error);
      sendError(res, `Failed to fetch anime for genre "${genre}" from Miruro`, 500, error);
    }
  }

  /**
   * A-Z List Directory
   * GET /api/v1/miruro/az-list/:letter?page=1
   * GET /api/v1/miruro/az-list?letter=A
   */
  public async getAZList(req: Request, res: Response): Promise<void> {
    const letter = String(req.params.letter || req.query.letter || 'all').trim();
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);

    try {
      console.log(`[MiruroController] Fetching A-Z list for letter "${letter}" (page ${page})...`);
      const data = await miruroService.getAZList(letter, page);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MiruroController] Error fetching A-Z list:`, error);
      sendError(res, 'Failed to fetch A-Z directory from Miruro', 500, error);
    }
  }

  /**
   * Search Suggestions
   * GET /api/v1/miruro/search/suggestions?keyword=naruto
   */
  public async getSuggestions(req: Request, res: Response): Promise<void> {
    const keyword = String(req.query.keyword || req.query.q || '').trim();
    if (!keyword) {
      sendSuccess(res, { suggestions: [] });
      return;
    }

    try {
      console.log(`[MiruroController] Fetching suggestions for "${keyword}"...`);
      const suggestions = await miruroService.getSuggestions(keyword);
      sendSuccess(res, { suggestions });
    } catch (error) {
      console.error('[MiruroController] Error fetching suggestions:', error);
      sendError(res, 'Failed to fetch search suggestions from Miruro', 500, error);
    }
  }

  /**
   * Catalog Search
   * GET /api/v1/miruro/search?keyword=naruto&page=1
   * GET /api/v1/miruro/browse?keyword=naruto
   */
  public async searchAnime(req: Request, res: Response): Promise<void> {
    const keyword = String(req.query.keyword || req.query.q || '').trim();
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);

    try {
      console.log(`[MiruroController] Searching Miruro catalog for "${keyword}" (page ${page})...`);
      const data = await miruroService.searchAnime(keyword, page, {
        format: req.query.format ? String(req.query.format) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        genres: req.query.genres ? String(req.query.genres) : undefined,
        season: req.query.season ? String(req.query.season) : undefined,
        sort: req.query.sort ? String(req.query.sort) : undefined
      });
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MiruroController] Error searching anime catalog:', error);
      sendError(res, 'Failed to search anime catalog on Miruro', 500, error);
    }
  }

  /**
   * Filter Options
   * GET /api/v1/miruro/filter/options
   */
  public getFilterOptions(req: Request, res: Response): void {
    const options = miruroService.getFilterOptions();
    sendSuccess(res, options);
  }

  /**
   * Filter Anime
   * GET /api/v1/miruro/filter?genres=Action&format=TV
   */
  public async filterAnime(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    try {
      const data = await miruroService.searchAnime('', page, {
        format: req.query.format ? String(req.query.format) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        genres: req.query.genres ? String(req.query.genres) : (req.query.genre ? String(req.query.genre) : undefined),
        season: req.query.season ? String(req.query.season) : undefined,
        sort: req.query.sort ? String(req.query.sort) : undefined,
        yearFrom: req.query.yearFrom ? String(req.query.yearFrom) : undefined,
        yearTo: req.query.yearTo ? String(req.query.yearTo) : undefined,
        minScore: req.query.minScore ? String(req.query.minScore) : undefined
      });
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MiruroController] Error filtering anime:', error);
      sendError(res, 'Failed to filter anime from Miruro', 500, error);
    }
  }

  /**
   * Airing Schedule
   * GET /api/v1/miruro/schedule?date=2026-10-24
   */
  public async getSchedule(req: Request, res: Response): Promise<void> {
    const date = req.query.date ? String(req.query.date).trim() : undefined;
    try {
      console.log(`[MiruroController] Fetching airing schedule for date: ${date || 'today'}...`);
      const data = await miruroService.getSchedule(date);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MiruroController] Error fetching airing schedule:', error);
      sendError(res, 'Failed to fetch airing schedule from Miruro', 500, error);
    }
  }

  /**
   * Random Anime
   * GET /api/v1/miruro/random
   */
  public async getRandomAnime(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[MiruroController] Fetching random anime...`);
      const data = await miruroService.getRandomAnime();
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MiruroController] Error fetching random anime:', error);
      sendError(res, 'Failed to fetch random anime from Miruro', 500, error);
    }
  }

  /**
   * Anime Details
   * GET /api/v1/miruro/anime/:id
   * GET /api/v1/miruro/animeDetails/:id
   */
  public async getAnimeDetails(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || req.query.id || '').trim();
    if (!id) {
      sendError(res, 'Anime ID is required', 400);
      return;
    }

    try {
      console.log(`[MiruroController] Fetching anime details for "${id}"...`);
      const data = await miruroService.getAnimeDetails(id);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MiruroController] Error fetching details for anime "${id}":`, error);
      sendError(res, `Failed to fetch anime details for "${id}" from Miruro`, 500, error);
    }
  }

  /**
   * Episodes List
   * GET /api/v1/miruro/episodes/:id
   * GET /api/v1/miruro/anime/:id/episodes
   */
  public async getEpisodes(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || req.query.id || '').trim();
    if (!id) {
      sendError(res, 'Anime ID is required', 400);
      return;
    }

    try {
      console.log(`[MiruroController] Fetching episodes for anime "${id}"...`);
      const data = await miruroService.getEpisodes(id);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MiruroController] Error fetching episodes for anime "${id}":`, error);
      sendError(res, `Failed to fetch episodes for anime "${id}" from Miruro`, 500, error);
    }
  }

  /**
   * Episode Servers
   * GET /api/v1/miruro/servers?episodeId=...
   * GET /api/v1/miruro/servers/:episodeId
   * GET /api/v1/miruro/episode/servers
   */
  public async getServers(req: Request, res: Response): Promise<void> {
    const episodeId = String(req.params.episodeId || req.query.episodeId || req.query.id || '').trim();
    const episodeNumber = req.query.ep ? parseInt(String(req.query.ep), 10) : (req.query.episode ? parseInt(String(req.query.episode), 10) : undefined);

    if (!episodeId) {
      sendError(res, 'Episode ID or anime ID is required', 400);
      return;
    }

    try {
      console.log(`[MiruroController] Fetching servers for episode "${episodeId}" (ep ${episodeNumber || 'auto'})...`);
      const data = await miruroService.getServers(episodeId, episodeNumber);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MiruroController] Error fetching servers for episode "${episodeId}":`, error);
      sendError(res, `Failed to fetch servers for episode "${episodeId}" from Miruro`, 500, error);
    }
  }

  /**
   * Episode Embed Sources
   * GET /api/v1/miruro/embed?animeId=...&episode=1&server=...&category=sub
   * GET /api/v1/miruro/episode/sources?animeId=...&episode=1
   * GET /api/v1/miruro/stream?animeId=...&episode=1
   */
  public async getSources(req: Request, res: Response): Promise<void> {
    const rawId =
      req.params.id ||
      req.params.animeId ||
      req.params.episodeId ||
      req.query.id ||
      req.query.animeId ||
      req.query.episodeId;

    const animeId = typeof rawId === 'string' ? rawId.trim() : Array.isArray(rawId) ? String(rawId[0]).trim() : '';

    if (!animeId) {
      sendError(res, 'Anime ID or episode ID is required', 400);
      return;
    }

    const rawEp =
      req.params.episode ||
      req.params.ep ||
      req.query.episode ||
      req.query.ep ||
      req.query.episodeNumber ||
      '1';

    const episode = parseInt(String(rawEp).trim(), 10) || 1;
    const server = typeof req.query.server === 'string' ? req.query.server.trim() : undefined;
    const rawCategory = req.params.category || req.query.category || req.query.subOrDub || req.query.type || 'sub';
    const category = String(rawCategory).toLowerCase() === 'dub' ? 'dub' : String(rawCategory).toLowerCase() === 'raw' ? 'raw' : 'sub';

    try {
      console.log(`[MiruroController] Fetching unified sources for "${animeId}" ep ${episode} server ${server || 'all'} category ${category}...`);
      const data = await miruroService.getUnifiedStreamServers(animeId, episode, server, category);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MiruroController] Error fetching unified sources:`, error);
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch episode sources from Miruro', 500, error);
    }
  }

  /**
   * Reverse Sync (Miruro ID <-> AniList / MAL)
   * GET /api/v1/miruro/sync/:id
   */
  public async syncAnime(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id || req.query.id || '').trim();
    if (!id) {
      sendError(res, 'Anime ID is required for sync', 400);
      return;
    }

    try {
      console.log(`[MiruroController] Syncing metadata for "${id}"...`);
      const data = await miruroService.syncAnime(id);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MiruroController] Error syncing anime "${id}":`, error);
      sendError(res, `Failed to sync anime "${id}" from Miruro`, 500, error);
    }
  }

  /**
   * Episode Direct Streams with Proxy
   * GET /api/v1/miruro/stream?id=...&ep=1&server=...&category=sub
   * GET /api/v1/miruro/stream/:id/:episode?
   * GET /api/v1/miruro/episode/stream
   */
  public async getStream(req: Request, res: Response): Promise<void> {
    const rawId =
      req.params.id ||
      req.params.animeId ||
      req.params.episodeId ||
      req.query.id ||
      req.query.animeId ||
      req.query.episodeId;

    const id = typeof rawId === 'string' ? rawId.trim() : Array.isArray(rawId) ? String(rawId[0]).trim() : '';

    if (!id) {
      sendError(res, 'Anime ID or episode ID is required (e.g. ?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1)', 400);
      return;
    }

    const rawEp =
      req.params.episode ||
      req.params.ep ||
      req.query.episode ||
      req.query.ep ||
      req.query.episodeNumber ||
      '1';

    const episode = parseInt(String(rawEp).trim(), 10) || 1;
    const server = typeof req.query.server === 'string' ? req.query.server.trim() : undefined;
    const rawCategory = req.params.category || req.query.category || req.query.subOrDub || req.query.type || 'sub';
    const category = String(rawCategory).toLowerCase() === 'dub' ? 'dub' : String(rawCategory).toLowerCase() === 'raw' ? 'raw' : 'sub';

    try {
      console.log(`[MiruroController] Getting direct streams for "${id}" ep ${episode} server: ${server || 'all'} category: ${category}...`);
      const data = await miruroService.getUnifiedStreamServers(id, episode, server, category);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MiruroController] Error fetching direct streams for "${id}":`, error);
      sendError(res, error instanceof Error ? error.message : 'Failed to fetch direct streams from Miruro', 500, error);
    }
  }
}

export const miruroController = new MiruroController();

