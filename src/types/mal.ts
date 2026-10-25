export interface JikanImageFormats {
  image_url: string | null;
  small_image_url: string | null;
  large_image_url: string | null;
}

export interface JikanImages {
  jpg: JikanImageFormats;
  webp: JikanImageFormats;
}

export interface JikanTrailer {
  youtube_id: string | null;
  url: string | null;
  embed_url: string | null;
  images?: {
    image_url: string | null;
    small_image_url: string | null;
    medium_image_url: string | null;
    large_image_url: string | null;
    maximum_image_url: string | null;
  };
}

export interface JikanTitle {
  type: string;
  title: string;
}

export interface JikanDateProp {
  day: number | null;
  month: number | null;
  year: number | null;
}

export interface JikanAired {
  from: string | null;
  to: string | null;
  prop: {
    from: JikanDateProp;
    to: JikanDateProp;
  };
  string: string | null;
}

export interface JikanBroadcast {
  day: string | null;
  time: string | null;
  timezone: string | null;
  string: string | null;
}

export interface JikanResourceItem {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanAnimeItem {
  mal_id: number;
  url: string;
  images: JikanImages;
  trailer?: JikanTrailer | null;
  approved?: boolean;
  titles: JikanTitle[];
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[];
  type: string | null;
  source?: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  aired: JikanAired;
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background?: string | null;
  season: string | null;
  year: number | null;
  broadcast?: JikanBroadcast;
  producers?: JikanResourceItem[];
  licensors?: JikanResourceItem[];
  studios: JikanResourceItem[];
  genres: JikanResourceItem[];
  explicit_genres?: JikanResourceItem[];
  themes?: JikanResourceItem[];
  demographics?: JikanResourceItem[];
  relations?: Array<{
    relation: string;
    entry: JikanResourceItem[];
  }>;
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page?: number;
  items?: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface JikanAnimeListResponse {
  pagination: JikanPagination;
  data: JikanAnimeItem[];
}

export interface JikanAnimeSingleResponse {
  data: JikanAnimeItem;
}

export interface JikanGenreItem {
  mal_id: number;
  name: string;
  url: string;
  count?: number;
}

export interface JikanEpisodeItem {
  mal_id: number;
  url?: string;
  title: string;
  title_japanese: string | null;
  title_romanji: string | null;
  aired?: string | null;
  score?: number | null;
  filler: boolean;
  recap: boolean;
  forum_url?: string | null;
  image?: string | null;
  summary?: string | null;
}

export interface JikanEpisodesResponse {
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page?: number;
  };
  data: JikanEpisodeItem[];
}

export interface MALHomeData {
  spotlight: JikanAnimeItem[];
  topAiring: JikanAnimeItem[];
  mostPopular: JikanAnimeItem[];
  topRated: JikanAnimeItem[];
  topUpcoming: JikanAnimeItem[];
  genres: JikanGenreItem[];
  schedule: JikanAnimeItem[];
}
