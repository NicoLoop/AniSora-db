import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractHomePage } from '../extractors/home.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class HomeController {
  public async getHomePage(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[HomeController] Fetching homepage data...`);
      const html = await scraperService.fetchHtml('/home');
      const homeData = extractHomePage(html);

      sendSuccess(res, homeData);
    } catch (error) {
      console.error('[HomeController] Error fetching homepage:', error);
      sendError(res, 'Failed to scrap HiAnime homepage data', 500, error);
    }
  }
}

export const homeController = new HomeController();
export default homeController;
