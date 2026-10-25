import type { FilterOptionItem, FilterOptionsData, SearchFilterParams } from '../types/anime.js';

export const FILTER_OPTIONS: FilterOptionsData = {
  types: [
    { label: 'All', value: 'all' },
    { label: 'Movie', value: 'movie' },
    { label: 'TV', value: 'tv' },
    { label: 'OVA', value: 'ova' },
    { label: 'ONA', value: 'ona' },
    { label: 'Special', value: 'special' },
    { label: 'Music', value: 'music' },
  ],
  statuses: [
    { label: 'All', value: 'all' },
    { label: 'Finished Airing', value: 'completed' },
    { label: 'Currently Airing', value: 'releasing' },
    { label: 'Not yet aired', value: 'not_yet_aired' },
  ],
  ratings: [
    { label: 'All', value: 'all' },
    { label: 'G - All Ages', value: 'g' },
    { label: 'PG - Children', value: 'pg' },
    { label: 'PG-13 - Teens 13 or older', value: 'pg_13' },
    { label: 'R - 17+ (violence & profanity)', value: 'r_17' },
    { label: 'R+ - Mild Nudity', value: 'r_plus' },
    { label: 'Rx - Hentai', value: 'rx' },
  ],
  scores: [
    { label: 'All', value: 'all' },
    { label: '(10) Masterpiece', value: '10' },
    { label: '(9) Great', value: '9' },
    { label: '(8) Very Good', value: '8' },
    { label: '(7) Good', value: '7' },
    { label: '(6) Fine', value: '6' },
    { label: '(5) Average', value: '5' },
    { label: '(4) Bad', value: '4' },
    { label: '(3) Very Bad', value: '3' },
    { label: '(2) Horrible', value: '2' },
    { label: '(1) Appalling', value: '1' },
  ],
  seasons: [
    { label: 'All', value: 'all' },
    { label: 'Spring', value: 'spring' },
    { label: 'Summer', value: 'summer' },
    { label: 'Fall', value: 'fall' },
    { label: 'Winter', value: 'winter' },
  ],
  languages: [
    { label: 'All', value: 'all' },
    { label: 'SUB', value: 'sub' },
    { label: 'DUB', value: 'dub' },
  ],
  sortOptions: [
    { label: 'Default', value: 'default' },
    { label: 'Recently Updated', value: 'updated_date' },
    { label: 'Recently Added', value: 'added_date' },
    { label: 'Released Date', value: 'release_date' },
    { label: 'Trending', value: 'trending' },
    { label: 'Name A-Z', value: 'title_az' },
    { label: 'Score', value: 'avg_score' },
    { label: 'MAL Score', value: 'mal_score' },
    { label: 'Most Watched', value: 'most_viewed' },
    { label: 'Most Followed', value: 'most_followed' },
    { label: 'Number of Episodes', value: 'episode_count' },
  ],
  genres: [
    { label: 'Action', value: 'action' },
    { label: 'Action & Adventure', value: 'action-adventure' },
    { label: 'Action, Adventure, Supernatural', value: 'action-adventure-supernatural' },
    { label: 'Adult Cast', value: 'adult-cast' },
    { label: 'Adventure', value: 'adventure' },
    { label: 'Animation', value: 'animation' },
    { label: 'Anthropomorphic', value: 'anthropomorphic' },
    { label: 'Avant Garde', value: 'avant-garde' },
    { label: 'Award Winning', value: 'award-winning' },
    { label: 'Boys Love', value: 'boys-love' },
    { label: 'Cars', value: 'cars' },
    { label: 'CGDCT', value: 'cgdct' },
    { label: 'Childcare', value: 'childcare' },
    { label: 'Combat Sports', value: 'combat-sports' },
    { label: 'Comedy', value: 'comedy' },
    { label: 'Crossdressing', value: 'crossdressing' },
    { label: 'Delinquents', value: 'delinquents' },
    { label: 'Dementia', value: 'dementia' },
    { label: 'Demons', value: 'demons' },
    { label: 'Detective', value: 'detective' },
    { label: 'Drama', value: 'drama' },
    { label: 'Ecchi', value: 'ecchi' },
    { label: 'Educational', value: 'educational' },
    { label: 'Erotica', value: 'erotica' },
    { label: 'Fantasy', value: 'fantasy' },
    { label: 'Gag Humor', value: 'gag-humor' },
    { label: 'Game', value: 'game' },
    { label: 'Girls Love', value: 'girls-love' },
    { label: 'Gore', value: 'gore' },
    { label: 'Gourmet', value: 'gourmet' },
    { label: 'Harem', value: 'harem' },
    { label: 'Hentai', value: 'hentai' },
    { label: 'High Stakes Game', value: 'high-stakes-game' },
    { label: 'Historical', value: 'historical' },
    { label: 'Horror', value: 'horror' },
    { label: 'Idols (Female)', value: 'idols-female' },
    { label: 'Idols (Male)', value: 'idols-male' },
    { label: 'Isekai', value: 'isekai' },
    { label: 'Iyashikei', value: 'iyashikei' },
    { label: 'Josei', value: 'josei' },
    { label: 'Kids', value: 'kids' },
    { label: 'Love Polygon', value: 'love-polygon' },
    { label: 'Love Status Quo', value: 'love-status-quo' },
    { label: 'Magic', value: 'magic' },
    { label: 'Magical Sex Shift', value: 'magical-sex-shift' },
    { label: 'Mahou Shoujo', value: 'mahou-shoujo' },
    { label: 'Martial Arts', value: 'martial-arts' },
    { label: 'Mecha', value: 'mecha' },
    { label: 'Medical', value: 'medical' },
    { label: 'Military', value: 'military' },
    { label: 'Music', value: 'music' },
    { label: 'Mystery', value: 'mystery' },
    { label: 'Mythology', value: 'mythology' },
    { label: 'Organized Crime', value: 'organized-crime' },
    { label: 'Otaku Culture', value: 'otaku-culture' },
    { label: 'Parody', value: 'parody' },
    { label: 'Performing Arts', value: 'performing-arts' },
    { label: 'Pets', value: 'pets' },
    { label: 'Police', value: 'police' },
    { label: 'Psychological', value: 'psychological' },
    { label: 'Racing', value: 'racing' },
    { label: 'Reincarnation', value: 'reincarnation' },
    { label: 'Reverse Harem', value: 'reverse-harem' },
    { label: 'Romance', value: 'romance' },
    { label: 'Samurai', value: 'samurai' },
    { label: 'School', value: 'school' },
    { label: 'Sci-Fi', value: 'sci-fi' },
    { label: 'Sci-Fi & Fantasy', value: 'sci-fi-fantasy' },
    { label: 'Seinen', value: 'seinen' },
    { label: 'Shoujo', value: 'shoujo' },
    { label: 'Shoujo Ai', value: 'shoujo-ai' },
    { label: 'Shounen', value: 'shounen' },
    { label: 'Shounen Ai', value: 'shounen-ai' },
    { label: 'Showbiz', value: 'showbiz' },
    { label: 'Slice of Life', value: 'slice-of-life' },
    { label: 'Space', value: 'space' },
    { label: 'Sports', value: 'sports' },
    { label: 'Strategy Game', value: 'strategy-game' },
    { label: 'Supernatural', value: 'supernatural' },
    { label: 'Super Power', value: 'super-power' },
    { label: 'Survival', value: 'survival' },
    { label: 'Suspense', value: 'suspense' },
    { label: 'Team Sports', value: 'team-sports' },
    { label: 'Thriller', value: 'thriller' },
    { label: 'Time Travel', value: 'time-travel' },
    { label: 'Urban Fantasy', value: 'urban-fantasy' },
    { label: 'Vampire', value: 'vampire' },
    { label: 'Video Game', value: 'video-game' },
    { label: 'Villainess', value: 'villainess' },
    { label: 'Visual Arts', value: 'visual-arts' },
    { label: 'Workplace', value: 'workplace' },
  ],
};

