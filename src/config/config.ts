import dotenv from 'dotenv';

dotenv.config();

const rawMirrors = process.env.MIRRORS || process.env.MIRROR_URLS || '';
const parsedMirrors = rawMirrors
  ? rawMirrors
      .split(',')
      .map((m) => m.trim().replace(/\/+$/, ''))
      .filter(Boolean)
  : [
      'https://hianime.ba',
      'https://hianime.gy',
      'https://hianime.lu',
      'https://hianime.tr',
      'https://hianimetv.bz',
    ];

const rawBaseUrl = process.env.BASE_URL?.replace(/\/+$/, '') || 'https://hianime.at';

export const config = {
  port: Number(process.env.PORT) || 4000,
  baseUrl: rawBaseUrl,
  mirrors: parsedMirrors,
  getAllHosts(): string[] {
    const list = [this.baseUrl, ...this.mirrors];
    return Array.from(new Set(list));
  },
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  },
  timeout: 15000,
  retries: 3,
};

export default config;
