import * as cheerio from 'cheerio';
import type {
  EpisodeDownloadsData,
  DownloadGroup,
  FlatDownloadItem,
} from '../types/anime.js';

export function extractEpisodeDownloads(html: string, episodeId: string): EpisodeDownloadsData {
  const $ = cheerio.load(html);

  const groups: DownloadGroup[] = [];
  const downloads: FlatDownloadItem[] = [];

  $('.dl-item, .dl-grp').each((_, el) => {
    const $el = $(el);
    const rawGroupName = $el.find('.dl-grp-toggle').text().trim();
    // Clean up icon or caret text if present
    const groupName = rawGroupName.replace(/\s+/g, ' ').trim() || 'Default';

    const links: { quality: string; url: string }[] = [];

    $el.find('.dl-grp-items a').each((_, a) => {
      const $a = $(a);
      const quality = $a.text().trim() || 'Download';
      const url = $a.attr('href') || '';

      if (url && url !== 'javascript:;') {
        links.push({ quality, url });
        downloads.push({
          source: groupName,
          quality,
          url,
        });
      }
    });

    if (links.length > 0) {
      groups.push({
        groupName,
        links,
      });
    }
  });

  // Also check for any direct download chips outside groups
  $('.dl-list > a.dl-chip, .dl-list > .item:not(.dl-grp) a').each((_, a) => {
    const $a = $(a);
    const url = $a.attr('href') || '';
    if (url && url !== 'javascript:;') {
      const quality = $a.text().trim() || 'Download';
      downloads.push({
        source: 'Direct',
        quality,
        url,
      });
    }
  });

  return {
    episodeId,
    groups,
    downloads,
  };
}

export default extractEpisodeDownloads;
