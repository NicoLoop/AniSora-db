import { Request, Response } from 'express';
import { malService } from '../services/mal.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class MALController {
  /**
   * Home Highlights Feed
   * GET /api/v1/mal/home
   */
  public async getHome(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[MALController] Fetching MAL Home Highlights Feed...`);
      const data = await malService.getHome();
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MALController] Error fetching home highlights:', error);
      sendError(res, 'Failed to fetch MAL home highlights', 500, error);
    }
  }

  /**
   * Trending Anime (Top Airing)
   * GET /api/v1/mal/trending?page=1&limit=25
   */
  public async getTrending(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || req.query.perPage), 10) || 25));

    try {
      console.log(`[MALController] Fetching trending anime (page ${page}, limit ${limit})...`);
      const data = await malService.getTrending(page, limit);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MALController] Error fetching trending anime:', error);
      sendError(res, 'Failed to fetch trending anime from MAL', 500, error);
    }
  }

  /**
   * Most Popular Anime
   * GET /api/v1/mal/popular?page=1&limit=25
   */
  public async getPopular(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || req.query.perPage), 10) || 25));

    try {
      console.log(`[MALController] Fetching popular anime (page ${page}, limit ${limit})...`);
      const data = await malService.getPopular(page, limit);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MALController] Error fetching popular anime:', error);
      sendError(res, 'Failed to fetch popular anime from MAL', 500, error);
    }
  }

  /**
   * Top Rated / Top Score Anime
   * GET /api/v1/mal/top-rated?page=1&limit=25
   */
  public async getTopRated(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || req.query.perPage), 10) || 25));

    try {
      console.log(`[MALController] Fetching top rated anime (page ${page}, limit ${limit})...`);
      const data = await malService.getTopRated(page, limit);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MALController] Error fetching top rated anime:', error);
      sendError(res, 'Failed to fetch top rated anime from MAL', 500, error);
    }
  }

  /**
   * Category / Format Listing
   * GET /api/v1/mal/category/:category?page=1&limit=25
   */
  public async getCategory(req: Request, res: Response): Promise<void> {
    const rawCat = req.params.category || req.query.category;
    const category = typeof rawCat === 'string' ? rawCat : '';
    if (!category) {
      sendError(res, 'Category name is required (e.g. /category/movie)', 400);
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || req.query.perPage), 10) || 25));

    try {
      console.log(`[MALController] Fetching category "${category}" (page ${page}, limit ${limit})...`);
      const data = await malService.getByCategory(category, page, limit);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MALController] Error fetching category "${category}":`, error);
      sendError(res, `Failed to fetch category "${category}" from MAL`, 500, error);
    }
  }

  // Category Shortcuts
  public async getMovies(req: Request, res: Response): Promise<void> {
    req.params.category = 'movie';
    return this.getCategory(req, res);
  }

  public async getTvSeries(req: Request, res: Response): Promise<void> {
    req.params.category = 'tv';
    return this.getCategory(req, res);
  }

  public async getOvas(req: Request, res: Response): Promise<void> {
    req.params.category = 'ova';
    return this.getCategory(req, res);
  }

  public async getOnas(req: Request, res: Response): Promise<void> {
    req.params.category = 'ona';
    return this.getCategory(req, res);
  }

  public async getSpecials(req: Request, res: Response): Promise<void> {
    req.params.category = 'special';
    return this.getCategory(req, res);
  }

  public async getSubbedAnime(req: Request, res: Response): Promise<void> {
    req.params.category = 'subbed-anime';
    return this.getCategory(req, res);
  }

  public async getDubbedAnime(req: Request, res: Response): Promise<void> {
    req.params.category = 'dubbed-anime';
    return this.getCategory(req, res);
  }

  /**
   * All Available Genres
   * GET /api/v1/mal/genres
   */
  public async getGenres(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[MALController] Fetching MAL genre collection...`);
      const data = await malService.getGenres();
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MALController] Error fetching genres:', error);
      sendError(res, 'Failed to fetch genres from MAL', 500, error);
    }
  }

  /**
   * Anime by Genre
   * GET /api/v1/mal/genres/:genre?page=1&limit=25
   */
  public async getAnimeByGenre(req: Request, res: Response): Promise<void> {
    const rawGenre = req.params.genre || req.query.name || req.query.id;
    const genre = typeof rawGenre === 'string' ? rawGenre.trim() : '';

    if (!genre) {
      sendError(res, 'Genre name or ID is required (e.g. /genres/Action or /genres/1)', 400);
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || req.query.perPage), 10) || 25));

    try {
      console.log(`[MALController] Fetching anime for genre "${genre}" (page ${page}, limit ${limit})...`);
      const data = await malService.getByGenre(genre, page, limit);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MALController] Error fetching anime for genre "${genre}":`, error);
      sendError(res, `Failed to fetch anime for genre "${genre}" from MAL`, 500, error);
    }
  }

  /**
   * A-Z Alphabetical Directory
   * GET /api/v1/mal/az-list/:letter?page=1&limit=25
   */
  public async getAZList(req: Request, res: Response): Promise<void> {
    const rawLetter = req.params.letter || req.query.letter;
    const letter = typeof rawLetter === 'string' ? rawLetter.trim().toLowerCase() : 'all';

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || req.query.perPage), 10) || 25));

    try {
      console.log(`[MALController] Fetching A-Z directory for "${letter}" (page ${page}, limit ${limit})...`);
      const data = await malService.getAZList(letter, page, limit);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MALController] Error fetching A-Z list for "${letter}":`, error);
      sendError(res, `Failed to fetch A-Z directory for "${letter}" from MAL`, 500, error);
    }
  }

  /**
   * Search Suggestions
   * GET /api/v1/mal/search/suggestions?keyword=naruto
   */
  public async getSuggestions(req: Request, res: Response): Promise<void> {
    const rawKeyword = req.query.keyword || req.query.q;
    const keyword = typeof rawKeyword === 'string' ? rawKeyword.trim() : '';

    if (!keyword) {
      sendError(res, 'keyword is required (?keyword=...)', 400);
      return;
    }

    try {
      console.log(`[MALController] Fetching search suggestions for: "${keyword}"...`);
      const data = await malService.getSuggestions(keyword);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MALController] Error fetching suggestions for "${keyword}":`, error);
      sendError(res, `Failed to fetch suggestions for "${keyword}" from MAL`, 500, error);
    }
  }

  /**
   * Catalog Search
   * GET /api/v1/mal/search?keyword=naruto&page=1&limit=25
   */
  public async searchAnime(req: Request, res: Response): Promise<void> {
    const rawKeyword = req.query.keyword || req.query.q;
    const keyword = typeof rawKeyword === 'string' ? rawKeyword.trim() : '';

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || req.query.perPage), 10) || 25));

    try {
      console.log(`[MALController] Searching anime for "${keyword}" (page ${page})...`);
      const data = await malService.searchAnime({
        keyword: keyword || undefined,
        type: typeof req.query.type === 'string' ? req.query.type : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        rating: typeof req.query.rating === 'string' ? req.query.rating : undefined,
        genres: typeof req.query.genres === 'string' ? req.query.genres : (typeof req.query.genre === 'string' ? req.query.genre : undefined),
        score: req.query.score ? parseFloat(String(req.query.score)) : undefined,
        order_by: typeof req.query.order_by === 'string' ? req.query.order_by : undefined,
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        season: typeof req.query.season === 'string' ? req.query.season : undefined,
        year: req.query.year ? parseInt(String(req.query.year), 10) : undefined,
        letter: typeof req.query.letter === 'string' ? req.query.letter : undefined,
        page,
        limit,
      });
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MALController] Error searching anime:`, error);
      sendError(res, 'Failed to search anime on MAL', 500, error);
    }
  }

  /**
   * Filter Options
   * GET /api/v1/mal/filter/options
   */
  public async getFilterOptions(req: Request, res: Response): Promise<void> {
    try {
      const options = malService.getFilterOptions();
      sendSuccess(res, options);
    } catch (error) {
      console.error('[MALController] Error fetching filter options:', error);
      sendError(res, 'Failed to fetch MAL filter options', 500, error);
    }
  }

  /**
   * Filter Anime
   * GET /api/v1/mal/filter?type=tv&rating=pg13
   */
  public async filterAnime(req: Request, res: Response): Promise<void> {
    return this.searchAnime(req, res);
  }

  /**
   * Airing Schedule
   * GET /api/v1/mal/schedule?day=monday&page=1
   */
  public async getSchedule(req: Request, res: Response): Promise<void> {
    const rawDay = typeof req.query.day === 'string' ? req.query.day.trim() : (typeof req.query.date === 'string' ? req.query.date.trim() : undefined);
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || req.query.perPage), 10) || 25));

    try {
      console.log(`[MALController] Fetching schedule for day: ${rawDay || 'Today'}...`);
      const data = await malService.getSchedule(rawDay, page, limit);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MALController] Error fetching airing schedule:', error);
      sendError(res, 'Failed to fetch airing schedule from MAL', 500, error);
    }
  }

  /**
   * Random Anime
   * GET /api/v1/mal/random
   */
  public async getRandomAnime(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[MALController] Fetching random anime...`);
      const data = await malService.getRandomAnime();
      sendSuccess(res, data);
    } catch (error) {
      console.error('[MALController] Error fetching random anime:', error);
      sendError(res, 'Failed to fetch random anime from MAL', 500, error);
    }
  }

  /**
   * Full Anime Details
   * GET /api/v1/mal/anime/:id
   */
  public async getAnimeDetails(req: Request, res: Response): Promise<void> {
    const rawId = req.params.id || req.query.id;
    const id = parseInt(String(rawId), 10);

    if (isNaN(id) || id <= 0) {
      sendError(res, 'Valid numeric MyAnimeList ID is required (e.g. /anime/1)', 400);
      return;
    }

    try {
      console.log(`[MALController] Fetching anime details for MAL ID: ${id}...`);
      const data = await malService.getAnimeDetails(id);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MALController] Error fetching anime details for ${id}:`, error);
      sendError(res, `Failed to fetch anime details for MAL ID ${id}`, 500, error);
    }
  }

  /**
   * Anime Episodes List
   * GET /api/v1/mal/episodes/:id
   */
  public async getEpisodes(req: Request, res: Response): Promise<void> {
    const rawId = req.params.id || req.query.id;
    const id = parseInt(String(rawId), 10);

    if (isNaN(id) || id <= 0) {
      sendError(res, 'Valid numeric MyAnimeList ID is required (e.g. /episodes/1)', 400);
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);

    try {
      console.log(`[MALController] Fetching episodes for MAL ID: ${id} (page ${page})...`);
      const data = await malService.getEpisodes(id, page);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MALController] Error fetching episodes for ${id}:`, error);
      sendError(res, `Failed to fetch episodes for MAL ID ${id}`, 500, error);
    }
  }

  /**
   * Reverse Sync (MAL ID -> HiAnime / AniList)
   * GET /api/v1/mal/sync/:malId
   */
  public async syncAnime(req: Request, res: Response): Promise<void> {
    const rawId = req.params.malId || req.query.id;
    const id = parseInt(String(rawId), 10);

    if (isNaN(id) || id <= 0) {
      sendError(res, 'Valid numeric MyAnimeList ID is required (e.g. /sync/1)', 400);
      return;
    }

    try {
      console.log(`[MALController] Syncing MAL ID ${id} to streaming sources...`);
      const data = await malService.syncFromMal(id);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[MALController] Error syncing MAL ID ${id}:`, error);
      sendError(res, `Failed to sync MAL ID ${id}`, 500, error);
    }
  }
}

export const malController = new MALController();
export default malController;