export interface ParsedFilterResult {
  queryString: string;
  filters: SearchFilterParams;
  page: number;
}

export function buildFilterParams(query: Record<string, any>): ParsedFilterResult {
  const params = new URLSearchParams();
  const filters: SearchFilterParams = {};

  const rawKeyword = query.keyword || query.q;
  if (typeof rawKeyword === 'string' && rawKeyword.trim()) {
    filters.keyword = rawKeyword.trim();
    params.append('keyword', filters.keyword);
  }

  // Type: all, tv, movie, ova, ona, special, music
  const rawType = query.type;
  if (typeof rawType === 'string' && rawType.trim() && rawType.toLowerCase() !== 'all') {
    filters.type = rawType.trim().toLowerCase();
    params.append('type', filters.type);
  }

  // Status: all, completed, releasing, not_yet_aired
  const rawStatus = query.status;
  if (typeof rawStatus === 'string' && rawStatus.trim() && rawStatus.toLowerCase() !== 'all') {
    filters.status = rawStatus.trim().toLowerCase();
    params.append('status', filters.status);
  }

  // Rated / Rating: all, g, pg, pg_13, r_17, r_plus, rx
  const rawRating = query.rated || query.rating;
  if (typeof rawRating === 'string' && rawRating.trim() && rawRating.toLowerCase() !== 'all') {
    filters.rated = rawRating.trim().toLowerCase();
    params.append('rating', filters.rated);
  }

  // Score: all, 1-10
  const rawScore = query.score;
  if (typeof rawScore === 'string' && rawScore.trim() && rawScore.toLowerCase() !== 'all') {
    filters.score = rawScore.trim();
    params.append('score', filters.score);
  }

  // Season: all, spring, summer, fall, winter
  const rawSeason = query.season;
  if (typeof rawSeason === 'string' && rawSeason.trim() && rawSeason.toLowerCase() !== 'all') {
    filters.season = rawSeason.trim().toLowerCase();
    params.append('season', filters.season);
  }

  // Language: all, sub, dub
  const rawLanguage = query.language;
  if (typeof rawLanguage === 'string' && rawLanguage.trim() && rawLanguage.toLowerCase() !== 'all') {
    filters.language = rawLanguage.trim().toLowerCase();
    params.append('language', filters.language);
  }

  // Start Date: Year (sy), Month (sm), Day (sd)
  const sy = query.sy || query.startYear || query.start_year;
  if (sy && String(sy).trim()) {
    filters.sy = String(sy).trim();
    params.append('sy', filters.sy);
  }
  const sm = query.sm || query.startMonth || query.start_month;
  if (sm && String(sm).trim()) {
    filters.sm = String(sm).trim();
    params.append('sm', filters.sm);
  }
  const sd = query.sd || query.startDay || query.start_day;
  if (sd && String(sd).trim()) {
    filters.sd = String(sd).trim();
    params.append('sd', filters.sd);
  }

  // End Date: Year (ey), Month (em), Day (ed)
  const ey = query.ey || query.endYear || query.end_year;
  if (ey && String(ey).trim()) {
    filters.ey = String(ey).trim();
    params.append('ey', filters.ey);
  }
  const em = query.em || query.endMonth || query.end_month;
  if (em && String(em).trim()) {
    filters.em = String(em).trim();
    params.append('em', filters.em);
  }
  const ed = query.ed || query.endDay || query.end_day;
  if (ed && String(ed).trim()) {
    filters.ed = String(ed).trim();
    params.append('ed', filters.ed);
  }

  // Sort: default, updated_date, added_date, release_date, trending, title_az, avg_score, mal_score, most_viewed, most_followed, episode_count
  const rawSort = query.sort;
  if (typeof rawSort === 'string' && rawSort.trim() && rawSort.toLowerCase() !== 'default') {
    filters.sort = rawSort.trim().toLowerCase();
    params.append('sort', filters.sort);
  }

  // Genres: comma-separated or array
  const rawGenres = query['genre[]'] || query.genres || query.genre;
  if (rawGenres) {
    let genreList: string[] = [];
    if (Array.isArray(rawGenres)) {
      genreList = rawGenres.map((g) => String(g).trim()).filter(Boolean);
    } else if (typeof rawGenres === 'string') {
      genreList = rawGenres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);
    }

    if (genreList.length > 0) {
      filters.genres = genreList;
      for (const g of genreList) {
        params.append('genre[]', g);
      }
    }
  }

  // Page
  const rawPage = query.page;
  const page = typeof rawPage === 'string' ? parseInt(rawPage, 10) || 1 : 1;
  filters.page = page;
  params.append('page', String(page));

  return {
    queryString: params.toString(),
    filters,
    page,
  };
}
