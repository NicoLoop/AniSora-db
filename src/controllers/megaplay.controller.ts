import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import {
  extractMegaPlayDataId,
  extractMegaPlaySources,
} from '../extractors/megaplay.extractor.js';
import { buildProxyUrl } from '../extractors/vidnest.common.js';
import { buildUnifiedServerStreamItem } from '../utils/stream-formatter.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class MegaPlayController {
  public async getStream(req: Request, res: Response): Promise<void> {
    let targetUrl: string | null = null;

    // 1. Check query parameter `?url=...`
    if (typeof req.query.url === 'string' && req.query.url.trim()) {
      targetUrl = req.query.url.trim();
    }
    // 2. Check query parameter `?hash=...`
    else if (typeof req.query.hash === 'string' && req.query.hash.trim()) {
      try {
        const decoded = Buffer.from(req.query.hash.trim(), 'base64').toString('utf-8');
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          targetUrl = decoded;
        }
      } catch {
        // ignore
      }
    }
    // 3. Check JSON body `{ "url": "..." }`
    else if (req.body && typeof req.body.url === 'string' && req.body.url.trim()) {
      targetUrl = req.body.url.trim();
    }
    // 4. Check route parameters `/:id/:category?`
    else if (req.params.id) {
      const id = String(req.params.id);
      const category = String(req.params.category || 'sub');
      targetUrl = `https://megaplay.buzz/stream/s-2/${encodeURIComponent(id)}/${category}?s=tcdn`;
    }

    if (!targetUrl) {
      sendError(
        res,
        'Streaming link is required. Provide ?url=https://megaplay.buzz/stream/... or ?hash=... or pass /:id/:category',
        400
      );
      return;
    }

    // Ensure it is a MegaPlay stream URL
    if (!targetUrl.includes('megaplay') && !targetUrl.includes('/stream/')) {
      sendError(res, `Invalid streaming link: ${targetUrl}. Expected MegaPlay HD-1 stream URL.`, 400);
      return;
    }

    try {
      console.log(`[MegaPlayController] Fetching player page: ${targetUrl}...`);
      const pageHtml = await scraperService.fetchDirect(targetUrl, {
        Referer: `${scraperService.getActiveBaseUrl()}/`,
      });

      const dataId = extractMegaPlayDataId(pageHtml);
      console.log(`[MegaPlayController] Found player data-id: ${dataId}. Fetching sources...`);

      const sourcesUrl = `https://megaplay.buzz/stream/getSources?id=${encodeURIComponent(dataId)}`;
      const sourcesRaw = await scraperService.fetchDirect(sourcesUrl, {
        Referer: targetUrl,
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json, text/javascript, */*; q=0.01',
      });

      const sourcesData = JSON.parse(sourcesRaw);
      const extracted = extractMegaPlaySources(sourcesData, targetUrl);

      const cat = targetUrl.includes('/dub') ? 'dub' : 'sub';
      const m3u8Url = extracted.m3u8 || extracted.sources[0]?.url || null;
      const proxyUrl = m3u8Url
        ? buildProxyUrl(m3u8Url, {
            Referer: 'https://megaplay.buzz/',
            Origin: 'https://megaplay.buzz',
          })
        : null;

      const unifiedItem = buildUnifiedServerStreamItem({
        server: 'HD-1 (MegaPlay)',
        provider: 'hianime',
        category: cat,
        streamUrl: m3u8Url,
        embedUrl: targetUrl,
        proxyUrl,
        thumbnailVtt: extracted.thumbnails,
        subtitles: extracted.subtitles,
        intro: extracted.intro,
        outro: extracted.outro,
      });

      sendSuccess(res, [unifiedItem]);
    } catch (error) {
      console.error(`[MegaPlayController] Error extracting stream from ${targetUrl}:`, error);
      sendError(res, 'Failed to extract HD-1 (MegaPlay) stream information', 500, error);
    }
  }
}

export const megaPlayController = new MegaPlayController();
export default megaPlayController;
