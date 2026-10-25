import { Request, Response } from 'express';
import { aniListService } from '../services/anilist.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AniListController {
  /**
   * Home Highlights Feed
   * GET /api/v1/anilist/home
   */
  public async getHome(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[AniListController] Fetching AniList Home Highlights Feed...`);
      const data = await aniListService.getHome();
      sendSuccess(res, data);
    } catch (error) {
      console.error('[AniListController] Error fetching home highlights:', error);
      sendError(res, 'Failed to fetch AniList home highlights', 500, error);
    }
  }

  /**
   * Trending Anime
   * GET /api/v1/anilist/trending?page=1&perPage=20
   */
  public async getTrending(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(String(req.query.perPage), 10) || 20));

    try {
      console.log(`[AniListController] Fetching trending anime (page ${page}, perPage ${perPage})...`);
      const data = await aniListService.getTrending(page, perPage);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[AniListController] Error fetching trending anime:', error);
      sendError(res, 'Failed to fetch trending anime from AniList', 500, error);
    }
  }

  /**
   * Most Popular Anime
   * GET /api/v1/anilist/most-popular?page=1&perPage=20
   * GET /api/v1/anilist/popular
   */
  public async getPopular(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(String(req.query.perPage), 10) || 20));

    try {
      console.log(`[AniListController] Fetching popular anime (page ${page}, perPage ${perPage})...`);
      const data = await aniListService.getPopular(page, perPage);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[AniListController] Error fetching popular anime:', error);
      sendError(res, 'Failed to fetch popular anime from AniList', 500, error);
    }
  }

  /**
   * Top Rated / Top Score Anime
   * GET /api/v1/anilist/top-rated?page=1&perPage=20
   * GET /api/v1/anilist/top-10
   */
  public async getTopRated(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(String(req.query.perPage), 10) || 20));

    try {
      console.log(`[AniListController] Fetching top rated anime (page ${page}, perPage ${perPage})...`);
      const data = await aniListService.getTopRated(page, perPage);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[AniListController] Error fetching top rated anime:', error);
      sendError(res, 'Failed to fetch top rated anime from AniList', 500, error);
    }
  }

  /**
   * Category / Format Listing
   * GET /api/v1/anilist/category/:category?page=1&perPage=20
   */
  public async getCategory(req: Request, res: Response): Promise<void> {
    const rawCat = req.params.category || req.query.category;
    const category = typeof rawCat === 'string' ? rawCat : '';
    if (!category) {
      sendError(res, 'Category name is required (e.g. /category/movie)', 400);
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(String(req.query.perPage), 10) || 20));

    try {
      console.log(`[AniListController] Fetching category "${category}" (page ${page}, perPage ${perPage})...`);
      const data = await aniListService.getByCategory(category, page, perPage);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[AniListController] Error fetching category "${category}":`, error);
      sendError(res, `Failed to fetch category "${category}" from AniList`, 500, error);
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
   * GET /api/v1/anilist/genres
   */
  public async getGenres(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[AniListController] Fetching AniList genre collection...`);
      const genres = await aniListService.getGenres();
      sendSuccess(res, { genres });
    } catch (error) {
      console.error('[AniListController] Error fetching genres:', error);
      sendError(res, 'Failed to fetch genres from AniList', 500, error);
    }
  }

  /**
   * Anime by Genre
   * GET /api/v1/anilist/genres/:genre?page=1&perPage=20
   * GET /api/v1/anilist/genre/:genre
   */
  public async getAnimeByGenre(req: Request, res: Response): Promise<void> {
    const rawGenre = req.params.genre || req.query.name;
    const genre = typeof rawGenre === 'string' ? rawGenre.trim() : '';

    if (!genre) {
      sendError(res, 'Genre name is required (e.g. /genres/Action)', 400);
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(String(req.query.perPage), 10) || 20));

    try {
      console.log(`[AniListController] Fetching anime for genre "${genre}" (page ${page}, perPage ${perPage})...`);
      const data = await aniListService.getByGenre(genre, page, perPage);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[AniListController] Error fetching anime for genre "${genre}":`, error);
      sendError(res, `Failed to fetch anime for genre "${genre}" from AniList`, 500, error);
    }
  }

  /**
   * A-Z Alphabetical Directory
   * GET /api/v1/anilist/az-list/:letter?page=1&perPage=20
   * GET /api/v1/anilist/az-list?letter=A&page=1
   */
  public async getAZList(req: Request, res: Response): Promise<void> {
    const rawLetter = req.params.letter || req.query.letter;
    const letter = typeof rawLetter === 'string' ? rawLetter.trim().toLowerCase() : 'all';

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(String(req.query.perPage), 10) || 20));

    try {
      console.log(`[AniListController] Fetching A-Z directory for "${letter}" (page ${page}, perPage ${perPage})...`);
      const data = await aniListService.getAZList(letter, page, perPage);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[AniListController] Error fetching A-Z list for "${letter}":`, error);
      sendError(res, `Failed to fetch A-Z directory for "${letter}" from AniList`, 500, error);
    }
  }

  /**
   * Search Suggestions
   * GET /api/v1/anilist/search/suggestions?keyword=naruto
   * GET /api/v1/anilist/suggestions?keyword=naruto
   */
  public async getSuggestions(req: Request, res: Response): Promise<void> {
    const rawKeyword = req.query.keyword || req.query.q;
    const keyword = typeof rawKeyword === 'string' ? rawKeyword.trim() : '';

    if (!keyword) {
      sendError(res, 'keyword is required (?keyword=...)', 400);
      return;
    }

    try {
      console.log(`[AniListController] Fetching search suggestions for: "${keyword}"...`);
      const data = await aniListService.getSuggestions(keyword);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[AniListController] Error fetching suggestions for "${keyword}":`, error);
      sendError(res, `Failed to fetch suggestions for "${keyword}" from AniList`, 500, error);
    }
  }

  /**
   * Catalog Search
   * GET /api/v1/anilist/search?keyword=naruto&page=1&perPage=20
   * GET /api/v1/anilist/browse?keyword=naruto
   */
  public async searchAnime(req: Request, res: Response): Promise<void> {
    const rawKeyword = req.query.keyword || req.query.q;
    const keyword = typeof rawKeyword === 'string' ? rawKeyword.trim() : '';

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(String(req.query.perPage), 10) || 20));

    try {
      console.log(`[AniListController] Searching anime for "${keyword}" (page ${page})...`);
      const data = await aniListService.searchAnime({
        keyword: keyword || undefined,
        format: typeof req.query.format === 'string' ? req.query.format : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        genre: typeof req.query.genre === 'string' ? req.query.genre : undefined,
        season: typeof req.query.season === 'string' ? req.query.season : undefined,
        seasonYear: req.query.year ? parseInt(String(req.query.year), 10) : undefined,
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
        page,
        perPage,
      });
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[AniListController] Error searching anime:`, error);
      sendError(res, 'Failed to search anime on AniList', 500, error);
    }
  }

  /**
   * Filter Options
   * GET /api/v1/anilist/filter/options
   */
  public async getFilterOptions(req: Request, res: Response): Promise<void> {
    try {
      const genres = await aniListService.getGenres();
      const options = aniListService.getFilterOptions();
      sendSuccess(res, {
        ...options,
        genres: genres.map((g) => ({ label: g, value: g })),
      });
    } catch (error) {
      console.error('[AniListController] Error fetching filter options:', error);
      sendError(res, 'Failed to fetch AniList filter options', 500, error);
    }
  }

  /**
   * Filter Anime
   * GET /api/v1/anilist/filter?format=TV&genre=Action&status=FINISHED&sort=SCORE_DESC
   */
  public async filterAnime(req: Request, res: Response): Promise<void> {
    return this.searchAnime(req, res);
  }

  /**
   * Airing Schedule
   * GET /api/v1/anilist/schedule?date=2026-10-24
   * GET /api/v1/anilist/anime/schedule
   */
  public async getSchedule(req: Request, res: Response): Promise<void> {
    const rawDate = typeof req.query.date === 'string' ? req.query.date.trim() : undefined;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(String(req.query.perPage), 10) || 25));

    try {
      console.log(`[AniListController] Fetching schedule for date: ${rawDate || 'Today'}...`);
      const data = await aniListService.getSchedule(rawDate, page, perPage);
      sendSuccess(res, data);
    } catch (error) {
      console.error('[AniListController] Error fetching airing schedule:', error);
      sendError(res, 'Failed to fetch airing schedule from AniList', 500, error);
    }
  }

  /**
   * Random Anime
   * GET /api/v1/anilist/random
   */
  public async getRandomAnime(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[AniListController] Fetching random anime...`);
      const data = await aniListService.getRandomAnime();
      sendSuccess(res, data);
    } catch (error) {
      console.error('[AniListController] Error fetching random anime:', error);
      sendError(res, 'Failed to fetch random anime from AniList', 500, error);
    }
  }

  /**
   * Anime Details
   * GET /api/v1/anilist/anime/:id
   * GET /api/v1/anilist/animeDetails/:id
   */
  public async getAnimeDetails(req: Request, res: Response): Promise<void> {
    const rawId = req.params.id || req.query.id;
    const id = parseInt(String(rawId), 10);

    if (isNaN(id) || id <= 0) {
      sendError(res, 'Valid numeric AniList ID is required (e.g. /anime/21)', 400);
      return;
    }

    try {
      console.log(`[AniListController] Fetching anime details for AniList ID: ${id}...`);
      const data = await aniListService.getAnimeDetails(id);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[AniListController] Error fetching anime details for ${id}:`, error);
      sendError(res, `Failed to fetch anime details for ID ${id}`, 500, error);
    }
  }

  /**
   * Anime Episodes List
   * GET /api/v1/anilist/episodes/:id
   * GET /api/v1/anilist/anime/:id/episodes
   */
  public async getEpisodes(req: Request, res: Response): Promise<void> {
    const rawId = req.params.id || req.query.id;
    const id = parseInt(String(rawId), 10);

    if (isNaN(id) || id <= 0) {
      sendError(res, 'Valid numeric AniList ID is required (e.g. /episodes/21)', 400);
      return;
    }

    try {
      console.log(`[AniListController] Fetching episodes for AniList ID: ${id}...`);
      const data = await aniListService.getEpisodes(id);
      sendSuccess(res, data);
    } catch (error) {
      console.error(`[AniListController] Error fetching episodes for ${id}:`, error);
      sendError(res, `Failed to fetch episodes for ID ${id}`, 500, error);
    }
  }
}

export const aniListController = new AniListController();
export default aniListController;
