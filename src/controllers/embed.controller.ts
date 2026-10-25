import { Request, Response } from 'express';
import { universalEmbedService } from '../services/embed.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class EmbedController {
  public async getEmbed(req: Request, res: Response): Promise<void> {
    const rawId =
      req.params.id ||
      req.params.animeId ||
      req.query.id ||
      req.query.animeId ||
      req.query.episodeId;

    const id = typeof rawId === 'string' ? rawId.trim() : Array.isArray(rawId) ? String(rawId[0]).trim() : '';

    if (!id) {
      sendError(
        res,
        'Anime ID or query is required. Supports Miruro hash, AniList ID (e.g. 21), MAL ID (e.g. 21), HiAnime slug (e.g. one-piece-100), or episode ID. Example: /embed?id=21&ep=1 or /api/v1/embed/21/1',
        400
      );
      return;
    }

    const rawEp =
      req.params.episode ||
      req.params.ep ||
      req.query.episode ||
      req.query.ep ||
      req.query.episodeNumber ||
      req.query.episodeNo;

    let episodeNumber = 1;
    if (typeof rawEp === 'string' && /^\d+$/.test(rawEp.trim())) {
      episodeNumber = parseInt(rawEp.trim(), 10);
    } else if (typeof rawEp === 'number') {
      episodeNumber = rawEp;
    }

    const rawCategory =
      req.params.category ||
      req.query.category ||
      req.query.subOrDub ||
      req.query.type ||
      'sub';

    const category: 'sub' | 'dub' | 'raw' =
      String(rawCategory).toLowerCase() === 'dub'
        ? 'dub'
        : String(rawCategory).toLowerCase() === 'raw'
        ? 'raw'
        : 'sub';

    const preferredServer =
      typeof req.query.server === 'string' ? req.query.server.trim() : undefined;

    const provider =
      typeof req.query.provider === 'string'
        ? req.query.provider.trim().toLowerCase()
        : typeof req.query.source === 'string'
        ? req.query.source.trim().toLowerCase()
        : undefined;

    try {
      console.log(
        `[EmbedController] Resolving embed for ID: "${id}", episode: ${episodeNumber}, category: ${category}, server: ${preferredServer || 'auto'}, provider: ${provider || 'auto'}...`
      );

      const embedData = await universalEmbedService.getUniversalEmbed({
        id,
        episodeNumber,
        category,
        preferredServer,
        provider,
      });

      // Optional HTML Player View if requested with ?player=true or ?view=player
      const isPlayerView = req.query.player === 'true' || req.query.view === 'player';
      if (isPlayerView && embedData.primaryEmbed?.embedUrl) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(this.renderPlayerHtml(embedData));
        return;
      }

      sendSuccess(res, embedData);
    } catch (error) {
      console.error(`[EmbedController] Error resolving universal embed for "${id}":`, error);
      sendError(
        res,
        error instanceof Error ? error.message : 'Failed to resolve universal anime embed data',
        500,
        error
      );
    }
  }

  private renderPlayerHtml(data: any): string {
    const primaryUrl = data.primaryEmbed?.embedUrl || '';
    const title = data.anime?.title?.english || data.anime?.title?.romaji || 'Anime Player';
    const epNum = data.anime?.currentEpisode || 1;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Episode ${epNum} | AniSora Player</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    .header { background: #0f172a; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; z-index: 10; }
    .header h1 { font-size: 16px; font-weight: 600; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
    .header .meta { font-size: 13px; color: #94a3b8; }
    .player-wrap { flex: 1; position: relative; width: 100%; height: 100%; background: #000; }
    iframe { width: 100%; height: 100%; border: none; }
    .footer { background: #0f172a; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; }
    .footer a { color: #38bdf8; text-decoration: none; font-weight: 500; }
  </style>
</head>
<body>
  <div class="header">
    <h1><span>🎬</span> ${title}</h1>
    <div class="meta">Episode ${epNum} &bull; ${data.primaryEmbed?.server || 'Server'} (${data.primaryEmbed?.provider || 'Embed'})</div>
  </div>
  <div class="player-wrap">
    <iframe src="${primaryUrl}" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>
  </div>
  <div class="footer">
    <div>Cross-mapped via AniList (${data.mappings?.anilistId || 'N/A'}), MAL (${data.mappings?.malId || 'N/A'}), Miruro & HiAnime</div>
    <div><a href="?format=json">View Raw API JSON</a></div>
  </div>
</body>
</html>`;
  }
}

export const embedController = new EmbedController();
export default embedController;
