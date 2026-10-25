import { Request, Response } from 'express';
import { fetchAnimePaheStream } from '../extractors/animepahe.extractor.js';
import { universalEmbedService } from '../services/embed.service.js';
import { buildUnifiedServerStreamItem } from '../utils/stream-formatter.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AnimePaheController {
  public async getStream(req: Request, res: Response): Promise<void> {
    const anilistId =
      req.params.anilistId ||
      req.params.id ||
      (typeof req.query.anilistId === 'string' ? req.query.anilistId : null) ||
      (typeof req.query.id === 'string' ? req.query.id : null);

    const episode =
      req.params.episode ||
      req.params.ep ||
      (typeof req.query.episode === 'string' ? req.query.episode : null) ||
      (typeof req.query.ep === 'string' ? req.query.ep : null);

    const rawType =
      req.params.type ||
      req.params.category ||
      (typeof req.query.type === 'string' ? req.query.type : null) ||
      (typeof req.query.category === 'string' ? req.query.category : null) ||
      'sub';

    const subOrDub: 'sub' | 'dub' =
      String(rawType).toLowerCase() === 'dub' ? 'dub' : 'sub';

    if (!anilistId || !episode) {
      sendError(
        res,
        'Missing required parameters: anilistId and episode are required. Example: /api/v1/hianime/stream/animepahe/16498/1/dub',
        400
      );
      return;
    }

    let anilistIdStr = String(anilistId).trim();
    const episodeStr = String(episode).trim();

    // Auto-resolve slug or non-numeric ID (e.g. 'attack-on-titan-112') to numeric AniList ID
    if (!/^\d+$/.test(anilistIdStr)) {
      try {
        const resolved = await universalEmbedService.resolveAnime(anilistIdStr, 'hianime');
        if (resolved.anilistId) {
          anilistIdStr = String(resolved.anilistId);
        } else if (resolved.malId) {
          anilistIdStr = String(resolved.malId);
        }
      } catch (err) {
        console.warn(`[AnimePaheController] Failed to resolve slug "${anilistIdStr}" to AniList ID:`, err);
      }
    }

    try {
      console.log(
        `[AnimePaheController] Fetching direct stream for anilistId: ${anilistIdStr}, episode: ${episodeStr}, type: ${subOrDub}...`
      );

      const streamData = await fetchAnimePaheStream(anilistIdStr, episodeStr, subOrDub);

      const unifiedItem = buildUnifiedServerStreamItem({
        server: 'AnimePahe',
        provider: 'vidnest',
        category: subOrDub,
        streamUrl: streamData.m3u8,
        embedUrl: null,
        proxyUrl: streamData.proxyM3U8,
        thumbnailVtt: null,
        subtitles: streamData.subtitles,
        intro: streamData.intro,
        outro: streamData.outro,
      });

      sendSuccess(res, [unifiedItem]);
    } catch (error) {
      console.error(
        `[AnimePaheController] Error fetching stream for anilistId: ${anilistId}, ep: ${episode}:`,
        error
      );
      sendError(
        res,
        error instanceof Error ? error.message : 'Failed to extract AnimePahe stream',
        500,
        error
      );
    }
  }
}

export const animePaheController = new AnimePaheController();
export default animePaheController;
