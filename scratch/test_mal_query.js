async function test() {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query($idMal: Int) { 
        Media(idMal: $idMal, type: ANIME) { 
          id 
          idMal 
          title { romaji english native } 
          format 
          status 
          episodes 
          duration
          averageScore 
          popularity 
          genres 
          description 
          coverImage { large extraLarge } 
          season 
          seasonYear 
          studios(isMain: true) { nodes { name } } 
        } 
      }`,
      variables: { idMal: 1 }
    })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('AniList Media by idMal:', JSON.stringify(data.data?.Media, null, 2));
}
test().catch(console.error);
