import { miruroService } from '../src/services/miruro.service.js';

async function main() {
  const servers = await miruroService.getServers('ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz', 1);
  console.log('Servers result:', JSON.stringify(servers, null, 2));

  // Let's also check the raw chunk 3
  const chunks = await (miruroService as any).fetchSvelteData('/watch/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz/one-piece/__data.json?ep=1');
  for (const chunk of chunks) {
    if (chunk.type === 'chunk' && chunk.id === 3) {
      const watchObj = miruroService.parseDevalue(chunk.data);
      console.log('Raw tracks structure:');
      for (const track of watchObj.tracks || []) {
        console.log('Track:', track.track);
        for (const provider of track.providers || []) {
          console.log('  Provider:', provider.provider, Object.keys(provider));
          for (const s of provider.servers || []) {
            console.log('    Server:', s.server, Object.keys(s));
            console.log('    Server details:', JSON.stringify(s, null, 2));
          }
        }
      }
    }
  }
}
main().catch(console.error);
