import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractAnimeDetails } from '../extractors/detail.extractor.js';
import { extractAnimeId } from '../extractors/home.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class RandomController {
  public async getRandomAnime(req: Request, res: Response): Promise<void> {
    try {
      console.log('[RandomController] Requesting random anime from /random...');
      const { data: html, finalUrl } = await scraperService.fetchWithFinalUrl('/random');

      const id = extractAnimeId(finalUrl);
      const details = extractAnimeDetails(html, id);

      sendSuccess(res, {
        ...details,
        redirectedUrl: finalUrl,
      });
    } catch (error) {
      console.error('[RandomController] Error fetching random anime:', error);
      sendError(res, 'Failed to fetch random anime', 500, error);
    }
  }
}

export const randomController = new RandomController();
export default randomController;
