import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractEpisodeServers } from '../extractors/server.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';

interface ServersApiResponse {
  status: boolean;
  html?: string;
  message?: string;
}

export class ServerController {
  public async getServers(req: Request, res: Response): Promise<void> {
    const rawId = req.query.episodeId || req.params.episodeId;
    const episodeId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? String(rawId[0]) : null;

    if (!episodeId) {
      sendError(res, 'episodeId is required as a query parameter (?episodeId=...) or URL parameter', 400);
      return;
    }

    try {
      console.log(`[ServerController] Fetching servers for episodeId: ${episodeId}...`);
      const resolvedDataId = await scraperService.resolveEpisodeDataId(episodeId);
      console.log(`[ServerController] Resolved "${episodeId}" to numeric data-id: "${resolvedDataId}"`);
      const endpoint = `/api/theme/episode/servers?episodeId=${encodeURIComponent(resolvedDataId)}`;
      const data = await scraperService.fetchJson<ServersApiResponse>(endpoint);

      if (!data || !data.html) {
        sendError(res, `Failed to retrieve servers for episodeId: ${episodeId}`, 404, data?.message);
        return;
      }

      const extracted = extractEpisodeServers(data.html, resolvedDataId);
      sendSuccess(res, extracted);
    } catch (error) {
      console.error(`[ServerController] Error fetching servers for episodeId ${episodeId}:`, error);
      sendError(res, `Failed to scrap servers for episodeId: ${episodeId}`, 500, error);
    }
  }
}

export const serverController = new ServerController();
export default serverController;
