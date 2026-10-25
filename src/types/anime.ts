export interface AnimeEpisodes {
  sub: number | null;
  dub: number | null;
  eps: number | null;
}

export interface AnimeBase {
  id: string;
  name: string;
  jname: string | null;
  poster: string | null;
}

export interface SpotlightAnime extends AnimeBase {
  rank: number;
  description: string | null;
  type: string | null;
  duration: string | null;
  aired: string | null;
  quality: string | null;
  episodes: AnimeEpisodes;
}

export interface TrendingAnime extends AnimeBase {
  rank: number;
}

export interface AnimeCard extends AnimeBase {
  type: string | null;
  duration?: string | null;
  episodes: AnimeEpisodes;
}

export interface Top10Anime extends AnimeBase {
  rank: number;
  episodes: AnimeEpisodes;
}

export interface Top10Category {
  today: Top10Anime[];
  week: Top10Anime[];
  month: Top10Anime[];
}

export interface HomePageData {
  spotlightAnimes: SpotlightAnime[];
  trendingAnimes: TrendingAnime[];
  latestEpisodeAnimes: AnimeCard[];
  topUpcomingAnimes: AnimeCard[];
  topAiringAnimes: AnimeCard[];
  mostPopularAnimes: AnimeCard[];
  mostFavoriteAnimes: AnimeCard[];
  latestCompletedAnimes: AnimeCard[];
  top10Animes: Top10Category;
  genres: string[];
}

export interface AnimeDetailsMoreInfo {
  japanese: string | null;
  synonyms: string | null;
  aired: string | null;
  premiered: string | null;
  duration: string | null;
  status: string | null;
  malScore: string | null;
  genres: string[];
  studios: string[];
  producers: string[];
}

export interface AnimeDetailsStats {
  rating: string | null;
  quality: string | null;
  episodes: AnimeEpisodes;
  type: string | null;
  duration: string | null;
}

export interface AnimeDetailsData {
  id: string;
  animeId: string;
  name: string;
  jname: string | null;
  poster: string | null;
  description: string | null;
  stats: AnimeDetailsStats;
  moreInfo: AnimeDetailsMoreInfo;
  recommendedAnimes: AnimeCard[];
  relatedAnimes: AnimeCard[];
  mostPopularAnimes: AnimeCard[];
}

export interface AnimeEpisode {
  title: string;
  episodeId: string;
  number: number;
  name: string;
  isFiller: boolean;
  url: string;
}

export interface EpisodesData {
  animeId: string;
  totalEpisodes: number;
  episodes: AnimeEpisode[];
}

export interface EpisodeServer {
  serverName: string;
  type: 'sub' | 'dub' | 'raw';
  hash: string;
  streamUrl: string | null;
}

export interface EpisodeServersData {
  episodeId: string;
  sub: EpisodeServer[];
  dub: EpisodeServer[];
  raw: EpisodeServer[];
}

export interface DownloadLink {
  quality: string;
  url: string;
}

export interface DownloadGroup {
  groupName: string;
  links: DownloadLink[];
}

export interface FlatDownloadItem {
  source: string;
  quality: string;
  url: string;
}

export interface EpisodeDownloadsData {
  episodeId: string;
  groups: DownloadGroup[];
  downloads: FlatDownloadItem[];
}

export interface SubtitleTrack {
  lang: string;
  label: string;
  default?: boolean;
  src: string;
}

export interface SkipInterval {
  start: number;
  end: number;
}

export interface ZokoStreamSource {
  url: string;
  isM3U8: boolean;
}

export interface ZokoStreamResponse {
  streamingLink: string;
  sources: ZokoStreamSource[];
  m3u8: string;
  subtitles: SubtitleTrack[];
  intro: SkipInterval | null;
  outro: SkipInterval | null;
  downloadUrl: string | null;
  raw: Record<string, any>;
}

export interface MegaPlayStreamResponse {
  streamingLink: string;
  server: string;
  sources: ZokoStreamSource[];
  m3u8: string;
  subtitles: SubtitleTrack[];
  thumbnails?: string | null;
  intro: SkipInterval | null;
  outro: SkipInterval | null;
  raw: Record<string, any>;
}

export interface SearchSuggestionItem {
  id: string;
  name: string;
  jname: string | null;
  poster: string | null;
  moreInfo: string[];
}

export interface SearchSuggestionsData {
  keyword: string;
  suggestions: SearchSuggestionItem[];
}

export interface PaginatedAnimeList {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  animes: AnimeCard[];
}

export interface SearchData extends PaginatedAnimeList {
  keyword: string;
}

export interface GenreData extends PaginatedAnimeList {
  genreName: string;
}

export interface AZListData extends PaginatedAnimeList {
  letter: string;
}

export interface ScheduleDateItem {
  date: string;
  dayOfWeek: string;
  displayDate: string;
  isActive: boolean;
}

