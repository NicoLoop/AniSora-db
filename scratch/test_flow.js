const test = async () => {
  console.log("=== Testing HiAnime fast retrieval ===");
  const t0 = Date.now();
  // Step 1: episodes list
  const epRes = await fetch("http://localhost:4000/api/v1/hianime/episodes/attack-on-titan-112").then(r => r.json());
  console.log(`Episodes call took ${Date.now() - t0} ms, total eps: ${epRes.data?.totalEpisodes}`);
  const ep1 = epRes.data?.episodes?.[0];
  console.log("Episode 1:", ep1?.title, ep1?.episodeId);

  // Step 2: servers for episode 1
  const t1 = Date.now();
  const srvRes = await fetch(`http://localhost:4000/api/v1/hianime/episode/servers?episodeId=${encodeURIComponent(ep1.episodeId)}`).then(r => r.json());
  console.log(`Servers call took ${Date.now() - t1} ms`);
  const hd1 = srvRes.data?.sub?.find(s => s.serverName.includes("HD-1"));
  console.log("HD-1 server streamUrl:", hd1?.streamUrl);

  // Step 3: HD-1 stream
  const t2 = Date.now();
  const streamRes = await fetch(`http://localhost:4000/api/v1/hianime/stream/hd-1?url=${encodeURIComponent(hd1.streamUrl)}`).then(r => r.json());
  console.log(`HD-1 stream call took ${Date.now() - t2} ms`);
  console.log("M3U8:", streamRes.data?.sources?.[0]?.url?.substring(0, 60));
  console.log("ProxyM3U8:", streamRes.data?.proxyM3U8?.substring(0, 60));
  console.log("Intro:", streamRes.data?.intro, "Outro:", streamRes.data?.outro);
  console.log(`Total fast retrieval time: ${Date.now() - t0} ms`);
};

test();
