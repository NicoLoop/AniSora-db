import type {
  AniwaveStreamResponse,
  AniwaveSource,
  SubtitleTrack,
  SkipInterval,
} from '../types/anime.js';
import {
  VIDNEST_API_BASE,
  generateStreamNonce,
  decryptVidNestCipher,
  buildProxyUrl,
} from './vidnest.common.js';

export const DEFAULT_ANIWAVE_REFERER = 'https://play.echovideo.ru/';

export function getAniwaveHeaders(referer: string = DEFAULT_ANIWAVE_REFERER): Record<string, string> {
  return {
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    accept: '*/*',
    'accept-language': 'en-US,en;q=0.5',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    referer,
  };
}

export async function fetchAniwaveStream(
  anilistId: string | number,
  episode: string | number,
  subOrDub: 'sub' | 'dub' = 'sub'
): Promise<AniwaveStreamResponse> {
  const idStr = String(anilistId).trim();
  const epStr = String(episode).trim();
  const cat = subOrDub.toLowerCase() === 'dub' ? 'dub' : 'sub';

  const nonce = generateStreamNonce();
  const targetUrl = `${VIDNEST_API_BASE}/aniwave_hls/${idStr}/${epStr}/${cat}?_n=${encodeURIComponent(
    nonce
  )}`;

  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://vidnest.fun/',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Aniwave server returned HTTP ${response.status} for anilistId: ${idStr}, ep: ${epStr}, type: ${cat}`
    );
  }

  const rawJson = (await response.json()) as any;
  let payload = rawJson;

  if (rawJson?.v === 2 && rawJson?.d && rawJson?.n) {
    payload = await decryptVidNestCipher(rawJson.d, rawJson.n);
  }

  const sourcesList = payload?.sources || payload?.multiSrc || [];
  if (!Array.isArray(sourcesList) || sourcesList.length === 0) {
    throw new Error(
      `No video sources found in Aniwave response for anilistId: ${idStr}, ep: ${epStr}`
    );
  }

  const primarySource =
    sourcesList.find((item: any) => item.file || item.url) || sourcesList[0];

  const primaryUrl = primarySource?.file || primarySource?.url || '';
  if (!primaryUrl) {
    throw new Error(`Invalid source URL received from Aniwave server`);
  }

  const referer = primarySource?.referer || DEFAULT_ANIWAVE_REFERER;
  const headers = getAniwaveHeaders(referer);

  const formattedSources: AniwaveSource[] = sourcesList
    .filter((item: any) => item.file || item.url)
    .map((item: any) => {
      const rawUrl = item.file || item.url;
      const itemReferer = item.referer || referer;
      const itemHeaders = getAniwaveHeaders(itemReferer);
      return {
        url: rawUrl,
        proxyUrl: buildProxyUrl(rawUrl, itemHeaders),
        isM3U8: rawUrl.includes('.m3u8'),
        quality: item.quality || item.label || 'auto',
        server: item.server || 'Vidplay (Aniwave)',
      };
    });

  // Extract subtitles
  const rawSubtitles = payload.subtitles || payload.tracks || [];
  const subtitles: SubtitleTrack[] = Array.isArray(rawSubtitles)
    ? rawSubtitles
        .filter((t: any) => t.kind !== 'thumbnails')
        .map((t: any, idx: number) => {
          const fileUrl = t.file || t.url || '';
          return {
            lang: t.lang || t.label || `Subtitle ${idx + 1}`,
            label: t.label || t.lang || `Subtitle ${idx + 1}`,
            default: idx === 0,
            src: fileUrl,
          };
        })
    : [];

  let intro: SkipInterval | null = null;
  if (
    payload.intro &&
    typeof payload.intro.start === 'number' &&
    typeof payload.intro.end === 'number' &&
    payload.intro.end > payload.intro.start
  ) {
    intro = {
      start: payload.intro.start,
      end: payload.intro.end,
    };
  }

  let outro: SkipInterval | null = null;
  if (
    payload.outro &&
    typeof payload.outro.start === 'number' &&
    typeof payload.outro.end === 'number' &&
    payload.outro.end > payload.outro.start
  ) {
    outro = {
      start: payload.outro.start,
      end: payload.outro.end,
    };
  }

  return {
    anilistId: idStr,
    episode: epStr,
    subOrDub: cat,
    server: 'aniwave',
    sources: formattedSources,
    m3u8: primaryUrl,
    proxyM3U8: buildProxyUrl(primaryUrl, headers),
    headers,
    subtitles,
    intro,
    outro,
    raw: payload,
  };
}

export default fetchAniwaveStream;
