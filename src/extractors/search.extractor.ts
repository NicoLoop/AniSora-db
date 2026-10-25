import * as cheerio from 'cheerio';
import type { SearchSuggestionsData, SearchSuggestionItem } from '../types/anime.js';
import { extractAnimeId } from './home.extractor.js';

export function extractSearchSuggestions(html: string, keyword: string): SearchSuggestionsData {
  const $ = cheerio.load(html);
  const suggestions: SearchSuggestionItem[] = [];

  $('a.nav-item').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href') || '';

    // Ignore the "View all results" link
    if (href.includes('/browse?keyword=')) {
      return;
    }

    const titleEl = $a.find('.film-name');
    const name = titleEl.text().trim();
    if (!name) return;

    const jname = titleEl.attr('data-jname') || null;
    const id = extractAnimeId(href);
    const poster =
      $a.find('.film-poster img').attr('data-src') ||
      $a.find('.film-poster img').attr('src') ||
      null;

    const rawInfo = $a.find('.film-infor').text();
    const moreInfo = rawInfo
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    suggestions.push({
      id,
      name,
      jname,
      poster,
      moreInfo,
    });
  });

  return {
    keyword,
    suggestions,
  };
}

export default extractSearchSuggestions;
