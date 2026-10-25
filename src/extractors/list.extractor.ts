import * as cheerio from 'cheerio';
import type { AnimeCard, AnimeEpisodes, PaginatedAnimeList } from '../types/anime.js';
import { extractAnimeId } from './home.extractor.js';

function parseEpisodeNumber(text?: string | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

export function extractAnimeCards(
  $: cheerio.CheerioAPI,
  container: cheerio.Cheerio<any>
): AnimeCard[] {
  const cards: AnimeCard[] = [];

  container.find('.flw-item').each((_, el) => {
    const $item = $(el);
    const titleLink = $item.find('.film-name a, .dynamic-name');
    const name = titleLink.attr('title') || titleLink.text().trim();
    const jname = titleLink.attr('data-jname') || null;
    const id =
      extractAnimeId(titleLink.attr('href')) ||
      $item.find('.film-poster-ahref').attr('data-id') ||
      '';

    const poster =
      $item.find('.film-poster img').attr('data-src') ||
      $item.find('.film-poster img').attr('src') ||
      null;

    const type = $item.find('.fd-infor .fdi-item').first().text().trim() || null;
    const duration = $item.find('.fd-infor .fdi-duration').text().trim() || null;

    const episodes: AnimeEpisodes = {
      sub: parseEpisodeNumber($item.find('.tick-sub').text()),
      dub: parseEpisodeNumber($item.find('.tick-dub').text()),
      eps:
        parseEpisodeNumber($item.find('.tick-eps').text()) ||
        parseEpisodeNumber($item.find('.tick-sub').text()),
    };

    if (id || name) {
      cards.push({
        id,
        name,
        jname,
        poster,
        type,
        duration,
        episodes,
      });
    }
  });

  return cards;
}

export function extractPagination(
  $: cheerio.CheerioAPI,
  requestedPage: number = 1
): { currentPage: number; totalPages: number; hasNextPage: boolean } {
  let currentPage = requestedPage;
  let totalPages = requestedPage;

  const activePageText = $('.pagination .page-item.active').text().trim();
  if (activePageText) {
    const parsedActive = parseInt(activePageText, 10);
    if (!isNaN(parsedActive)) {
      currentPage = parsedActive;
    }
  }

  // Scan all page numbers in pagination
  $('.pagination .page-item a').each((_, a) => {
    const text = $(a).text().trim();
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > totalPages) {
      totalPages = num;
    }
  });

  // Check if there is a next page icon (› or »)
  const hasNextArrow =
    $('.pagination .page-item a[title*="Next"]').length > 0 ||
    $('.pagination .page-item:contains("›"), .pagination .page-item:contains("»")').length > 0;

  const hasNextPage = hasNextArrow || currentPage < totalPages;

  return {
    currentPage,
    totalPages,
    hasNextPage,
  };
}

export function extractListingPage(html: string, requestedPage: number = 1): PaginatedAnimeList {
  const $ = cheerio.load(html);
  const container = $('.film_list-wrap');
  const animes = extractAnimeCards($, container);
  const pagination = extractPagination($, requestedPage);

  return {
    ...pagination,
    animes,
  };
}

export default extractListingPage;
