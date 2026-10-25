const BASE = 'http://localhost:4000/api/v1/mal';

async function testEndpoint(name, path) {
  try {
    const start = Date.now();
    const res = await fetch(`${BASE}${path}`);
    const duration = Date.now() - start;
    const json = await res.json();
    const ok = res.status === 200 && json.success === true;
    console.log(`${ok ? '✓ PASS' : '✗ FAIL'} [${res.status}] ${name} (${duration}ms)`);
    if (!ok) {
      console.log('   Response error:', JSON.stringify(json));
    } else {
      let preview = '';
      if (json.data?.data && Array.isArray(json.data.data)) {
        preview = `Items: ${json.data.data.length}, First: ${json.data.data[0]?.title || json.data.data[0]?.name}`;
      } else if (Array.isArray(json.data)) {
        preview = `Items: ${json.data.length}, First: ${json.data[0]?.title || json.data[0]?.name}`;
      } else if (json.data?.spotlight) {
        preview = `Spotlight: ${json.data.spotlight.length}, Airing: ${json.data.topAiring?.length}`;
      } else if (json.data?.title) {
        preview = `Title: ${json.data.title}`;
      } else if (json.data?.data?.title) {
        preview = `Title: ${json.data.data.title}`;
      } else if (json.data?.suggestions) {
        preview = `Suggestions: ${json.data.suggestions.length}`;
      } else if (json.data?.genres) {
        preview = `Genres: ${json.data.genres.length}`;
      }
      console.log(`   Sample: ${preview}`);
    }
    return ok;
  } catch (err) {
    console.log(`✗ FAIL [ERR] ${name}: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('--- Testing Live MAL / Jikan Endpoints on http://localhost:4000 ---');
  await testEndpoint('1. Home Feed', '/home');
  await testEndpoint('2. Trending', '/trending?limit=5');
  await testEndpoint('3. Popular', '/popular?limit=5');
  await testEndpoint('4. Top Rated', '/top-rated?limit=5');
  await testEndpoint('5. Movies', '/movie?limit=5');
  await testEndpoint('6. TV Series', '/tv?limit=5');
  await testEndpoint('7. OVAs', '/ova?limit=5');
  await testEndpoint('8. ONAs', '/ona?limit=5');
  await testEndpoint('9. Specials', '/special?limit=5');
  await testEndpoint('10. Genres', '/genres');
  await testEndpoint('11. Anime by Genre', '/genres/Action?limit=5');
  await testEndpoint('12. A-Z List', '/az-list/a?limit=5');
  await testEndpoint('13. Search Suggestions', '/search/suggestions?keyword=naruto');
  await testEndpoint('14. Catalog Search', '/search?keyword=naruto&limit=5');
  await testEndpoint('15. Filter Options', '/filter/options');
  await testEndpoint('16. Filter Anime', '/filter?type=tv&rating=pg13&limit=5');
  await testEndpoint('17. Airing Schedule', '/schedule?day=monday&limit=5');
  await testEndpoint('18. Random Anime', '/random');
  await testEndpoint('19. Anime Details (Cowboy Bebop - 1)', '/anime/1');
  await testEndpoint('20. Episodes List (Cowboy Bebop - 1)', '/episodes/1');
  await testEndpoint('21. Reverse Sync to HiAnime (MAL 1)', '/sync/1');
  console.log('--- Finished Testing ---');
}

run();
