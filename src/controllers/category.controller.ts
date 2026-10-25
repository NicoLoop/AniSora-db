import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractListingPage } from '../extractors/list.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';

const CATEGORY_MAP: Record<string, string> = {
  'subbed-anime': 'subbed-anime',
  subbed: 'subbed-anime',
  'dubbed-anime': 'dubbed-anime',
  dubbed: 'dubbed-anime',
  'most-popular': 'most-popular',
  popular: 'most-popular',
  movie: 'movie',
  movies: 'movie',
  tv: 'tv',
  'tv-series': 'tv',
  ova: 'ova',
  ovas: 'ova',
  ona: 'ona',
  onas: 'ona',
  special: 'special',
  specials: 'special',
};

export class CategoryController {
  private async fetchAndSendCategory(
    categorySlug: string,
    req: Request,
    res: Response
  ): Promise<void> {
    const rawPage = req.query.page;
    const page = typeof rawPage === 'string' ? parseInt(rawPage, 10) || 1 : 1;

    try {
      console.log(`[CategoryController] Fetching "${categorySlug}" (page ${page})...`);
      const endpoint = `/${categorySlug}?page=${page}`;
      const html = await scraperService.fetchHtml(endpoint);
      const listing = extractListingPage(html, page);

      sendSuccess(res, {
        category: categorySlug,
        ...listing,
      });
    } catch (error) {
      console.error(`[CategoryController] Error fetching "${categorySlug}":`, error);
      sendError(res, `Failed to fetch anime for category "${categorySlug}"`, 500, error);
    }
  }

  public async getSubbedAnime(req: Request, res: Response): Promise<void> {
    return this.fetchAndSendCategory('subbed-anime', req, res);
  }

  public async getDubbedAnime(req: Request, res: Response): Promise<void> {
    return this.fetchAndSendCategory('dubbed-anime', req, res);
  }

  public async getMostPopular(req: Request, res: Response): Promise<void> {
    return this.fetchAndSendCategory('most-popular', req, res);
  }

  public async getMovies(req: Request, res: Response): Promise<void> {
    return this.fetchAndSendCategory('movie', req, res);
  }

  public async getTvSeries(req: Request, res: Response): Promise<void> {
    return this.fetchAndSendCategory('tv', req, res);
  }

  public async getOvas(req: Request, res: Response): Promise<void> {
    return this.fetchAndSendCategory('ova', req, res);
  }

  public async getOnas(req: Request, res: Response): Promise<void> {
    return this.fetchAndSendCategory('ona', req, res);
  }

  public async getSpecials(req: Request, res: Response): Promise<void> {
    return this.fetchAndSendCategory('special', req, res);
  }

  public async getAnimeByCategory(req: Request, res: Response): Promise<void> {
    const rawCategory = req.params.category || (req.query.category as string);
    const normalized = typeof rawCategory === 'string' ? rawCategory.trim().toLowerCase() : '';

    const slug = CATEGORY_MAP[normalized] || normalized;
    if (!slug) {
      sendError(
        res,
        'Category is required. Supported categories: subbed-anime, dubbed-anime, most-popular, movie, tv, ova, ona, special',
        400
      );
      return;
    }

    return this.fetchAndSendCategory(slug, req, res);
  }
}

export const categoryController = new CategoryController();
export default categoryController;
