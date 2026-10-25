import * as cheerio from 'cheerio';
import type { EpisodeServersData, EpisodeServer } from '../types/anime.js';

function decodeBase64StreamUrl(hash?: string | null): string | null {
  if (!hash) return null;
  try {
    const decoded = Buffer.from(hash, 'base64').toString('utf-8');
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
      return decoded;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function extractEpisodeServers(html: string, episodeId: string): EpisodeServersData {
  const $ = cheerio.load(html);

  const result: EpisodeServersData = {
    episodeId,
    sub: [],
    dub: [],
    raw: [],
  };

  $('.server-item').each((_, el) => {
    const $el = $(el);
    const serverName = $el.attr('data-server-name') || $el.text().trim();
    const typeAttr = ($el.attr('data-type') || 'sub').toLowerCase();
    const hash = $el.attr('data-hash') || '';
    const streamUrl = decodeBase64StreamUrl(hash);

    const type: 'sub' | 'dub' | 'raw' =
      typeAttr === 'dub' ? 'dub' : typeAttr === 'raw' ? 'raw' : 'sub';

    const serverObj: EpisodeServer = {
      serverName,
      type,
      hash,
      streamUrl,
    };

    if (type === 'dub') {
      result.dub.push(serverObj);
    } else if (type === 'raw') {
      result.raw.push(serverObj);
    } else {
      result.sub.push(serverObj);
    }
  });

  return result;
}

export default extractEpisodeServers;
