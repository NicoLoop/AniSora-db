import { AnimeCard, SpotlightAnime, TrendingAnime, AnimeEpisodes } from './anime.js';

export interface MiruroTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
}

export interface MiruroExternalIds {
  mal?: string[];
  anilist?: string[];
  kitsu?: string[];
  imdb?: string[];
  tvdb?: string[];
  anidb?: string[];
  simkl?: string[];
  tmdb_tv?: string[];
  tmdb_movie?: string[];
  tvdb_movie?: string[];
  wikidata?: string[];
  anisearch?: string[];
  livechart?: string[];
  animethemes?: string[];
  anime_planet?: string[];
  animeschedule?: string[];
  animecountdown?: string[];
  animefillerlist?: string[];
  animefillerguide?: string[];
  animenewsnetwork?: string[];
}

export interface MiruroEpisodeCounts {
  raw?: number | null;
  sub?: number | null;
  dub?: number | null;
}

export interface MiruroNextAiring {
  episode_number: number;
  air_at: string;
}

export interface MiruroAnimeItem {
  id: string;
  external_ids?: MiruroExternalIds;
  externalIds?: MiruroExternalIds;
  title: MiruroTitle;
  format?: string | null;
  status?: string | null;
  source?: string | null;
  country_of_origin?: string | null;
  episode_count?: number | null;
  episode_counts?: MiruroEpisodeCounts;
  episode_duration_minutes?: number | null;
  durationMinutes?: number | null;
  season?: string | null;
  season_year?: number | null;
  seasonYear?: number | null;
  average_score?: number | null;
  averageScore?: number | null;
  mal_score?: number | null;
  malScore?: number | null;
  popularity?: number | null;
  is_adult?: boolean;
  description?: string | null;
  cover_url?: string | null;
  coverUrl?: string | null;
  cover_color?: string | null;
  coverColor?: string | null;
  banner_url?: string | null;
  backdropUrl?: string | null;
  backdropUrls?: string[];
  background_url?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  next_airing?: MiruroNextAiring | null;
  nextAiring?: MiruroNextAiring | null;
  trailer_youtube_id?: string | null;
  trailerYoutubeId?: string | null;
  genres?: string[];
  tags?: string[];
  studios?: string[];
  show_cluster_position?: number | null;
}

export interface MiruroAlternateTitle {
  value: string;
  kind?: string | null;
  language?: string | null;
}

export interface MiruroAnimeDetail extends MiruroAnimeItem {
  alternate_titles?: MiruroAlternateTitle[];
  started_on?: string | null;
  ended_on?: string | null;
  broadcast?: {
    day_of_week?: string | null;
    time?: string | null;
    timezone?: string | null;
  } | null;
  characters?: Array<{
    id: string;
    name: string;
    role?: string | null;
    image?: string | null;
  }>;
  relations?: Array<{
    id: string;
    relation_type?: string | null;
    media?: MiruroAnimeItem;
  }>;
  recommendations?: MiruroAnimeItem[];
  artworks?: Array<{
    type?: string;
    url?: string;
  }>;
}

export interface MiruroEpisode {
  id: string;
  number: number;
  title?: string | null;
  image?: string | null;
  airDate?: string | null;
  duration?: number | null;
  description?: string | null;
  filler?: boolean;
}

export interface MiruroStream {
  url?: string | null;
  format?: string | null;
  quality?: string | null;
  resolution?: {
    width?: number;
    height?: number;
  } | null;
  codec?: string | null;
  embed?: {
    url?: string | null;
  } | null;
}

export interface MiruroDownload {
  url: string;
  quality?: string | null;
  size?: string | null;
  fansub?: string | null;
}

export interface MiruroSubtitle {
  language: string;
  label: string;
  file: string;
  format?: string;
  default?: boolean;
}

export interface MiruroServerItem {
  server: string;
  headers?: Record<string, string> | null;
  streams?: MiruroStream[];
  embed?: {
    url?: string | null;
  } | null;
}

export interface MiruroProviderItem {
  provider: string;
  servers?: MiruroServerItem[];
  subtitles?: MiruroSubtitle[];
  thumbnails?: {
    vtt?: string | null;
    sprite?: string | null;
  } | null;
  downloads?: MiruroDownload[];
}

export interface MiruroTrack {
  track: 'sub' | 'dub' | 'ssub' | 'raw' | string;
  providers?: MiruroProviderItem[];
}

export interface MiruroServerInfo {
  serverId: string;
  serverName: string;
  provider: string;
  category: 'sub' | 'dub' | 'raw' | 'ssub';
  hasEmbed: boolean;
  embedUrl?: string | null;
}

export interface MiruroEpisodeServersResponse {
  animeId: string;
  episodeId: string;
  episodeNumber: number;
  sub: MiruroServerInfo[];
  dub: MiruroServerInfo[];
  raw: MiruroServerInfo[];
}

export interface MiruroEmbedResponse {
  animeId: string;
  episodeNumber: number;
  category: string;
  server: string;
  provider: string;
  embedUrl: string;
  fallbackEmbedUrl?: string;
  headers?: Record<string, string> | null;
  subtitles: Array<{
    lang: string;
    label: string;
    src: string;
    default?: boolean;
  }>;
  thumbnails?: {
    vtt?: string | null;
    sprite?: string | null;
  } | null;
  downloads?: Array<{
    url: string;
    quality?: string | null;
    size?: string | null;
    fansub?: string | null;
  }>;
}

export interface MiruroScheduleEntry {
  id: string;
  airingAt: number;
  airingDate?: string;
  airingTime?: string;
  episode: number;
  track?: string;
  media: MiruroAnimeItem;
}

export interface MiruroHomeData {
  spotlights: SpotlightAnime[];
  trendingAnimes: TrendingAnime[];
  latestEpisodeAnimes: AnimeCard[];
  topUpcomingAnimes: AnimeCard[];
  topAiringAnimes: AnimeCard[];
  mostPopularAnimes: AnimeCard[];
  genres: string[];
}

export interface MiruroSearchFilters {
  q?: string;
  cursor?: string;
  sort?: string;
  format?: string;
  status?: string;
  genres?: string;
  season?: string;
  country?: string;
  tracks?: string;
  yearFrom?: string | number;
  yearTo?: string | number;
  minScore?: string | number;
  maxScore?: string | number;
  page?: number;
  limit?: number;
}

export interface MiruroStreamSource {
  url: string;
  proxyUrl: string;
  isM3U8: boolean;
  quality?: string | null;
  format?: string | null;
}

export interface MiruroStreamSubtitle {
  lang: string;
  label: string;
  src: string;
  proxyUrl: string;
  default?: boolean;
}

export interface MiruroStreamResponse {
  animeId: string;
  episodeNumber: number;
  category: 'sub' | 'dub' | 'raw';
  server: string;
  provider: string;
  availableServers: string[];
  sources: MiruroStreamSource[];
  m3u8: string | null;
  proxyM3U8: string | null;
  headers: Record<string, string>;
  embedUrl?: string | null;
  subtitles: MiruroStreamSubtitle[];
  thumbnails?: {
    vtt?: string | null;
    sprite?: string | null;
  } | null;
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
  downloads?: Array<{
    url: string;
    quality?: string | null;
    size?: string | null;
    fansub?: string | null;
  }>;
}

