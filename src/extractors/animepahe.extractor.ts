import type {
  AnimePaheStreamResponse,
  AnimePaheSource,
  SubtitleTrack,
  SkipInterval,
} from '../types/anime.js';

const VIDNEST_ENC_KEY = 'K3p8vQ2mX9rL5wZ0fN7bG1sH4tJ6dC9_y8S3wM1nQ5pL2';
const VIDNEST_API_BASE = 'https://new.vidnest.fun';
const VIDNEST_PROXY_BASE = 'https://upcloud.animanga.fun';

const STREAM_HEADERS: Record<string, string> = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0',
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.5',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
  origin: 'https://megaplay.buzz',
  referer: 'https://megaplay.buzz/',
};

export function generateStreamNonce(): string {
  const nonceBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(nonceBytes);
  let binary = '';
  for (let i = 0; i < nonceBytes.length; i++) {
    binary += String.fromCharCode(nonceBytes[i]);
  }
  return Buffer.from(binary, 'binary')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function buildProxyUrl(streamUrl: string, headers: Record<string, string> = STREAM_HEADERS): string {
  if (!streamUrl) return '';
  const params = new URLSearchParams();
  params.set('url', streamUrl);
  params.set('headers', JSON.stringify(headers));
  return `${VIDNEST_PROXY_BASE}/proxy?${params.toString()}`;
}

export async function decryptVidNestCipher(ciphertext: string, nonce: string): Promise<any> {
  const enc = new TextEncoder().encode(`${nonce}|${VIDNEST_ENC_KEY}`);
  const hash = await globalThis.crypto.subtle.digest('SHA-256', enc);
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    hash,
    'AES-GCM',
    false,
    ['decrypt']
  );

  let b64 = ciphertext.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  const buf = Buffer.from(b64, 'base64');
  const bytes = new Uint8Array(buf);

  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);

  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  const decoded = new TextDecoder().decode(decrypted);

  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}

export async function fetchAnimePaheStream(
  anilistId: string | number,
  episode: string | number,
  subOrDub: 'sub' | 'dub' = 'sub'
): Promise<AnimePaheStreamResponse> {
  const idStr = String(anilistId).trim();
  const epStr = String(episode).trim();
  const cat = subOrDub.toLowerCase() === 'dub' ? 'dub' : 'sub';

  const candidateServers = [
    {
      name: 'hianime',
      url: `${VIDNEST_API_BASE}/hianime/anime/${idStr}/${epStr}/${cat}/hd-2`,
    },
    {
      name: 'aniwave',
      url: `${VIDNEST_API_BASE}/aniwave_hls/${idStr}/${epStr}/${cat}`,
    },
    {
      name: 'megaplay',
      url: `${VIDNEST_API_BASE}/animehub/${idStr}/${epStr}/${cat}`,
    },
  ];

  let lastError: Error | null = null;

  for (const s of candidateServers) {
    try {
      const nonce = generateStreamNonce();
      const sep = s.url.includes('?') ? '&' : '?';
      const targetUrl = `${s.url}${sep}_n=${encodeURIComponent(nonce)}`;

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://vidnest.fun/',
        },
      });

      if (!response.ok) {
        throw new Error(`Server ${s.name} returned status ${response.status}`);
      }

      const rawJson = (await response.json()) as any;
      let payload = rawJson;

      if (rawJson?.v === 2 && rawJson?.d && rawJson?.n) {
        payload = await decryptVidNestCipher(rawJson.d, rawJson.n);
      }

      const sourcesList = payload?.sources || payload?.multiSrc || [];
      if (!Array.isArray(sourcesList) || sourcesList.length === 0) {
        throw new Error(`No video sources returned from server ${s.name}`);
      }

      const primarySource =
        sourcesList.find((item: any) => item.file || item.url) || sourcesList[0];
      const primaryUrl = primarySource?.file || primarySource?.url || '';

      if (!primaryUrl) {
        throw new Error(`Invalid source URL from server ${s.name}`);
      }

      const formattedSources: AnimePaheSource[] = sourcesList
        .filter((item: any) => item.file || item.url)
        .map((item: any) => {
          const rawUrl = item.file || item.url;
          return {
            url: rawUrl,
            proxyUrl: buildProxyUrl(rawUrl, STREAM_HEADERS),
            isM3U8: rawUrl.includes('.m3u8'),
            quality: item.quality || item.label || 'auto',
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

      // Extract intro / outro
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
        server: s.name,
        sources: formattedSources,
        m3u8: primaryUrl,
        proxyM3U8: buildProxyUrl(primaryUrl, STREAM_HEADERS),
        headers: STREAM_HEADERS,
        subtitles,
        intro,
        outro,
        raw: payload,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[AnimePaheExtractor] Server ${s.name} failed:`, lastError.message);
    }
  }

  throw new Error(
    `Failed to extract stream for AnimePahe anilistId: ${idStr}, ep: ${epStr}, type: ${cat}. ${lastError?.message || ''}`
  );
}

export default fetchAnimePaheStream;
