import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractEpisodeDownloads } from '../extractors/download.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';

interface DownloadsApiResponse {
  status: boolean;
  html?: string;
  message?: string;
}

export class DownloadController {
  public async getDownloads(req: Request, res: Response): Promise<void> {
    const rawId = req.query.episodeId || req.params.episodeId;
    const episodeId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? String(rawId[0]) : null;

    if (!episodeId) {
      sendError(res, 'episodeId is required as a query parameter (?episodeId=...) or URL parameter', 400);
      return;
    }

    try {
      console.log(`[DownloadController] Fetching downloads for episodeId: ${episodeId}...`);
      const resolvedDataId = await scraperService.resolveEpisodeDataId(episodeId);
      console.log(`[DownloadController] Resolved "${episodeId}" to numeric data-id: "${resolvedDataId}"`);
      const endpoint = `/api/theme/episode/downloads?episodeId=${encodeURIComponent(resolvedDataId)}`;
      const data = await scraperService.fetchJson<DownloadsApiResponse>(endpoint);

      if (!data || !data.html) {
        sendError(res, `Failed to retrieve downloads for episodeId: ${episodeId}`, 404, data?.message);
        return;
      }

      const extracted = extractEpisodeDownloads(data.html, resolvedDataId);
      sendSuccess(res, extracted);
    } catch (error) {
      console.error(`[DownloadController] Error fetching downloads for episodeId ${episodeId}:`, error);
      sendError(res, `Failed to scrap downloads for episodeId: ${episodeId}`, 500, error);
    }
  }
}

export const downloadController = new DownloadController();
export default downloadController;
