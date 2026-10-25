import { Request, Response } from 'express';
import { aniListService } from '../services/anilist.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class SyncController {
  public async syncAnime(req: Request, res: Response): Promise<void> {
    const rawId =
      req.params.animeId ||
      req.params.id ||
      req.params.episodeId ||
      req.query.animeId ||
      req.query.id ||
      req.query.episodeId;

    const id =
      typeof rawId === 'string'
        ? rawId
        : Array.isArray(rawId)
        ? String(rawId[0])
        : null;

    if (!id || !id.trim()) {
      sendError(
        res,
        'HiAnime animeId or slug is required. Example: /api/v1/hianime/anime/sync/attack-on-titan-season-2-865 or /api/v1/hianime/anime/sync/one-piece-1',
        400
      );
      return;
    }

    try {
      console.log(
        `[SyncController] Syncing anime '${id}' with AniList...`
      );

      const syncResult = await aniListService.syncAnime(id);
      sendSuccess(res, syncResult);
    } catch (error) {
      console.error(
        `[SyncController] Error syncing anime '${id}':`,
        error
      );
      sendError(
        res,
        error instanceof Error ? error.message : 'Failed to sync anime with AniList',
        500,
        error
      );
    }
  }

  public async syncFromAniList(req: Request, res: Response): Promise<void> {
    const rawId =
      req.params.anilistId ||
      req.params.id ||
      req.query.anilistId ||
      req.query.id;

    const idStr =
      typeof rawId === 'string'
        ? rawId
        : Array.isArray(rawId)
        ? String(rawId[0])
        : null;

    const anilistId = idStr ? parseInt(idStr, 10) : NaN;

    if (!anilistId || isNaN(anilistId)) {
      sendError(
        res,
        'AniList ID is required as a numeric parameter. Example: /api/v1/anilist/sync/20958 or /api/v1/anilist/sync?id=21',
        400
      );
      return;
    }

    try {
      console.log(`[SyncController] Syncing AniList ID '${anilistId}' with HiAnime...`);
      const syncResult = await aniListService.syncFromAniList(anilistId);
      sendSuccess(res, syncResult);
    } catch (error) {
      console.error(`[SyncController] Error syncing AniList ID '${anilistId}':`, error);
      sendError(
        res,
        error instanceof Error ? error.message : 'Failed to sync AniList ID with HiAnime',
        500,
        error
      );
    }
  }
}

export const syncController = new SyncController();
export default syncController;
