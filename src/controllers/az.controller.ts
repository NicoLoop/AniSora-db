import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractListingPage } from '../extractors/list.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AZController {
  public async getAnimeByLetter(req: Request, res: Response): Promise<void> {
    const rawLetter = req.params.letter || req.query.letter;
    let letter = typeof rawLetter === 'string' ? rawLetter.trim().toLowerCase() : '';

    const rawPage = req.query.page;
    const page = typeof rawPage === 'string' ? parseInt(rawPage, 10) || 1 : 1;

    if (!letter) {
      letter = 'all';
    }

    try {
      console.log(`[AZController] Fetching anime for letter: "${letter}" (page ${page})...`);
      const endpoint = `/az-list/${encodeURIComponent(letter)}?page=${page}`;
      const html = await scraperService.fetchHtml(endpoint);
      const listing = extractListingPage(html, page);

      sendSuccess(res, {
        letter,
        ...listing,
      });
    } catch (error) {
      console.error(`[AZController] Error fetching az-list for "${letter}":`, error);
      sendError(res, `Failed to fetch az-list for "${letter}"`, 500, error);
    }
  }
}

export const azController = new AZController();
export default azController;