export interface ScheduledAnime {
  id: string;
  time: string;
  name: string;
  jname: string | null;
  airingEpisode: string;
  episodeNumber: number | null;
}

export interface ScheduleData {
  date: string;
  tzOffset: number;
  availableDates: ScheduleDateItem[];
  scheduledAnimes: ScheduledAnime[];
}

export interface CategoryData extends PaginatedAnimeList {
  category: string;
}

export interface SearchFilterParams {
  keyword?: string;
  type?: string;
  status?: string;
  rated?: string;
  score?: string;
  season?: string;
  language?: string;
  sy?: string | number;
  sm?: string | number;
  sd?: string | number;
  ey?: string | number;
  em?: string | number;
  ed?: string | number;
  sort?: string;
  genres?: string | string[];
  page?: number;
}

export interface FilterOptionItem {
  label: string;
  value: string;
}

export interface FilterOptionsData {
  types: FilterOptionItem[];
  statuses: FilterOptionItem[];
  ratings: FilterOptionItem[];
  scores: FilterOptionItem[];
  seasons: FilterOptionItem[];
  languages: FilterOptionItem[];
  sortOptions: FilterOptionItem[];
  genres: FilterOptionItem[];
}

export interface FilterData extends PaginatedAnimeList {
  filters: Partial<SearchFilterParams>;
}

export interface AnimePaheSource {
  url: string;
  proxyUrl: string;
  isM3U8: boolean;
  quality?: string;
  server?: string;
}

export interface AnimePaheStreamResponse {
  anilistId: number | string;
  episode: number | string;
  subOrDub: 'sub' | 'dub';
  server: string;
  sources: AnimePaheSource[];
  m3u8: string;
  proxyM3U8: string;
  headers: Record<string, string>;
  subtitles: SubtitleTrack[];
  intro: SkipInterval | null;
  outro: SkipInterval | null;
  raw?: Record<string, any>;
}

export type AnitakuSource = AnimePaheSource;
export type AnitakuStreamResponse = AnimePaheStreamResponse;

export type AniwaveSource = AnimePaheSource;
export type AniwaveStreamResponse = AnimePaheStreamResponse;

export interface AniListTrailer {
  id: string | null;
  site: string | null;
  thumbnail: string | null;
  url: string | null;
}

export interface AniListVoiceActor {
  id: number;
  name: {
    full: string;
    native: string | null;
  };
  image: {
    medium: string | null;
  };
  language: string | null;
}

export interface AniListCharacterItem {
  id: number;
  role: string;
  name: {
    full: string;
    native: string | null;
  };
  image: {
    medium: string | null;
    large: string | null;
  };
  voiceActor: AniListVoiceActor | null;
}

export interface AniListStaffItem {
  role: string;
  id: number;
  name: string;
  image: string | null;
}

export interface AniListRelationItem {
  relationType: string;
  id: number;
  idMal: number | null;
  title: {
    romaji: string;
    english: string | null;
  };
  format: string | null;
  type: string | null;
  status: string | null;
  coverImage: string | null;
}

export interface AnimeSyncData {
  hianimeAnimeId: string;
  hianimeInfo?: {
    name: string;
    jname: string | null;
    poster: string | null;
    type: string | null;
    episodes: AnimeEpisodes | null;
    genres: string[];
  };
  matchedTitle?: string;
  matchedVia?: 'jname' | 'name' | 'slug' | 'embed';
  matchScore?: number;
  hianimeEpisodeId?: string | null;
  currentEpisode?: number | null;
  anilistId: number;
  malId: number | null;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
    userPreferred: string | null;
  };
  synonyms: string[];
  description: string | null;
  format: string | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  episodes: number | null;
  duration: number | null;
  genres: string[];
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    medium: string | null;
    color: string | null;
  };
  bannerImage: string | null;
  trailer: AniListTrailer | null;
  casts: AniListCharacterItem[];
  staff: AniListStaffItem[];
  studios: string[];
  relations: AniListRelationItem[];
  nextAiringEpisode: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  } | null;
  mappings: Record<string, any>;
}

export interface AniListToHiAnimeSyncData {
  anilistId: number;
  malId: number | null;
  matchedVia: string;
  matchedKeyword: string;
  matchScore: number;
  anilistTitle: {
    romaji: string;
    english: string | null;
    native: string | null;
    userPreferred: string | null;
  };
  anilistMetadata?: {
    format: string | null;
    status: string | null;
    season: string | null;
    seasonYear: number | null;
    episodes: number | null;
    duration: number | null;
    genres: string[];
    coverImage: {
      extraLarge: string | null;
      large: string | null;
      medium: string | null;
      color: string | null;
    };
    bannerImage: string | null;
    trailer: AniListTrailer | null;
  };
  hianime: AnimeDetailsData;
  mappings?: Record<string, any>;
}

