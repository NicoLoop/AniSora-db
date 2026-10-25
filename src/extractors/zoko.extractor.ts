import type { ZokoStreamResponse, SubtitleTrack, SkipInterval } from '../types/anime.js';

const OBF_KEY = 'otaku-embed-v1';

function xor(str: string): string {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    out += String.fromCharCode(str.charCodeAt(i) ^ OBF_KEY.charCodeAt(i % OBF_KEY.length));
  }
  return out;
}

export function deobfuscateZokoBlob(blob: string): Record<string, any> {
  const binary = Buffer.from(blob, 'base64').toString('binary');
  const unxored = xor(binary);
  const jsonStr = Buffer.from(unxored, 'binary').toString('utf-8');
  return JSON.parse(jsonStr);
}

export function extractZokoStream(html: string, streamingLink: string): ZokoStreamResponse {
  const match = html.match(/window\.__P\s*=\s*"([^"]+)"/);
  if (!match || !match[1]) {
    throw new Error('Unable to find window.__P player payload in ZokoAnime page');
  }

  const rawData = deobfuscateZokoBlob(match[1]);

  const m3u8Url = rawData.src || '';

  const subtitles: SubtitleTrack[] = Array.isArray(rawData.subtitles)
    ? rawData.subtitles.map((s: any) => ({
        lang: s.lang || s.label || 'unknown',
        label: s.label || s.lang || 'Unknown',
        default: !!s.default,
        src: s.src || '',
      }))
    : [];

  let intro: SkipInterval | null = null;
  if (rawData.skip && rawData.skip.intro && typeof rawData.skip.intro.start === 'number') {
    intro = {
      start: rawData.skip.intro.start,
      end: rawData.skip.intro.end,
    };
  }

  let outro: SkipInterval | null = null;
  if (rawData.skip && rawData.skip.outro && typeof rawData.skip.outro.start === 'number') {
    outro = {
      start: rawData.skip.outro.start,
      end: rawData.skip.outro.end,
    };
  }

  let downloadUrl: string | null = null;
  if (rawData.download_url) {
    downloadUrl = rawData.download_url.startsWith('http')
      ? rawData.download_url
      : `https://zokoanime.video${rawData.download_url}`;
  }

  return {
    streamingLink,
    sources: [
      {
        url: m3u8Url,
        isM3U8: m3u8Url.includes('.m3u8'),
      },
    ],
    m3u8: m3u8Url,
    subtitles,
    intro,
    outro,
    downloadUrl,
    raw: rawData,
  };
}

export default extractZokoStream;
