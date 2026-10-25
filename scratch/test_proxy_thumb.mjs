async function test() {
  console.log("Testing stream API to get real thumbnails and subtitles...");
  try {
    const res = await fetch("http://localhost:4000/api/v1/embed?id=ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz&ep=1");
    const json = await res.json();
    console.log("Embed success:", json.success);
    const data = json.data;
    console.log("Thumbnails:", data.thumbnails);
    console.log("Subtitles count:", data.subtitles?.length);
    if (data.subtitles?.length) {
      console.log("First 2 subtitles:", data.subtitles.slice(0, 2));
    }

    if (data.thumbnails?.url || data.thumbnails?.vtt || typeof data.thumbnails === "string") {
      const thumbVtt = typeof data.thumbnails === "string" ? data.thumbnails : (data.thumbnails.url || data.thumbnails.vtt);
      console.log("\nTesting embedplayer proxy with thumbnail VTT:", thumbVtt);
      const proxyUrl = `http://localhost:3000/api/proxy?url=${encodeURIComponent(thumbVtt)}`;
      const vttRes = await fetch(proxyUrl);
      console.log("VTT Proxy status:", vttRes.status, "content-type:", vttRes.headers.get("content-type"));
      const text = await vttRes.text();
      console.log("VTT Proxy text sample (first 400 chars):\n", text.slice(0, 400));

      // Check if sprite URL was rewritten
      const spriteMatch = text.match(/\/api\/proxy\?url=[^\s#]+/);
      if (spriteMatch) {
        const spriteProxy = `http://localhost:3000${spriteMatch[0]}`;
        console.log("\nTesting rewritten sprite proxy URL:", spriteProxy);
        const spriteRes = await fetch(spriteProxy);
        console.log("Sprite Proxy status:", spriteRes.status, "content-type:", spriteRes.headers.get("content-type"));
        const buf = await spriteRes.arrayBuffer();
        console.log("Sprite buffer byte length:", buf.byteLength);
      } else {
        console.log("No rewritten sprite found in VTT text, lines:", text.split("\n").slice(0, 8));
      }
    }

    if (data.subtitles?.length) {
      const subUrl = data.subtitles[0].url || data.subtitles[0].src;
      console.log("\nTesting subtitle proxy with:", subUrl);
      const subProxy = `http://localhost:3000/api/proxy?url=${encodeURIComponent(subUrl)}`;
      const subRes = await fetch(subProxy);
      console.log("Subtitle Proxy status:", subRes.status, "content-type:", subRes.headers.get("content-type"));
      const subText = await subRes.text();
      console.log("Subtitle text sample (first 200 chars):\n", subText.slice(0, 200));
    }
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();
