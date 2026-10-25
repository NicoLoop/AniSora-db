import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractListingPage } from '../extractors/list.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class GenreController {
  public async getAnimeByGenre(req: Request, res: Response): Promise<void> {
    const rawGenre = req.params.genre || req.query.name;
    const genre = typeof rawGenre === 'string' ? rawGenre.trim().toLowerCase() : '';

    const rawPage = req.query.page;
    const page = typeof rawPage === 'string' ? parseInt(rawPage, 10) || 1 : 1;

    if (!genre) {
      sendError(res, 'Genre name is required (e.g. /genres/action)', 400);
      return;
    }

    try {
      console.log(`[GenreController] Fetching anime for genre: "${genre}" (page ${page})...`);
      const endpoint = `/genres/${encodeURIComponent(genre)}?page=${page}`;
      const html = await scraperService.fetchHtml(endpoint);
      const listing = extractListingPage(html, page);

      sendSuccess(res, {
        genreName: genre,
        ...listing,
      });
    } catch (error) {
      console.error(`[GenreController] Error fetching genre "${genre}":`, error);
      sendError(res, `Failed to fetch anime for genre "${genre}"`, 500, error);
    }
  }
}

export const genreController = new GenreController();
export default genreController;
