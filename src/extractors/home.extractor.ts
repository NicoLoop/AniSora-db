import * as cheerio from 'cheerio';
import type {
  HomePageData,
  SpotlightAnime,
  TrendingAnime,
  AnimeCard,
  Top10Anime,
  AnimeEpisodes,
} from '../types/anime.js';

/**
 * Extracts a clean anime ID from a URL or relative path.
 * e.g., 'https://hianime.ba/one-piece-1' -> 'one-piece-1'
 * e.g., 'https://hianime.ba/watch/one-piece-1?ep=100' -> 'one-piece-1'
 */
export function extractAnimeId(href?: string | null): string {
  if (!href) return '';
  const clean = href.split('?')[0].replace(/\/+$/, '');
  const segments = clean.split('/');
  return segments.pop() || '';
}

/**
 * Parses numeric episode values from cheerio selector.
 */
function parseEpisodeNumber(text?: string | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

export function extractHomePage(html: string): HomePageData {
  const $ = cheerio.load(html);

  const homeData: HomePageData = {
    spotlightAnimes: [],
    trendingAnimes: [],
    latestEpisodeAnimes: [],
    topUpcomingAnimes: [],
    topAiringAnimes: [],
    mostPopularAnimes: [],
    mostFavoriteAnimes: [],
    latestCompletedAnimes: [],
    top10Animes: {
      today: [],
      week: [],
      month: [],
    },
    genres: [],
  };

  // 1. Spotlight Anime
  $('.deslide-wrap .swiper-wrapper .swiper-slide').each((i, el) => {
    const $slide = $(el);
    const titleEl = $slide.find('.desi-head-title');
    const name = titleEl.text().trim();
    const jname = titleEl.attr('data-jname') || null;

    // Determine ID from action buttons
    const hrefs = $slide
      .find('.desi-buttons a')
      .map((_, a) => $(a).attr('href') || '')
      .get();
    const detailHref = hrefs.find((h) => h && !h.includes('/watch/')) || hrefs[0] || '';
    const id = extractAnimeId(detailHref);

    const poster =
      $slide.find('.deslide-cover .film-poster-img').attr('data-src') ||
      $slide.find('.deslide-cover img').attr('src') ||
      null;

    const description = $slide.find('.desi-description').text().trim() || null;
    const details = $slide.find('.sc-detail');
    const type = details.find('.scd-item').eq(0).text().trim() || null;
    const duration = details.find('.scd-item').eq(1).text().trim() || null;
    const aired = details.find('.scd-item.m-hide').text().trim() || null;
    const quality = details.find('.sc-detail .quality').text().trim() || null;

    const episodes: AnimeEpisodes = {
      sub: parseEpisodeNumber(details.find('.tick-sub').text()),
      dub: parseEpisodeNumber(details.find('.tick-dub').text()),
      eps:
        parseEpisodeNumber(details.find('.tick-eps').text()) ||
        parseEpisodeNumber(details.find('.tick-sub').text()),
    };

    if (id || name) {
      homeData.spotlightAnimes.push({
        rank: i + 1,
        id,
        name,
        jname,
        poster,
        description,
        type,
        duration,
        aired,
        quality,
        episodes,
      });
    }
  });

  // 2. Trending Anime
  $('#trending-home .swiper-slide').each((i, el) => {
    const $slide = $(el);
    const titleEl = $slide.find('.film-title');
    const name = titleEl.text().trim();
    const jname = titleEl.attr('data-jname') || null;
    const linkHref = $slide.find('a.film-poster').attr('href');
    const id = extractAnimeId(linkHref);
    const poster =
      $slide.find('img.film-poster-img').attr('data-src') ||
      $slide.find('img.film-poster-img').attr('src') ||
      null;

    const rankText = $slide.find('.item .number span').text().trim();
    const rank = parseInt(rankText, 10) || i + 1;

    if (id || name) {
      homeData.trendingAnimes.push({
        rank,
        id,
        name,
        jname,
        poster,
      });
    }
  });

  // Helper for parsing anime cards from film_list-wrap (.flw-item)
  const parseFlwItems = (container: cheerio.Cheerio<any>): AnimeCard[] => {
    const list: AnimeCard[] = [];
    container.find('.flw-item').each((_, item) => {
      const $item = $(item);
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
        list.push({
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
    return list;
  };

  // 3. Block areas (Latest Episode, Top Upcoming, etc.)
  $('section.block_area').each((_, section) => {
    const $sec = $(section);
    const heading = $sec.find('.cat-heading').first().text().trim();

    if (/latest episode/i.test(heading)) {
      homeData.latestEpisodeAnimes = parseFlwItems($sec);
    } else if (/top upcoming/i.test(heading)) {
      homeData.topUpcomingAnimes = parseFlwItems($sec);
    }
  });

  // 4. Featured 4 columns (Top Airing, Most Popular, Most Favorite, Latest Completed)
  $('.anif-blocks .row .anif-block').each((_, block) => {
    const $block = $(block);
    const rawHeader = $block.find('.anif-block-header').text().trim();
    const items: AnimeCard[] = [];

    $block.find('.anif-block-ul ul li').each((_, li) => {
      const $li = $(li);
      const titleEl = $li.find('.film-detail .film-name a');
      const name = titleEl.attr('title') || titleEl.text().trim();
      const jname = titleEl.attr('data-jname') || null;
      const id = extractAnimeId(titleEl.attr('href'));

      const poster =
        $li.find('.film-poster img').attr('data-src') ||
        $li.find('.film-poster img').attr('src') ||
        null;

      const infoItems = $li.find('.fd-infor .fdi-item');
      const type = infoItems.eq(0).text().trim() || null;
      const duration = infoItems.eq(1).text().trim() || null;

      const episodes: AnimeEpisodes = {
        sub: parseEpisodeNumber($li.find('.tick .tick-sub').text()),
        dub: parseEpisodeNumber($li.find('.tick .tick-dub').text()),
        eps:
          parseEpisodeNumber($li.find('.fd-infor .tick-eps').text()) ||
          parseEpisodeNumber($li.find('.tick .tick-sub').text()),
      };

      if (id || name) {
        items.push({
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

    if (/top airing/i.test(rawHeader)) {
      homeData.topAiringAnimes = items;
    } else if (/most popular/i.test(rawHeader)) {
      homeData.mostPopularAnimes = items;
    } else if (/most favorite/i.test(rawHeader)) {
      homeData.mostFavoriteAnimes = items;
    } else if (/latest completed/i.test(rawHeader)) {
      homeData.latestCompletedAnimes = items;
    }
  });

  // 5. Top 10 Animes (today, week, month)
  const extractTop10Section = (selector: string): Top10Anime[] => {
    const result: Top10Anime[] = [];
    $(selector)
      .find('ul li')
      .each((i, li) => {
        const $li = $(li);
        const rankText = $li.find('.film-number span').text().trim();
        const rank = parseInt(rankText, 10) || i + 1;

        const titleEl = $li.find('.film-name a');
        const name = titleEl.attr('title') || titleEl.text().trim();
        const jname = titleEl.attr('data-jname') || null;
        const id = extractAnimeId(titleEl.attr('href'));

        const poster =
          $li.find('.film-poster img').attr('data-src') ||
          $li.find('.film-poster img').attr('src') ||
          null;

        const episodes: AnimeEpisodes = {
          sub: parseEpisodeNumber($li.find('.tick-sub').text()),
          dub: parseEpisodeNumber($li.find('.tick-dub').text()),
          eps:
            parseEpisodeNumber($li.find('.tick-eps').text()) ||
            parseEpisodeNumber($li.find('.tick-sub').text()),
        };

        if (id || name) {
          result.push({
            rank,
            id,
            name,
            jname,
            poster,
            episodes,
          });
        }
      });
    return result;
  };

  homeData.top10Animes.today = extractTop10Section('#top-viewed-day');
  homeData.top10Animes.week = extractTop10Section('#top-viewed-week');
  homeData.top10Animes.month = extractTop10Section('#top-viewed-month');

  // 6. Genres
  $('.sb-genre-list li a').each((_, a) => {
    const genre = $(a).text().trim();
    if (genre && !homeData.genres.includes(genre)) {
      homeData.genres.push(genre);
    }
  });

  return homeData;
}

export default extractHomePage;
