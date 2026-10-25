import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractSearchSuggestions } from '../extractors/search.extractor.js';
import { extractListingPage } from '../extractors/list.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { buildFilterParams, FILTER_OPTIONS } from '../utils/filter.js';

interface SuggestionsApiResponse {
  success: boolean;
  html?: string;
}

export class SearchController {
  public async getSuggestions(req: Request, res: Response): Promise<void> {
    const rawKeyword = req.query.keyword || req.query.q;
    const keyword = typeof rawKeyword === 'string' ? rawKeyword.trim() : '';

    if (!keyword) {
      sendError(res, 'keyword is required as a query parameter (?keyword=...)', 400);
      return;
    }

    try {
      console.log(`[SearchController] Fetching search suggestions for: "${keyword}"...`);
      const endpoint = `/api/theme/search/suggestions?keyword=${encodeURIComponent(keyword)}`;
      const data = await scraperService.fetchJson<SuggestionsApiResponse>(endpoint);

      if (!data || !data.html) {
        sendSuccess(res, { keyword, suggestions: [] });
        return;
      }

      const suggestions = extractSearchSuggestions(data.html, keyword);
      sendSuccess(res, suggestions);
    } catch (error) {
      console.error(`[SearchController] Error fetching suggestions for "${keyword}":`, error);
      sendError(res, `Failed to retrieve suggestions for keyword "${keyword}"`, 500, error);
    }
  }

  public async searchAnime(req: Request, res: Response): Promise<void> {
    const parsed = buildFilterParams(req.query);

    if (!parsed.filters.keyword) {
      sendError(
        res,
        'keyword is required as a query parameter (?keyword=...). To filter without keyword, use /api/v1/hianime/filter',
        400
      );
      return;
    }

    try {
      console.log(`[SearchController] Searching anime with query: "${parsed.queryString}"...`);
      const endpoint = `/filter?${parsed.queryString}`;
      const html = await scraperService.fetchHtml(endpoint);
      const listing = extractListingPage(html, parsed.page);

      sendSuccess(res, {
        keyword: parsed.filters.keyword,
        filters: parsed.filters,
        ...listing,
      });
    } catch (error) {
      console.error(`[SearchController] Error searching anime for "${parsed.filters.keyword}":`, error);
      sendError(res, `Failed to search anime for "${parsed.filters.keyword}"`, 500, error);
    }
  }

  public async filterAnime(req: Request, res: Response): Promise<void> {
    const parsed = buildFilterParams(req.query);

    try {
      console.log(`[SearchController] Filtering anime with parameters: "${parsed.queryString}"...`);
      const endpoint = `/filter?${parsed.queryString}`;
      const html = await scraperService.fetchHtml(endpoint);
      const listing = extractListingPage(html, parsed.page);

      sendSuccess(res, {
        filters: parsed.filters,
        ...listing,
      });
    } catch (error) {
      console.error('[SearchController] Error filtering anime:', error);
      sendError(res, 'Failed to filter anime with specified criteria', 500, error);
    }
  }

  public async getFilterOptions(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, FILTER_OPTIONS);
  }

  /**
   * Fast sync endpoint for localdb enrichment:
   * Directly uses HiAnime search without calling AniList or fetching full details.
   * Matches anime name, falls back to synonyms and full search if needed.
   */
  public async syncLocalDb(req: Request, res: Response): Promise<void> {
    const rawName =
      req.body?.name ||
      req.body?.title ||
      req.body?.animeName ||
      req.query.name ||
      req.query.title ||
      req.query.keyword ||
      req.query.q;

    const name = typeof rawName === 'string' ? rawName.trim() : '';

    let rawSynonyms = req.body?.synonyms || req.query.synonyms;
    let synonyms: string[] = [];

    if (Array.isArray(rawSynonyms)) {
      synonyms = rawSynonyms.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof rawSynonyms === 'string') {
      try {
        const parsed = JSON.parse(rawSynonyms);
        if (Array.isArray(parsed)) {
          synonyms = parsed.map((s) => String(s).trim()).filter(Boolean);
        } else {
          synonyms = rawSynonyms.split(',').map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        synonyms = rawSynonyms.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    if (!name && synonyms.length === 0) {
      sendError(
        res,
        'Anime name or title is required (via ?name=... or in JSON body {"title": "..."})',
        400
      );
      return;
    }

    // Build candidates list: primary name first, then unique synonyms
    const candidates: string[] = [];
    if (name) candidates.push(name);
    for (const syn of synonyms) {
      if (syn && !candidates.some((c) => c.toLowerCase() === syn.toLowerCase())) {
        candidates.push(syn);
      }
    }

    try {
      // 1. Try search suggestions for each candidate (fastest)
      for (const query of candidates) {
        try {
          const endpoint = `/api/theme/search/suggestions?keyword=${encodeURIComponent(query)}`;
          const data = await scraperService.fetchJson<SuggestionsApiResponse>(endpoint);

          if (data && data.html) {
            const result = extractSearchSuggestions(data.html, query);
            if (result.suggestions && result.suggestions.length > 0) {
              const queryLower = query.toLowerCase();
              const exactMatch = result.suggestions.find(
                (s) =>
                  s.name.toLowerCase() === queryLower ||
                  (s.jname && s.jname.toLowerCase() === queryLower)
              );
              const matched = exactMatch || result.suggestions[0];

              sendSuccess(res, {
                id: matched.id,
                hianimeId: matched.id,
              });
              return;
            }
          }
        } catch (err) {
          console.warn(
            `[SearchController] Suggestion search failed for "${query}":`,
            err instanceof Error ? err.message : err
          );
        }
      }

      // 2. Fallback to full search for candidate queries (up to top 3)
      for (const query of candidates.slice(0, 3)) {
        try {
          const searchUrl = `/search?keyword=${encodeURIComponent(query)}`;
          const html = await scraperService.fetchHtml(searchUrl);
          const listing = extractListingPage(html, 1);

          if (listing.animes && listing.animes.length > 0) {
            const queryLower = query.toLowerCase();
            const exactMatch = listing.animes.find(
              (a) =>
                a.name.toLowerCase() === queryLower ||
                (a.jname && a.jname.toLowerCase() === queryLower)
            );
            const matched = exactMatch || listing.animes[0];

            sendSuccess(res, {
              id: matched.id,
              hianimeId: matched.id,
            });
            return;
          }
        } catch (err) {
          console.warn(
            `[SearchController] Full search failed for "${query}":`,
            err instanceof Error ? err.message : err
          );
        }
      }

      // No match found
      sendSuccess(res, {
        id: null,
        hianimeId: null,
      });
    } catch (error) {
      console.error(`[SearchController] Error in syncLocalDb for "${name}":`, error);
      sendError(res, error instanceof Error ? error.message : 'Failed to search anime', 500, error);
    }
  }

  /**
   * Alias for searching and returning only the matched HiAnime ID
   */
  public async searchMatchedId(req: Request, res: Response): Promise<void> {
    return this.syncLocalDb(req, res);
  }
}

export const searchController = new SearchController();
export default searchController;
