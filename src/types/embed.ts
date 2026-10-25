export interface UniversalEmbedAnimeInfo {
  id: string;
  resolvedId: string;
  title: {
    english: string | null;
    romaji: string | null;
    native: string | null;
    userPreferred: string | null;
  };
  poster: string | null;
  banner: string | null;
  description: string | null;
  format: string | null;
  status: string | null;
  season?: string | null;
  year?: number | null;
  totalEpisodes: number | null;
  currentEpisode: number;
  episodeTitle?: string | null;
  episodeThumbnail?: string | null;
  episodeAired?: string | null;
  episodeDuration?: string | null;
  genres: string[];
  rating?: string | null;
  duration?: string | null;
}

export interface UniversalCrossMappings {
  anilistId: number | null;
  malId: number | null;
  kitsuId?: number | null;
  anidbId?: number | null;
  thetvdbId?: number | null;
  hianime?: {
    animeId: string;
    episodeId: string | null;
    episodeNo: number;
  } | null;
  miruro?: {
    id: string;
    slug?: string;
    episodeId: string | null;
    episodeNo: number;
  } | null;
}

export interface UniversalSubtitleItem {
  language: string;
  url: string;
  proxyUrl?: string;
  format?: string;
  default?: boolean;
}

export interface UniversalThumbnailItem {
  url?: string;
  vtt?: string | null;
  sprite?: string | null;
  format?: string;
}

export interface UniversalDownloadItem {
  resolution?: string;
  quality?: string | null;
  url: string;
  size?: string | null;
  fansub?: string | null;
  provider?: string | null;
}

export interface UniversalEmbedItem {
  server: string;
  provider: 'miruro' | 'hianime' | 'zoko' | 'megaplay' | 'animepahe' | 'anitaku' | 'aniwave' | string;
  category: 'sub' | 'dub' | 'raw';
  embedUrl: string;
  fallbackEmbedUrl?: string | null;
  type: 'iframe' | 'hls' | 'direct';
  quality?: string;
  subtitles?: UniversalSubtitleItem[];
  thumbnails?: UniversalThumbnailItem | null;
  downloads?: UniversalDownloadItem[] | null;
  headers?: Record<string, string> | null;
}

export interface UniversalStreamSource {
  server: string;
  provider: string;
  category: 'sub' | 'dub' | 'raw';
  url: string;
  proxyUrl?: string | null;
  quality?: string;
  isM3U8?: boolean;
  headers?: Record<string, string> | null;
  intro?: UniversalSkipInterval | null;
  outro?: UniversalSkipInterval | null;
  thumbnails?: string | null;
}

export interface UniversalServerOption {
  serverId?: number | string;
  serverName: string;
  provider: string;
  category: 'sub' | 'dub' | 'raw';
  embedUrl?: string | null;
  hasStream: boolean;
  hasEmbed: boolean;
  intro?: UniversalSkipInterval | null;
  outro?: UniversalSkipInterval | null;
}

export interface UniversalSkipInterval {
  start: number;
  end: number;
}

export interface UniversalEmbedData {
  anime: UniversalEmbedAnimeInfo;
  mappings: UniversalCrossMappings;
  primaryEmbed: UniversalEmbedItem | null;
  embeds: UniversalEmbedItem[];
  streams: UniversalStreamSource[];
  servers: {
    sub: UniversalServerOption[];
    dub: UniversalServerOption[];
    raw: UniversalServerOption[];
  };
  subtitles: UniversalSubtitleItem[];
  thumbnails: UniversalThumbnailItem | null;
  intro?: UniversalSkipInterval | null;
  outro?: UniversalSkipInterval | null;
  downloads: UniversalDownloadItem[];
}
