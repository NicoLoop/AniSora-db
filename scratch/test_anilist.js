async function test() {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      query: 'query { Media(search: "attack on titan", type: ANIME) { id idMal title { english romaji } } }'
    })
  });
  const data = await res.json();
  console.log("AniList result:", data.data?.Media);
}
test();
