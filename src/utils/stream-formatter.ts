export interface UnifiedSourceItem {
  url: string;
  type: 'stream' | 'subtitle' | 'thumbnail' | 'video preview image';
  label: string;
  lang?: string;
}

export interface UnifiedTimestamp {
  intro: { start: number; end: number } | null;
  outro: { start: number; end: number } | null;
}

export interface UnifiedServerStreamItem {
  server: string;
  provider: string;
  cat: 'sub' | 'dub' | 'raw';
  streamurl: string | null;
  embedurl: string | null;
  proxyUrl: string | null;
  thumbnail: string | null; // progressbar preview (VTT)
  subtitle: Array<{
    url: string;
    label: string;
    lang: string;
    default?: boolean;
  }>;
  sources: UnifiedSourceItem[];
  timestamp: UnifiedTimestamp;
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
  // Extra convenience & backwards compatibility fields
  streamingLink?: string;
  file?: string;
  m3u8?: string | null;
  proxyM3U8?: string | null;
  subtitles?: Array<{ lang: string; label: string; src: string; default?: boolean }>;
  thumbnails?: string | null;
  downloadUrl?: string | null;
  downloads?: any[];
  headers?: Record<string, string> | null;
  raw?: any;
}

export interface BuildUnifiedStreamOptions {
  server: string;
  provider: string;
  category: string;
  streamUrl?: string | null;
  embedUrl?: string | null;
  proxyUrl?: string | null;
  thumbnailVtt?: string | null;
  videoPreviewImage?: string | null;
  subtitles?: Array<{
    url?: string;
    src?: string;
    file?: string;
    label?: string;
    lang?: string;
    language?: string;
    default?: boolean;
  }>;
  intro?: { start: number; end: number } | null;
  outro?: { start: number; end: number } | null;
  downloadUrl?: string | null;
  downloads?: any[];
  headers?: Record<string, string> | null;
  raw?: any;
}

export function buildUnifiedServerStreamItem(options: BuildUnifiedStreamOptions): UnifiedServerStreamItem {
  const cat =
    options.category.toLowerCase() === 'dub'
      ? 'dub'
      : options.category.toLowerCase() === 'raw'
      ? 'raw'
      : 'sub';

  const streamurl = options.streamUrl || null;
  const embedurl = options.embedUrl || null;
  const proxyUrl = options.proxyUrl || null;
  const thumbnail = options.thumbnailVtt || null;

  const intro =
    options.intro && (options.intro.start > 0 || options.intro.end > 0)
      ? { start: options.intro.start, end: options.intro.end }
      : null;

  const outro =
    options.outro && (options.outro.start > 0 || options.outro.end > 0)
      ? { start: options.outro.start, end: options.outro.end }
      : null;

  const subtitle = (options.subtitles || [])
    .map((s) => ({
      url: s.url || s.src || s.file || '',
      label: s.label || s.lang || s.language || 'English',
      lang: s.lang || s.language || s.label || 'English',
      default: Boolean(s.default),
    }))
    .filter((s) => Boolean(s.url));

  const sources: UnifiedSourceItem[] = [];

  if (streamurl) {
    sources.push({
      url: streamurl,
      type: 'stream',
      label: streamurl.includes('.m3u8') ? 'hls' : 'mp4',
    });
  }

  for (const sub of subtitle) {
    sources.push({
      url: sub.url,
      type: 'subtitle',
      label: sub.label,
      lang: sub.lang,
    });
  }

  if (thumbnail) {
    sources.push({
      url: thumbnail,
      type: 'thumbnail',
      label: 'preview',
    });
  }

  if (options.videoPreviewImage) {
    sources.push({
      url: options.videoPreviewImage,
      type: 'video preview image',
      label: 'thumbnail',
    });
  }

  return {
    server: options.server,
    provider: options.provider,
    cat,
    streamurl,
    embedurl,
    proxyUrl,
    thumbnail,
    subtitle,
    sources,
    timestamp: {
      intro,
      outro,
    },
    intro,
    outro,
    // Backwards compatibility properties
    streamingLink: embedurl || options.downloadUrl || undefined,
    file: streamurl || undefined,
    m3u8: streamurl,
    proxyM3U8: proxyUrl,
    subtitles: subtitle.map((s) => ({
      lang: s.lang,
      label: s.label,
      src: s.url,
      default: s.default,
    })),
    thumbnails: thumbnail,
    downloadUrl: options.downloadUrl || null,
    downloads: options.downloads || [],
    headers: options.headers || null,
    raw: options.raw || undefined,
  };
}
