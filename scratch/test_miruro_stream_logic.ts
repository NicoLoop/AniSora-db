import { miruroService } from '../src/services/miruro.service.js';
import { buildProxyUrl } from '../src/extractors/vidnest.common.js';

async function testMiruroDirectStream() {
  const miruroId = 'ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz';
  const epNum = 1;
  const chunks = await (miruroService as any).fetchSvelteData(`/watch/${miruroId}/one-piece/__data.json?ep=${epNum}`);
  
  let trackList = [];
  for (const chunk of chunks) {
    if (chunk.type === 'chunk' && chunk.id === 3 && chunk.data) {
      const watchObj = miruroService.parseDevalue(chunk.data);
      if (watchObj.tracks) trackList = watchObj.tracks;
    }
  }

  const subTrack = trackList.find((t: any) => t.track === 'sub');
  console.log('Sub providers count:', subTrack?.providers?.length);
  for (const p of subTrack?.providers || []) {
    for (const s of p.servers || []) {
      console.log(`Server: ${s.server} (Provider: ${p.provider})`);
      if (s.streams && s.streams.length > 0) {
        console.log(`  -> Direct stream: ${s.streams[0].url.slice(0, 80)}...`);
        console.log(`  -> Headers:`, s.headers);
        const proxied = buildProxyUrl(s.streams[0].url, s.headers || {});
        console.log(`  -> Proxy URL: ${proxied.slice(0, 100)}...`);
      } else if (s.embed?.url) {
        console.log(`  -> Embed URL: ${s.embed.url}`);
      }
    }
  }
}

testMiruroDirectStream().catch(console.error);
