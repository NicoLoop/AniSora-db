import * as cheerio from 'cheerio';
import type { EpisodesData, AnimeEpisode } from '../types/anime.js';

export function extractEpisodes(html: string, animeId: string): EpisodesData {
  const $ = cheerio.load(html);
  const episodes: AnimeEpisode[] = [];

  $('.ss-list a.ssl-item, a.ep-item').each((i, el) => {
    const $el = $(el);
    const title = $el.attr('title') || `Episode ${i + 1}`;
    const episodeId = $el.attr('data-id') || String(i + 1);
    const rawNumber = $el.attr('data-number');
    const number = rawNumber ? parseInt(rawNumber, 10) : i + 1;
    const name = $el.find('.ep-name').text().trim() || title;
    const isFiller = $el.hasClass('ssl-item-filler');
    const url = $el.attr('href') || '';

    episodes.push({
      title,
      episodeId,
      number: isNaN(number) ? i + 1 : number,
      name,
      isFiller,
      url,
    });
  });

  return {
    animeId,
    totalEpisodes: episodes.length,
    episodes,
  };
}

export default extractEpisodes;
