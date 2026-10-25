const BASE_URL = 'http://localhost:4000/api/v1/miruro';

async function testEndpoint(name, url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.log(`❌ [${res.status}] ${name} -> Non-JSON response (${text.slice(0, 100)})`);
      return false;
    }

    if (res.ok && json.success) {
      let preview = '';
      const d = json.data;
      if (d) {
        if (d.spotlights) preview = `Spotlights: ${d.spotlights.length}, Trending: ${d.trendingAnimes?.length}`;
        else if (d.animes) preview = `Animes: ${d.animes.length}, First: "${d.animes[0]?.name}"`;
        else if (d.genres) preview = `Genres: ${d.genres.length}`;
        else if (d.suggestions) preview = `Suggestions: ${d.suggestions.length}, First: "${d.suggestions[0]?.name}"`;
        else if (d.scheduledAnimes) preview = `Scheduled: ${d.scheduledAnimes.length}, First: "${d.scheduledAnimes[0]?.name}"`;
        else if (d.name && d.stats) preview = `Anime: "${d.name}", Type: ${d.stats?.type}, Eps: ${d.stats?.episodes?.eps}`;
        else if (d.episodes) preview = `Total Eps: ${d.totalEpisodes}, First: "${d.episodes[0]?.title}"`;
        else if (d.sub && d.dub) preview = `Servers Sub: ${d.sub.length}, Dub: ${d.dub.length}`;
        else if (d.embedUrl) preview = `Server: "${d.server}", EmbedUrl: "${d.embedUrl}", Subs: ${d.subtitles?.length}`;
        else if (d.miruroId) preview = `MiruroId: ${d.miruroId}, AniListId: ${d.externalIds?.anilist?.[0]}`;
        else if (d.id) preview = `ID: ${d.id}, Name: "${d.name}"`;
        else preview = `Keys: ${Object.keys(d).slice(0, 4).join(', ')}`;
      }
      console.log(`✅ [${res.status}] ${name} -> ${preview}`);
      return true;
    } else {
      console.log(`❌ [${res.status}] ${name} -> ${json.message || text.slice(0, 120)}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ [ERR] ${name} -> ${err.message}`);
    return false;
  }
}

async function runAll() {
  console.log('=== STARTING MIRURO LIVE API TEST ===\n');

  const tests = [
    ['Home Feed', `${BASE_URL}/home`],
    ['Trending', `${BASE_URL}/trending`],
    ['Most Popular', `${BASE_URL}/popular`],
    ['Top Rated', `${BASE_URL}/top-rated`],
    ['Top Airing', `${BASE_URL}/top-airing`],
    ['Movies', `${BASE_URL}/movie`],
    ['TV Series', `${BASE_URL}/tv`],
    ['OVAs', `${BASE_URL}/ova`],
    ['ONAs', `${BASE_URL}/ona`],
    ['Specials', `${BASE_URL}/special`],
    ['Subbed Anime', `${BASE_URL}/subbed-anime`],
    ['Dubbed Anime', `${BASE_URL}/dubbed-anime`],
    ['Category (Movie)', `${BASE_URL}/category/movie`],
    ['Genres List', `${BASE_URL}/genres`],
    ['Anime By Genre (Action)', `${BASE_URL}/genres/Action`],
    ['A-Z List (A)', `${BASE_URL}/az-list/A`],
    ['Search Suggestions', `${BASE_URL}/search/suggestions?keyword=naruto`],
    ['Catalog Search', `${BASE_URL}/search?keyword=naruto`],
    ['Filter Options', `${BASE_URL}/filter/options`],
    ['Filter Anime', `${BASE_URL}/filter?format=TV&genres=Action`],
    ['Schedule', `${BASE_URL}/schedule`],
    ['Random Anime', `${BASE_URL}/random`],
    ['Anime Details (Miruro Hash)', `${BASE_URL}/anime/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz`],
    ['Anime Details (AniList ID 21)', `${BASE_URL}/anime/21`],
    ['Episodes List', `${BASE_URL}/episodes/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz`],
    ['Episode Servers', `${BASE_URL}/servers?episodeId=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz?ep=1`],
    ['Episode Embed / Sources', `${BASE_URL}/embed?animeId=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&episode=1&category=sub`],
    ['Reverse Sync', `${BASE_URL}/sync/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz`]
  ];

  let passed = 0;
  for (const [name, url] of tests) {
    const ok = await testEndpoint(name, url);
    if (ok) passed++;
  }

  console.log(`\n=== RESULTS: ${passed}/${tests.length} tests passed ===`);
}

runAll();
