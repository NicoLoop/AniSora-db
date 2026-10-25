import { scraperService } from './src/services/scraper.service.js';

async function testEpList() {
  try {
    const res = await scraperService.fetchJson('/api/theme/episode/list/one-piece-1');
    console.log('List status:', res.status);
    // Print snippet of html
    console.log('HTML snippet:', res.html?.slice(0, 500));
    const match = res.html?.match(/data-id="(\d+)"/);
    if (match) {
      const epId = match[1];
      console.log('Found episodeId:', epId);
      const servers = await scraperService.fetchJson(`/api/theme/episode/servers?episodeId=${epId}`);
      console.log('Servers html:\n', servers.html);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testEpList();
