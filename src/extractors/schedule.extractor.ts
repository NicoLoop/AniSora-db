import * as cheerio from 'cheerio';
import type { ScheduledAnime, ScheduleDateItem } from '../types/anime.js';
import { extractAnimeId } from './home.extractor.js';

function parseEpisodeNumber(text?: string | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

export interface ExtractedScheduleWidget {
  availableDates: ScheduleDateItem[];
  activeDate: string | null;
}

/**
 * Extracts available dates and the active date from the HiAnime schedule widget HTML.
 */
export function extractScheduleWidget(html: string): ExtractedScheduleWidget {
  const $ = cheerio.load(html);
  const availableDates: ScheduleDateItem[] = [];
  let activeDate: string | null = null;

  $('.day-item').each((_, el) => {
    const $el = $(el);
    const date = $el.attr('data-date') || '';
    const dayOfWeek = $el.find('.tsd-item span').first().text().trim();
    const displayDate = $el.find('.tsd-item .date').first().text().trim();
    const isActive = $el.find('.tsd-item').hasClass('active');

    if (isActive && date) {
      activeDate = date;
    }

    if (date) {
      availableDates.push({
        date,
        dayOfWeek,
        displayDate,
        isActive,
      });
    }
  });

  return {
    availableDates,
    activeDate,
  };
}

/**
 * Extracts scheduled anime episodes from the HiAnime schedule day HTML.
 */
export function extractScheduleDay(html: string): ScheduledAnime[] {
  const $ = cheerio.load(html);
  const scheduledAnimes: ScheduledAnime[] = [];

  $('li').each((_, el) => {
    const $li = $(el);
    const link = $li.find('a.tsl-link, a').first();
    const href = link.attr('href') || '';
    const id = extractAnimeId(href);

    const time = $li.find('.time').first().text().trim();
    const titleEl = $li.find('.film-name, h3').first();
    const name = titleEl.attr('title') || titleEl.text().trim();
    const jname = titleEl.attr('data-jname') || null;

    const playBtn = $li.find('.fd-play .btn-play, .btn-play, .fd-play button').first();
    const airingEpisode = playBtn.text().trim().replace(/\s+/g, ' ');
    const episodeNumber = parseEpisodeNumber(airingEpisode);

    if (name || id) {
      scheduledAnimes.push({
        id,
        time,
        name,
        jname,
        airingEpisode,
        episodeNumber,
      });
    }
  });

  return scheduledAnimes;
}

export default {
  extractScheduleWidget,
  extractScheduleDay,
};
