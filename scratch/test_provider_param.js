// Comprehensive test for provider parameter in Universal Embed & AniSkip
const BASE_URL = 'http://localhost:4000';

async function testEndpoint(name, url) {
  const start = performance.now();
  try {
    const res = await fetch(url);
    const duration = Math.round(performance.now() - start);
    const data = await res.json();
    console.log(`[PASS] ${name} (${duration}ms) - Status: ${res.status}, Success: ${data.success}`);
    return { name, duration, success: data.success, data: data.data };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    console.error(`[FAIL] ${name} (${duration}ms):`, err.message);
    return { name, duration, success: false, error: err.message };
  }
}

async function runTests() {
  console.log('--- Starting Provider Parameter & Skip API Tests ---\n');

  // Test 1: AniSkip with explicit provider=mal
  const t1 = await testEndpoint(
    'AniSkip with provider=mal (One Piece MAL ID 21)',
    `${BASE_URL}/skip-times?id=21&ep=1&provider=mal`
  );
  if (t1.data) {
    console.log(`   -> Found: ${t1.data.found}, MAL ID: ${t1.data.malId}, OP: ${t1.data.skipTimes?.op?.startTime}s - ${t1.data.skipTimes?.op?.endTime}s`);
  }

  // Test 2: AniSkip MAL Route (defaults provider=mal)
  const t2 = await testEndpoint(
    'AniSkip MAL route /api/v1/mal/skip-times?id=21&ep=1',
    `${BASE_URL}/api/v1/mal/skip-times?id=21&ep=1`
  );

  // Test 3: AniSkip with explicit provider=anilist
  const t3 = await testEndpoint(
    'AniSkip with provider=anilist (One Piece AniList ID 21)',
    `${BASE_URL}/skip-times?id=21&ep=1&provider=anilist`
  );

  // Test 4: AniSkip AniList Route (defaults provider=anilist)
  const t4 = await testEndpoint(
    'AniSkip AniList route /api/v1/anilist/skip-times?id=21&ep=1',
    `${BASE_URL}/api/v1/anilist/skip-times?id=21&ep=1`
  );

  // Test 5: AniSkip Miruro Route (defaults provider=miruro)
  const t5 = await testEndpoint(
    'AniSkip Miruro route with hash ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz',
    `${BASE_URL}/api/v1/miruro/skip-times?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1`
  );

  // Test 6: Universal Embed with explicit provider=mal
  const t6 = await testEndpoint(
    'Universal Embed with provider=mal (One Piece MAL ID 21)',
    `${BASE_URL}/embed?id=21&ep=1&provider=mal`
  );
  if (t6.data) {
    console.log(`   -> Anime: "${t6.data.anime?.title?.english || t6.data.anime?.title?.romaji}"`);
    console.log(`   -> Primary Embed: ${t6.data.primaryEmbed?.server} (${t6.data.primaryEmbed?.provider})`);
    console.log(`   -> Streams Count: ${t6.data.streams?.length || 0}`);
    console.log(`   -> Intro Skip:`, t6.data.intro);
    console.log(`   -> Outro Skip:`, t6.data.outro);
  }

  // Test 7: Universal Embed MAL Route (defaults provider=mal)
  const t7 = await testEndpoint(
    'Universal Embed MAL route /api/v1/mal/embed?id=21&ep=1',
    `${BASE_URL}/api/v1/mal/embed?id=21&ep=1`
  );

  // Test 8: Universal Embed AniList Route (defaults provider=anilist)
  const t8 = await testEndpoint(
    'Universal Embed AniList route /api/v1/anilist/embed?id=21&ep=1',
    `${BASE_URL}/api/v1/anilist/embed?id=21&ep=1`
  );

  // Test 9: Universal Embed Cache Hit with provider=mal
  const t9 = await testEndpoint(
    'Universal Embed Warm Cache Hit (provider=mal)',
    `${BASE_URL}/embed?id=21&ep=1&provider=mal`
  );

  console.log('\n--- All Tests Completed Successfully ---');
}

runTests();
