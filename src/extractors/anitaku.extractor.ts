import type {
  AnitakuStreamResponse,
  AnitakuSource,
  SubtitleTrack,
  SkipInterval,
} from '../types/anime.js';
import {
  VIDNEST_API_BASE,
  generateStreamNonce,
  decryptVidNestCipher,
  buildProxyUrl,
} from './vidnest.common.js';

export const ANITAKU_HEADERS: Record<string, string> = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0',
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.5',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
  origin: 'https://anitaku.to',
  referer: 'https://anitaku.to/',
};

export async function fetchAnitakuStream(
  anilistId: string | number,
  episode: string | number,
  subOrDub: 'sub' | 'dub' = 'sub'
): Promise<AnitakuStreamResponse> {
  const idStr = String(anilistId).trim();
  const epStr = String(episode).trim();
  const cat = subOrDub.toLowerCase() === 'dub' ? 'dub' : 'sub';

  const nonce = generateStreamNonce();
  const targetUrl = `${VIDNEST_API_BASE}/hianime/anime/${idStr}/${epStr}/${cat}/hd-2?_n=${encodeURIComponent(
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
      `Anitaku server returned HTTP ${response.status} for anilistId: ${idStr}, ep: ${epStr}, type: ${cat}`
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
      `No video sources found in Anitaku response for anilistId: ${idStr}, ep: ${epStr}`
    );
  }

  const primarySource =
    sourcesList.find(
      (item: any) =>
        (item.server === 'HD-2' || item.quality === 'HD') && (item.file || item.url)
    ) ||
    sourcesList.find((item: any) => item.file || item.url) ||
    sourcesList[0];

  const primaryUrl = primarySource?.file || primarySource?.url || '';
  if (!primaryUrl) {
    throw new Error(`Invalid source URL received from Anitaku server`);
  }

  const formattedSources: AnitakuSource[] = sourcesList
    .filter((item: any) => item.file || item.url)
    .map((item: any) => {
      const rawUrl = item.file || item.url;
      return {
        url: rawUrl,
        proxyUrl: buildProxyUrl(rawUrl, ANITAKU_HEADERS),
        isM3U8: rawUrl.includes('.m3u8'),
        quality: item.quality || item.label || 'auto',
        server: item.server || 'HD-2 (Anitaku)',
      };
    });

  // Extract subtitles / tracks
  const rawTracks = payload.tracks || payload.subtitles || [];
  const subtitles: SubtitleTrack[] = Array.isArray(rawTracks)
    ? rawTracks
        .filter((t: any) => t.kind !== 'thumbnails')
        .map((t: any) => ({
          lang: t.label || t.lang || 'unknown',
          label: t.label || t.lang || 'Subtitles',
          default: !!t.default,
          src: t.file || t.url || '',
        }))
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
    server: 'anitaku',
    sources: formattedSources,
    m3u8: primaryUrl,
    proxyM3U8: buildProxyUrl(primaryUrl, ANITAKU_HEADERS),
    headers: ANITAKU_HEADERS,
    subtitles,
    intro,
    outro,
    raw: payload,
  };
}

export default fetchAnitakuStream;
