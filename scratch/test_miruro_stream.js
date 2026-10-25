const test = async () => {
  const testEndpoints = [
    {
      name: 'Miruro Stream (Default Server)',
      url: 'http://localhost:4000/api/v1/miruro/stream?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1',
    },
    {
      name: 'Miruro Stream (server=animepahe)',
      url: 'http://localhost:4000/api/v1/miruro/stream?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1&server=animepahe',
    },
    {
      name: 'Miruro Stream (server=vidplay)',
      url: 'http://localhost:4000/api/v1/miruro/stream?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1&server=vidplay',
    },
    {
      name: 'Universal Embed with Miruro Provider',
      url: 'http://localhost:4000/embed?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1&provider=miruro',
    },
  ];

  for (const ep of testEndpoints) {
    console.log(`\n========================================`);
    console.log(`Testing: ${ep.name}`);
    console.log(`URL: ${ep.url}`);
    const start = Date.now();
    try {
      const res = await fetch(ep.url);
      const took = Date.now() - start;
      console.log(`Status: ${res.status} (${took} ms)`);
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        console.log(`Server: ${d.server || 'N/A'}`);
        console.log(`Available Servers: ${JSON.stringify(d.availableServers || [])}`);
        console.log(`Sources count: ${d.sources?.length || (d.streams?.length ? d.streams.length : 0)}`);
        if (d.sources?.[0]) {
          console.log(`Direct stream url: ${d.sources[0].url?.substring(0, 80)}...`);
          console.log(`Proxy stream url: ${d.sources[0].proxyUrl?.substring(0, 80)}...`);
        }
        if (d.streams?.[0]) {
          console.log(`First embed stream: server=${d.streams[0].server}, provider=${d.streams[0].provider}`);
          console.log(`Proxy stream: ${d.streams[0].proxyUrl?.substring(0, 80)}...`);
        }
        if (d.intro || d.outro) {
          console.log(`Intro: ${JSON.stringify(d.intro)}, Outro: ${JSON.stringify(d.outro)}`);
        }
        if (d.subtitles?.length) {
          console.log(`Subtitles count: ${d.subtitles.length}`);
          console.log(`First subtitle: ${JSON.stringify(d.subtitles[0])}`);
        }
      } else {
        console.log(`Error Response:`, json);
      }
    } catch (err) {
      console.error(`Fetch failed for ${ep.name}:`, err.message);
    }
  }
};

test();
