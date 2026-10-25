import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractZokoStream } from '../extractors/zoko.extractor.js';
import { universalEmbedService } from '../services/embed.service.js';
import { buildProxyUrl } from '../extractors/vidnest.common.js';
import { buildUnifiedServerStreamItem } from '../utils/stream-formatter.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ZokoController {
  public async getStream(req: Request, res: Response): Promise<void> {
    let targetUrl: string | null = null;

    // 1. Check query parameter `?url=...`
    if (typeof req.query.url === 'string' && req.query.url.trim()) {
      targetUrl = req.query.url.trim();
    }
    // 2. Check query parameter `?hash=...` (base64 encoded URL from servers endpoint)
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
    // 4. Check route parameters `/:provider/:id/:ep/:category`
    else if (req.params.provider && req.params.id && req.params.ep) {
      let provider = String(req.params.provider).toLowerCase();
      let targetId = String(req.params.id).trim();
      const epStr = String(req.params.ep).trim();
      const category = String(req.params.category || 'sub');

      // Auto-resolve non-numeric anime slugs (e.g. 'attack-on-titan-112') to numeric MAL or AniList ID
      if (!/^\d+$/.test(targetId)) {
        try {
          const resolved = await universalEmbedService.resolveAnime(targetId, 'hianime');
          if (resolved.malId) {
            provider = 'mal';
            targetId = String(resolved.malId);
          } else if (resolved.anilistId) {
            provider = 'anilist';
            targetId = String(resolved.anilistId);
          }
        } catch (err) {
          console.warn(`[ZokoController] Failed to resolve slug "${targetId}" to MAL/AniList ID:`, err);
        }
      }

      targetUrl = `https://zokoanime.video/stream/${provider}/${targetId}/${epStr}/${category}`;
    }

    if (!targetUrl) {
      sendError(
        res,
        'Streaming link is required. Provide ?url=https://zokoanime.video/stream/... or ?hash=... or pass params /:provider/:id/:ep/:category',
        400
      );
      return;
    }

    // If targetUrl itself contains a slug instead of numeric ID (e.g. /stream/mal/attack-on-titan-112/1/sub)
    const streamUrlMatch = targetUrl.match(/zokoanime\.video\/stream\/(mal|anilist)\/([^/]+)\/(\d+)(?:\/([^/?]+))?/i);
    if (streamUrlMatch) {
      const provType = streamUrlMatch[1].toLowerCase();
      const rawId = streamUrlMatch[2];
      const epNum = streamUrlMatch[3];
      const cat = streamUrlMatch[4] || 'sub';

      if (!/^\d+$/.test(rawId)) {
        try {
          const resolved = await universalEmbedService.resolveAnime(rawId, 'hianime');
          let cleanProv = provType;
          let cleanId = rawId;
          if (resolved.malId) {
            cleanProv = 'mal';
            cleanId = String(resolved.malId);
          } else if (resolved.anilistId) {
            cleanProv = 'anilist';
            cleanId = String(resolved.anilistId);
          }
          targetUrl = `https://zokoanime.video/stream/${cleanProv}/${cleanId}/${epNum}/${cat}`;
        } catch (err) {
          console.warn(`[ZokoController] Failed to resolve rawId "${rawId}" from URL:`, err);
        }
      }
    }

    // Ensure it is a valid ZokoAnime stream URL
    if (!targetUrl.includes('zokoanime.video') && !targetUrl.includes('/stream/')) {
      sendError(res, `Invalid streaming link: ${targetUrl}. Expected ZokoAnime stream URL.`, 400);
      return;
    }

    try {
      console.log(`[ZokoController] Fetching and analyzing stream from: ${targetUrl}...`);
      const html = await scraperService.fetchDirect(targetUrl, {
        Referer: `${scraperService.getActiveBaseUrl()}/`,
      });

      const streamData = extractZokoStream(html, targetUrl);

      const cat = targetUrl.includes('/dub') ? 'dub' : targetUrl.includes('/raw') ? 'raw' : 'sub';
      const proxyUrl = streamData.m3u8
        ? buildProxyUrl(streamData.m3u8, {
            Referer: 'https://zokoanime.video/',
          })
        : null;

      const unifiedItem = buildUnifiedServerStreamItem({
        server: 'ZokoAnime',
        provider: 'zokoanime',
        category: cat,
        streamUrl: streamData.m3u8,
        embedUrl: targetUrl,
        proxyUrl,
        thumbnailVtt: null,
        subtitles: streamData.subtitles,
        intro: streamData.intro,
        outro: streamData.outro,
        downloadUrl: streamData.downloadUrl,
      });

      sendSuccess(res, [unifiedItem]);
    } catch (error) {
      console.error(`[ZokoController] Error extracting stream from ${targetUrl}:`, error);
      sendError(res, 'Failed to extract ZokoAnime stream information', 500, error);
    }
  }
}

export const zokoController = new ZokoController();
export default zokoController;
