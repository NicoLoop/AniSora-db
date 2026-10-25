import axios, { AxiosInstance } from 'axios';
import config from '../config/config.js';

export class ScraperService {
  private activeBaseUrl: string;

  constructor() {
    this.activeBaseUrl = config.baseUrl;
  }

  public getActiveBaseUrl(): string {
    return this.activeBaseUrl;
  }

  public getMirrors(): string[] {
    return config.mirrors;
  }

  public getAllHosts(): string[] {
    return config.getAllHosts();
  }

  public setActiveBaseUrl(url: string): void {
    const clean = url.replace(/\/+$/, '');
    this.activeBaseUrl = clean;
  }

  /**
   * Returns ordered list of candidate hosts to attempt:
   * 1. Currently active working baseUrl
   * 2. Remaining mirrors in order
   */
  private getCandidateHosts(): string[] {
    const all = config.getAllHosts();
    const ordered = [this.activeBaseUrl, ...all.filter((h) => h !== this.activeBaseUrl)];
    return Array.from(new Set(ordered));
  }

  public async fetchHtml(endpoint: string = '/home'): Promise<string> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const candidates = this.getCandidateHosts();
    let lastError: Error | null = null;

    for (let i = 0; i < candidates.length; i++) {
      const host = candidates[i];
      const fullUrl = `${host}${cleanEndpoint}`;

      try {
        const response = await axios.get(fullUrl, {
          headers: {
            ...config.headers,
            Referer: `${host}/`,
          },
          timeout: config.timeout,
        });

        if (response.data && typeof response.data === 'string') {
          if (host !== this.activeBaseUrl) {
            console.log(
              `[ScraperService] Failover succeeded! Switched active mirror from ${this.activeBaseUrl} to ${host}`
            );
            this.activeBaseUrl = host;
          }
          return response.data;
        }

        throw new Error('Received non-string or empty HTML response');
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[ScraperService] Mirror ${host} failed for ${cleanEndpoint}: ${lastError.message}. Trying next mirror...`
        );
      }
    }

    throw new Error(
      `Failed to fetch HTML for ${cleanEndpoint} from main (${config.baseUrl}) and mirrors (${config.mirrors.join(', ')}): ${lastError?.message}`
    );
  }

  public async fetchWithFinalUrl(
    endpoint: string,
    customHeaders: Record<string, string> = {}
  ): Promise<{ data: string; finalUrl: string }> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const candidates = this.getCandidateHosts();
    let lastError: Error | null = null;

    for (let i = 0; i < candidates.length; i++) {
      const host = candidates[i];
      const fullUrl = `${host}${cleanEndpoint}`;

      try {
        const response = await axios.get(fullUrl, {
          headers: {
            ...config.headers,
            Referer: `${host}/`,
            ...customHeaders,
          },
          maxRedirects: 5,
          timeout: config.timeout,
        });

        const finalUrl =
          (response.request?.res?.responseUrl as string) || response.config.url || fullUrl;

        if (response.data && typeof response.data === 'string') {
          if (host !== this.activeBaseUrl) {
            console.log(
              `[ScraperService] Failover succeeded! Switched active mirror from ${this.activeBaseUrl} to ${host}`
            );
            this.activeBaseUrl = host;
          }
          return { data: response.data, finalUrl };
        }

        throw new Error('Received non-string or empty HTML response');
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[ScraperService] Mirror ${host} failed for finalUrl ${cleanEndpoint}: ${lastError.message}. Trying next mirror...`
        );
      }
    }

    throw new Error(
      `Failed to fetch from all mirrors for ${cleanEndpoint}: ${lastError?.message}`
    );
  }

  public async fetchJson<T = any>(
    endpoint: string,
    customHeaders: Record<string, string> = {}
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const candidates = this.getCandidateHosts();
    let lastError: Error | null = null;

    for (let i = 0; i < candidates.length; i++) {
      const host = candidates[i];
      const fullUrl = `${host}${cleanEndpoint}`;

      try {
        const response = await axios.get(fullUrl, {
          headers: {
            ...config.headers,
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json, text/javascript, */*; q=0.01',
            Referer: `${host}/`,
            ...customHeaders,
          },
          timeout: config.timeout,
        });

        if (response.data) {
          if (host !== this.activeBaseUrl) {
            console.log(
              `[ScraperService] Failover succeeded! Switched active mirror from ${this.activeBaseUrl} to ${host}`
            );
            this.activeBaseUrl = host;
          }
          return response.data as T;
        }

        throw new Error('Received empty response body');
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[ScraperService] Mirror ${host} failed for JSON ${cleanEndpoint}: ${lastError.message}. Trying next mirror...`
        );
      }
    }

    throw new Error(
      `Failed to fetch JSON for ${cleanEndpoint} from all mirrors: ${lastError?.message}`
    );
  }

  public async fetchDirect(
    url: string,
    customHeaders: Record<string, string> = {}
  ): Promise<string> {
    const retries = config.retries;
    let lastError: Error | null = null;

    // Check if the URL points to one of the known HiAnime domains
    const isHiAnimeUrl =
      config.getAllHosts().some((h) => url.startsWith(h)) || url.includes('hianime');

    if (isHiAnimeUrl) {
      const candidates = this.getCandidateHosts();
      for (let i = 0; i < candidates.length; i++) {
        const host = candidates[i];
        let candidateUrl = url;

        try {
          const parsed = new URL(url);
          const candidateParsed = new URL(host);
          parsed.protocol = candidateParsed.protocol;
          parsed.host = candidateParsed.host;
          candidateUrl = parsed.toString();
        } catch {
          // ignore
        }

        try {
          const response = await axios.get(candidateUrl, {
            headers: {
              ...config.headers,
              Referer: `${host}/`,
              ...customHeaders,
            },
            timeout: config.timeout,
          });

          if (response.data) {
            if (host !== this.activeBaseUrl) {
              this.activeBaseUrl = host;
            }
            if (typeof response.data === 'string') return response.data;
            if (typeof response.data === 'object') return JSON.stringify(response.data);
            return String(response.data);
          }
          throw new Error('Received empty response body');
        } catch (err: unknown) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(
            `[ScraperService] fetchDirect mirror ${candidateUrl} failed: ${lastError.message}. Trying next mirror...`
          );
        }
      }

      throw new Error(`Failed to fetch from ${url} across all mirrors: ${lastError?.message}`);
    }

    // For third-party URLs (e.g., megaplay.buzz, zokoanime.video)
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(url, {
          headers: {
            ...config.headers,
            Referer: `${this.activeBaseUrl}/`,
            ...customHeaders,
          },
          timeout: config.timeout,
        });

        if (response.data) {
          if (typeof response.data === 'string') {
            return response.data;
          }
          if (typeof response.data === 'object') {
            return JSON.stringify(response.data);
          }
          return String(response.data);
        }

        throw new Error('Received empty response body');
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[ScraperService] fetchDirect attempt ${attempt}/${retries} failed for ${url}: ${lastError.message}`
        );

        if (attempt < retries) {
          const delay = 1000 * attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to fetch from ${url} after ${retries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Pings all configured mirrors and reports status and latency
   */
  public async checkMirrors(): Promise<
    Array<{ host: string; status: number | null; ok: boolean; latency: number; error?: string }>
  > {
    const hosts = config.getAllHosts();
    const results = await Promise.all(
      hosts.map(async (host) => {
        const start = Date.now();
        try {
          const res = await axios.get(`${host}/home`, {
            headers: config.headers,
            timeout: 8000,
          });
          return {
            host,
            status: res.status,
            ok: res.status === 200,
            latency: Date.now() - start,
          };
        } catch (err: any) {
          return {
            host,
            status: err.response?.status || null,
            ok: false,
            latency: Date.now() - start,
            error: err.message,
          };
        }
      })
    );
    return results;
  }

  /**
   * Resolves an episode identifier (which might be a compound slug like 'one-piece-1?ep=1',
   * 'attack-on-titan-112?ep=3086', 'attack-on-titan-112', or a raw data-id '3086')
   * to the exact numeric HiAnime data-id required by /api/theme/episode/servers and /api/theme/episode/downloads.
   */
  public async resolveEpisodeDataId(episodeId: string, episodeNumber?: number): Promise<string> {
    const trimmed = (episodeId || '').trim();
    if (!trimmed) return trimmed;

    // If it's already purely digits and no question mark or hyphens, return it directly if no episodeNumber override is requested
    if (/^\d+$/.test(trimmed) && episodeNumber === undefined) {
      return trimmed;
    }

    let slug = trimmed;
    let epPart: string | null = null;

    if (trimmed.includes('?ep=')) {
      const parts = trimmed.split('?ep=');
      slug = parts[0];
      epPart = parts[1];
    } else if (trimmed.includes('?')) {
      const parts = trimmed.split('?');
      slug = parts[0];
      const searchParams = new URLSearchParams(parts[1]);
      epPart = searchParams.get('ep');
    }

    const targetEpNum = episodeNumber ?? (epPart && /^\d+$/.test(epPart) ? parseInt(epPart, 10) : 1);

    const slugParts = slug.split('-');
    const lastPart = slugParts[slugParts.length - 1];
    const queryId = /^\d+$/.test(lastPart) ? lastPart : slug;

    try {
      const listRes = await this.fetchJson<{ status: boolean; html?: string }>(
        `/api/theme/episode/list/${encodeURIComponent(queryId)}`
      );

      if (listRes?.html) {
        if (epPart && /^\d+$/.test(epPart)) {
          const directDataIdRegex = new RegExp(`data-id=["']${epPart}["']`, 'i');
          if (directDataIdRegex.test(listRes.html)) {
            return epPart;
          }
        }

        const numRegex = new RegExp(`data-number=["']${targetEpNum}["'][^>]*data-id=["'](\\d+)["']`, 'i');
        const altRegex = new RegExp(`data-id=["'](\\d+)["'][^>]*data-number=["']${targetEpNum}["']`, 'i');
        const match = listRes.html.match(numRegex) || listRes.html.match(altRegex);
        if (match && match[1]) {
          return match[1];
        }

        const firstMatch = listRes.html.match(/data-id=["'](\\d+)["']/i);
        if (firstMatch && firstMatch[1]) {
          return firstMatch[1];
        }
      }
    } catch (err) {
      console.warn(`[ScraperService] Failed to resolve data-id for ${trimmed}:`, err);
    }

    if (epPart && /^\d+$/.test(epPart)) return epPart;
    return trimmed;
  }
}

export const scraperService = new ScraperService();
export default scraperService;
