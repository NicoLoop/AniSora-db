import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractAnimeDetails } from '../extractors/detail.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class DetailController {
  public async getAnimeDetails(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      sendError(res, 'Anime ID or slug is required', 400);
      return;
    }

    try {
      console.log(`[DetailController] Fetching anime details for: ${id}...`);
      const html = await scraperService.fetchHtml(`/${encodeURIComponent(id)}`);
      const details = extractAnimeDetails(html, id);

      if (!details.name) {
        sendError(res, `Anime not found with ID: ${id}`, 404);
        return;
      }

      sendSuccess(res, details);
    } catch (error) {
      console.error(`[DetailController] Error fetching anime details for ${id}:`, error);
      sendError(res, `Failed to scrap anime details for ${id}`, 500, error);
    }
  }
}

export const detailController = new DetailController();
export default detailController;
