const test = async () => {
  const urls = [
    "http://localhost:3000/",
    "http://localhost:3000/embed/hianime/attack-on-titan-112/1/sub",
    "http://localhost:3000/embed?id=attack-on-titan-112&ep=1&provider=hianime",
    "http://localhost:3000/embed/miruro/ZkbbIfGqvoOrvvss5iQuAlVkW4AaYPxz/1/sub",
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u);
      console.log(`URL: ${u} -> Status: ${res.status}`);
      const text = await res.text();
      console.log(`Length: ${text.length} bytes`);
      if (text.includes("Error") || text.includes("Unhandled Runtime Error")) {
        console.error("Detected error in page output!");
      }
    } catch (err) {
      console.error(`Failed ${u}:`, err.message);
    }
  }
};

test();
