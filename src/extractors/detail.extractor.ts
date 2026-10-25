import * as cheerio from 'cheerio';
import type {
  AnimeDetailsData,
  AnimeCard,
  AnimeEpisodes,
} from '../types/anime.js';
import { extractAnimeId } from './home.extractor.js';

function parseEpisodeNumber(text?: string | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

export function extractAnimeDetails(html: string, requestedId: string): AnimeDetailsData {
  const $ = cheerio.load(html);
  const detail = $('#ani_detail');

  // Title / Names
  const titleEl = detail.find('.film-name.dynamic-name');
  const name = titleEl.text().trim() || detail.find('h2.film-name').text().trim();
  const jname = titleEl.attr('data-jname') || null;

  // Poster
  const poster =
    detail.find('.film-poster img').attr('src') ||
    detail.find('.film-poster img').attr('data-src') ||
    null;

  // Description / Synopsis
  const description =
    detail.find('.film-description .text').text().trim() ||
    detail.find('.film-description').text().trim() ||
    null;

  // Stats: rating, quality, type, duration, episodes
  const tickSub = parseEpisodeNumber(detail.find('.tick-sub').text());
  const tickDub = parseEpisodeNumber(detail.find('.tick-dub').text());
  const tickEps =
    parseEpisodeNumber(detail.find('.tick-eps').text()) ||
    parseEpisodeNumber(detail.find('.tick-sub').text());

  const quality = detail.find('.tick-quality').text().trim() || detail.find('.tick .quality').text().trim() || null;
  const rating = detail.find('.tick-rate').text().trim() || detail.find('.tick-pg').text().trim() || null;

  // More info from .anisc-info (.item)
  const infoMap: Record<string, string> = {};
  const genres: string[] = [];
  const studios: string[] = [];
  const producers: string[] = [];

  detail.find('.anisc-info .item').each((_, el) => {
    const $item = $(el);
    const head = $item.find('.item-head').text().replace(':', '').trim().toLowerCase();

    if (head.includes('genre')) {
      $item.find('a').each((_, a) => {
        const g = $(a).text().trim();
        if (g && !genres.includes(g)) genres.push(g);
      });
    } else if (head.includes('studio')) {
      $item.find('a').each((_, a) => {
        const s = $(a).text().trim();
        if (s && !studios.includes(s)) studios.push(s);
      });
    } else if (head.includes('producer')) {
      $item.find('a').each((_, a) => {
        const p = $(a).text().trim();
        if (p && !producers.includes(p)) producers.push(p);
      });
    } else {
      const clone = $item.clone();
      clone.find('.item-head').remove();
      const val = clone.text().trim();
      infoMap[head] = val;
    }
  });

  const type = infoMap['type'] || null;
  const duration = infoMap['duration'] || null;

  // Extract numeric anime ID (e.g. from slug 'one-piece-1' -> '1', or watch button)
  const watchHref = detail.find('.film-buttons a.btn-play').attr('href') || '';
  let animeId = '';
  if (requestedId.includes('-')) {
    animeId = requestedId.split('-').pop() || '';
  } else if (watchHref) {
    const match = watchHref.match(/-(\d+)(?:\?|$)/);
    if (match) animeId = match[1];
  }
  if (!animeId) {
    animeId = requestedId;
  }

  // Recommended Anime (film_list-wrap .flw-item)
  const recommendedAnimes: AnimeCard[] = [];
  $('.block_area-recommend .flw-item, .block_area:contains("Recommended For You") .flw-item').each(
    (_, item) => {
      const $item = $(item);
      const link = $item.find('.film-name a, .dynamic-name');
      const itemTitle = link.attr('title') || link.text().trim();
      const itemJname = link.attr('data-jname') || null;
      const itemId = extractAnimeId(link.attr('href'));
      const itemPoster =
        $item.find('.film-poster img').attr('data-src') ||
        $item.find('.film-poster img').attr('src') ||
        null;
      const itemType = $item.find('.fd-infor .fdi-item').first().text().trim() || null;
      const itemDuration = $item.find('.fd-infor .fdi-duration').text().trim() || null;

      const episodes: AnimeEpisodes = {
        sub: parseEpisodeNumber($item.find('.tick-sub').text()),
        dub: parseEpisodeNumber($item.find('.tick-dub').text()),
        eps:
          parseEpisodeNumber($item.find('.tick-eps').text()) ||
          parseEpisodeNumber($item.find('.tick-sub').text()),
      };

      if (itemId || itemTitle) {
        recommendedAnimes.push({
          id: itemId,
          name: itemTitle,
          jname: itemJname,
          poster: itemPoster,
          type: itemType,
          duration: itemDuration,
          episodes,
        });
      }
    }
  );

  // Helper for sidebar / featured anime items (.anif-block-ul ul li or ul li)
  const parseListItems = (container: cheerio.Cheerio<any>): AnimeCard[] => {
    const cards: AnimeCard[] = [];
    container.find('ul li').each((_, li) => {
      const $li = $(li);
      const link = $li.find('.film-detail .film-name a, .film-name a');
      const itemTitle = link.attr('title') || link.text().trim();
      const itemJname = link.attr('data-jname') || null;
      const itemId = extractAnimeId(link.attr('href'));
      const itemPoster =
        $li.find('.film-poster img').attr('data-src') ||
        $li.find('.film-poster img').attr('src') ||
        null;

      const infoItems = $li.find('.fd-infor .fdi-item');
      const itemType = infoItems.eq(0).text().trim() || null;
      const itemDuration = infoItems.eq(1).text().trim() || null;

      const episodes: AnimeEpisodes = {
        sub: parseEpisodeNumber($li.find('.tick .tick-sub').text() || $li.find('.tick-sub').text()),
        dub: parseEpisodeNumber($li.find('.tick .tick-dub').text() || $li.find('.tick-dub').text()),
        eps:
          parseEpisodeNumber($li.find('.tick-eps').text()) ||
          parseEpisodeNumber($li.find('.tick .tick-sub').text() || $li.find('.tick-sub').text()),
      };

      if (itemId || itemTitle) {
        cards.push({
          id: itemId,
          name: itemTitle,
          jname: itemJname,
          poster: itemPoster,
          type: itemType,
          duration: itemDuration,
          episodes,
        });
      }
    });
    return cards;
  };

  // Related Anime
  const relatedBlock = $('.block_area:contains("Related Anime")').first();
  const relatedAnimes = parseListItems(relatedBlock);

  // Most Popular
  const mostPopularBlock = $('#main-sidebar .block_area:contains("Most Popular")').first();
  const mostPopularAnimes = parseListItems(mostPopularBlock);

  return {
    id: requestedId,
    animeId,
    name,
    jname: jname || infoMap['japanese'] || null,
    poster,
    description,
    stats: {
      rating,
      quality,
      type,
      duration,
      episodes: {
        sub: tickSub,
        dub: tickDub,
        eps: tickEps,
      },
    },
    moreInfo: {
      japanese: infoMap['japanese'] || null,
      synonyms: infoMap['synonyms'] || null,
      aired: infoMap['aired'] || null,
      premiered: infoMap['premiered'] || null,
      duration: infoMap['duration'] || null,
      status: infoMap['status'] || null,
      malScore: infoMap['mal score'] || null,
      genres,
      studios,
      producers,
    },
    recommendedAnimes,
    relatedAnimes,
    mostPopularAnimes,
  };
}

export default extractAnimeDetails;
