import { Request, Response } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { extractEpisodes } from '../extractors/episode.extractor.js';
import { extractSearchSuggestions } from '../extractors/search.extractor.js';
import { sendSuccess, sendError } from '../utils/response.js';

interface EpisodeApiResponse {
  status: boolean;
  html?: string;
  totalItems?: number;
  message?: string;
}

export class EpisodeController {
  public async getEpisodes(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      sendError(res, 'Anime ID is required', 400);
      return;
    }

    // Support both numeric IDs ('1', '10492') and full slugs ('one-piece-1', 'attack-on-titan-112')
    let numericId = id;
    let requestedSlugTitle: string | null = null;
    if (id.includes('-')) {
      const parts = id.split('-');
      const last = parts[parts.length - 1];
      if (/^\d+$/.test(last)) {
        numericId = last;
        requestedSlugTitle = parts.slice(0, -1).join('-').toLowerCase();
      }
    }

    try {
      console.log(`[EpisodeController] Fetching episode list for anime ID: ${numericId} (original: ${id})...`);
      let endpoint = `/api/theme/episode/list/${numericId}`;
      let data = await scraperService.fetchJson<EpisodeApiResponse>(endpoint);

      // Verify that the scraped episode HTML belongs to the requested anime title slug
      if (data?.html && requestedSlugTitle) {
        const match = data.html.match(/\/watch\/([a-zA-Z0-9-]+)-\d+\?ep=/);
        if (match && match[1]) {
          const actualSlug = match[1].toLowerCase();
          const cleanReq = requestedSlugTitle.replace(/-/g, ' ');
          const cleanAct = actualSlug.replace(/-/g, ' ');

          // Check for mismatch: e.g. "attack on titan" requested vs "hell mode..." returned
          const hasOverlap =
            cleanAct.includes(cleanReq) ||
            cleanReq.includes(cleanAct) ||
            cleanReq.split(' ').some((w) => w.length > 3 && cleanAct.includes(w));

          if (!hasOverlap) {
            console.warn(
              `[EpisodeController] Slug mismatch detected: requested "${requestedSlugTitle}" but ID ${numericId} belongs to "${actualSlug}". Auto-correcting via HiAnime search suggestions...`
            );
            try {
              const searchEndpoint = `/api/theme/search/suggestions?keyword=${encodeURIComponent(cleanReq)}`;
              const searchData = await scraperService.fetchJson<{ status: boolean; html?: string }>(searchEndpoint);
              if (searchData?.html) {
                const parsedSuggestions = extractSearchSuggestions(searchData.html, cleanReq);
                const matched =
                  parsedSuggestions.suggestions?.find(
                    (s: any) =>
                      s.id?.toLowerCase().includes(requestedSlugTitle!) ||
                      s.name?.toLowerCase().includes(cleanReq)
                  ) || parsedSuggestions.suggestions?.[0];

                if (matched?.id) {
                  const sParts = matched.id.split('-');
                  const correctedNum = sParts[sParts.length - 1];
                  if (/^\d+$/.test(correctedNum) && correctedNum !== numericId) {
                    console.log(
                      `[EpisodeController] Auto-corrected HiAnime ID from ${numericId} to ${correctedNum} (${matched.id})`
                    );
                    numericId = correctedNum;
                    endpoint = `/api/theme/episode/list/${numericId}`;
                    const correctedData = await scraperService.fetchJson<EpisodeApiResponse>(endpoint);
                    if (correctedData?.html) {
                      data = correctedData;
                    }
                  }
                }
              }
            } catch (resolveErr) {
              console.warn(`[EpisodeController] Auto-correction lookup failed for "${requestedSlugTitle}":`, resolveErr);
            }
          }
        }
      }

      if (!data || !data.html) {
        sendError(res, `Failed to retrieve episodes for anime ID: ${numericId}`, 404, data?.message);
        return;
      }

      const extracted = extractEpisodes(data.html, numericId);
      sendSuccess(res, extracted);
    } catch (error) {
      console.error(`[EpisodeController] Error fetching episodes for ${numericId}:`, error);
      sendError(res, `Failed to scrap episodes for anime ID: ${numericId}`, 500, error);
    }
  }
}

export const episodeController = new EpisodeController();
export default episodeController;
