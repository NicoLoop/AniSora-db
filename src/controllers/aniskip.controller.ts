import type { Request, Response } from 'express';
import { aniSkipService } from '../services/aniskip.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AniSkipController {
  public async getSkipTimes(req: Request, res: Response): Promise<void> {
    try {
      const id = (req.params.id || req.query.id || req.query.animeId || req.query.malId || req.query.anilistId) as string;
      const episodeRaw = req.params.episode || req.query.ep || req.query.episode || '1';
      const episode = parseInt(String(episodeRaw), 10) || 1;
      const lengthRaw = req.query.episodeLength || req.query.length || '0';
      const episodeLength = parseFloat(String(lengthRaw)) || 0;
      const provider = (req.query.provider || req.query.source) as string | undefined;

      if (!id) {
        sendError(res, 'Anime ID is required (e.g., ?id=21 or /skip-times/21/1)', 400);
        return;
      }

      const skipData = await aniSkipService.getSkipTimes({
        id,
        episode,
        episodeLength,
        provider,
      });

      sendSuccess(res, skipData);
    } catch (err: any) {
      console.error('[AniSkipController] Error in getSkipTimes:', err);
      sendError(res, err.message || 'Failed to fetch skip times from AniSkip', 500);
    }
  }
}

export const aniSkipController = new AniSkipController();
export default aniSkipController;
