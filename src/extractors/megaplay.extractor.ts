import * as cheerio from 'cheerio';
import crypto from 'crypto';
import type { MegaPlayStreamResponse, SubtitleTrack, SkipInterval } from '../types/anime.js';

const DOMAINS_ENC_KEY = 'i?LMTAx0Q6,:}50U';
const DOMAINS_ENC_IV = "W0;27ToaUpl_P%'c";

function padKeyBytes(str: string, len: number): Buffer {
  const enc = Buffer.from(str, 'utf-8');
  const buf = Buffer.alloc(len);
  enc.copy(buf, 0, 0, Math.min(len, enc.length));
  return buf;
}

function b64UrlDecode(str: string): Buffer {
  let s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const mod = s.length % 4;
  if (mod) s += '===='.slice(mod);
  return Buffer.from(s, 'base64');
}

export function decryptMegaPlayEnc(encryptedStr: string): Record<string, any> {
  const key = padKeyBytes(DOMAINS_ENC_KEY, 32);
  const iv = padKeyBytes(DOMAINS_ENC_IV, 16);
  const ciphertext = b64UrlDecode(encryptedStr);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf-8'));
}

export function extractMegaPlayDataId(html: string): string {
  const $ = cheerio.load(html);
  const player = $('#megaplay-player, .fix-area, [data-id]');

  const dataId =
    player.attr('data-id') ||
    player.attr('data-realid') ||
    player.attr('data-ep-id') ||
    player.attr('data-mediaid');

  if (dataId) return dataId;

  // Fallback to regex in case of non-standard markup
  const match = html.match(/data-id=["'](\d+)["']/i) || html.match(/data-realid=["'](\d+)["']/i);
  if (match) return match[1];

  throw new Error('Unable to find data-id or data-realid in MegaPlay player page');
}

export function extractMegaPlaySources(
  sourcesData: any,
  streamingLink: string
): MegaPlayStreamResponse {
  let m3u8Url = '';

  if (sourcesData.enc) {
    try {
      const decrypted = decryptMegaPlayEnc(sourcesData.enc);
      m3u8Url = decrypted.file || '';
    } catch (err) {
      console.error('[MegaPlayExtractor] Failed to decrypt enc:', err);
    }
  } else if (sourcesData.file) {
    m3u8Url = sourcesData.file;
  }

  const subtitles: SubtitleTrack[] = Array.isArray(sourcesData.tracks)
    ? sourcesData.tracks
        .filter((t: any) => t.kind !== 'thumbnails')
        .map((t: any) => ({
          lang: t.label || t.kind || 'unknown',
          label: t.label || 'Unknown',
          default: !!t.default,
          src: t.file || '',
        }))
    : [];

  const thumbTrack = Array.isArray(sourcesData.tracks)
    ? sourcesData.tracks.find((t: any) => t.kind === 'thumbnails')
    : null;
  const thumbnails = thumbTrack?.file || null;

  let intro: SkipInterval | null = null;
  if (sourcesData.intro && typeof sourcesData.intro.start === 'number') {
    intro = {
      start: sourcesData.intro.start,
      end: sourcesData.intro.end,
    };
  }

  let outro: SkipInterval | null = null;
  if (sourcesData.outro && typeof sourcesData.outro.start === 'number') {
    outro = {
      start: sourcesData.outro.start,
      end: sourcesData.outro.end,
    };
  }

  return {
    streamingLink,
    server: 'HD-1 (MegaPlay)',
    sources: [
      {
        url: m3u8Url,
        isM3U8: m3u8Url.includes('.m3u8'),
      },
    ],
    m3u8: m3u8Url,
    subtitles,
    thumbnails,
    intro,
    outro,
    raw: sourcesData,
  };
}

export default extractMegaPlaySources;
