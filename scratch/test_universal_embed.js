const BASE = 'http://localhost:4000';

async function runTests() {
  console.log('=== STARTING UNIVERSAL EMBED LIVE TEST ===\n');

  const testCases = [
    {
      name: 'Universal Root: AniList ID (/embed?id=21&ep=1)',
      url: `${BASE}/embed?id=21&ep=1`,
    },
    {
      name: 'Universal Root Path Params: (/embed/21/1)',
      url: `${BASE}/embed/21/1`,
    },
    {
      name: 'Universal v1 Route: (/api/v1/embed?id=21&ep=1)',
      url: `${BASE}/api/v1/embed?id=21&ep=1`,
    },
    {
      name: 'Universal Root: Miruro Hash (/embed?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1)',
      url: `${BASE}/embed?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1`,
    },
    {
      name: 'Universal Root: HiAnime Slug (/embed?id=one-piece-100&ep=1)',
      url: `${BASE}/embed?id=one-piece-100&ep=1`,
    },
    {
      name: 'Universal Root: MAL ID (/embed?id=21&ep=1&category=sub)',
      url: `${BASE}/embed?id=21&ep=1&category=sub`,
    },
    {
      name: 'Provider Alias: Miruro (/api/v1/miruro/embed?id=21&ep=1)',
      url: `${BASE}/api/v1/miruro/embed?id=21&ep=1`,
    },
    {
      name: 'Provider Alias: AniList (/api/v1/anilist/embed?id=21&ep=1)',
      url: `${BASE}/api/v1/anilist/embed?id=21&ep=1`,
    },
    {
      name: 'Provider Alias: MAL (/api/v1/mal/embed?id=21&ep=1)',
      url: `${BASE}/api/v1/mal/embed?id=21&ep=1`,
    },
    {
      name: 'Provider Alias: HiAnime (/api/v1/hianime/embed?id=one-piece-100&ep=1)',
      url: `${BASE}/api/v1/hianime/embed?id=one-piece-100&ep=1`,
    },
    {
      name: 'Universal Root: Attack on Titan S2 (/embed?id=16498&ep=1)',
      url: `${BASE}/embed?id=16498&ep=1`,
    },
  ];

  let passed = 0;

  for (const tc of testCases) {
    try {
      const res = await fetch(tc.url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        console.error(`❌ [${res.status}] ${tc.name} -> HTTP ${res.statusText}`);
        continue;
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        console.error(`❌ [FAIL] ${tc.name} -> Invalid response structure:`, json);
        continue;
      }

      const d = json.data;
      console.log(
        `✅ [200] ${tc.name}\n` +
        `     Anime: "${d.anime?.title?.english || d.anime?.title?.romaji}" (Ep ${d.anime?.currentEpisode})\n` +
        `     Mappings: AniList: ${d.mappings?.anilistId}, MAL: ${d.mappings?.malId}, HiAnime: ${d.mappings?.hianime?.animeId}, Miruro: ${d.mappings?.miruro?.id ? 'mapped' : 'none'}\n` +
        `     Primary Embed: ${d.primaryEmbed?.server || 'none'} (${d.primaryEmbed?.provider || 'none'}) -> ${d.primaryEmbed?.embedUrl ? 'OK' : 'none'}\n` +
        `     Total Embeds: ${d.embeds?.length || 0}, Streams: ${d.streams?.length || 0}, Subtitles: ${d.subtitles?.length || 0}\n`
      );
      passed++;
    } catch (err) {
      console.error(`❌ [ERROR] ${tc.name}:`, err.message);
    }
  }

  console.log(`=== RESULTS: ${passed}/${testCases.length} tests passed ===`);
}

runTests();
