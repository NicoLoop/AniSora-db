const BASE = 'http://localhost:4000';

const testEndpoints = async () => {
  console.log("1. Testing HiAnime episodes...");
  const epRes = await fetch(`${BASE}/api/v1/hianime/episodes/attack-on-titan-112`).then(r => r.json());
  console.log("HiAnime totalEpisodes:", epRes.data?.totalEpisodes);
  const epId = epRes.data?.episodes?.[0]?.episodeId;

  console.log("2. Testing HiAnime servers...");
  const srvRes = await fetch(`${BASE}/api/v1/hianime/episode/servers?episodeId=${encodeURIComponent(epId)}`).then(r => r.json());
  const hd1 = srvRes.data?.sub?.find(s => s.serverName.includes("HD-1"));
  console.log("HD-1 url:", hd1?.streamUrl);

  console.log("3. Testing HiAnime HD-1 stream...");
  const stRes = await fetch(`${BASE}/api/v1/hianime/stream/hd-1?url=${encodeURIComponent(hd1?.streamUrl)}`).then(r => r.json());
  console.log("HD-1 stream sources:", stRes.data?.sources?.length, "subtitles:", stRes.data?.subtitles?.length);

  console.log("4. Testing Miruro direct stream...");
  const mirRes = await fetch(`${BASE}/api/v1/miruro/stream?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1`).then(r => r.json());
  console.log("Miruro stream server:", mirRes.data?.server, "sources:", mirRes.data?.sources?.length, "proxyUrl:", !!mirRes.data?.sources?.[0]?.proxyUrl);

  console.log("5. Testing Universal Embed with provider=hianime...");
  const embRes = await fetch(`${BASE}/embed?id=attack-on-titan-112&ep=1&provider=hianime`).then(r => r.json());
  console.log("Embed streams:", embRes.data?.streams?.map(s => `${s.server} (${s.provider})`));
  console.log("Embed anime title:", embRes.data?.anime?.title, "subtitles:", embRes.data?.subtitles?.length);

  console.log("6. Testing Universal Skip Times...");
  const skipRes = await fetch(`${BASE}/skip-times?id=attack-on-titan-112&ep=1&provider=hianime`).then(r => r.json());
  console.log("Skip times found:", skipRes.data?.found, "op:", skipRes.data?.skipTimes?.op, "ed:", skipRes.data?.skipTimes?.ed);
};

testEndpoints().catch(console.error);
