import { miruroService } from './src/services/miruro.service.js';

async function check() {
  const chunks = await miruroService.fetchSvelteData('/watch/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz/one-piece/__data.json?ep=1');
  for (const chunk of chunks) {
    if (!chunk.data) continue;
    const watchObj = miruroService.parseDevalue(chunk.data);
    if (!watchObj.tracks) continue;
    for (const t of watchObj.tracks) {
      for (const p of t.providers || []) {
        if (p.provider === 'sun') {
          console.log("Found provider sun in track:", t.track);
          console.log("p keys:", Object.keys(p));
          console.log("p.headers:", p.headers);
          console.log("p.servers:", JSON.stringify(p.servers, null, 2));
        }
      }
    }
  }
}
check();
