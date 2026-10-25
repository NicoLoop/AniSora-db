import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config/config.js';
import apiRouter from './routes/index.js';

import { renderDashboardHtml } from './views/dashboard.js';
import scraperService from './services/scraper.service.js';
import embedRoutes from './routes/embed.routes.js';
import aniskipRoutes from './routes/aniskip.routes.js';
import localdbRoutes from './routes/localdb.routes.js';

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Root & Health Check routes
app.get('/', (req: Request, res: Response) => {
  const accept = req.headers.accept || '';
  if (req.query.format === 'json' || (accept.includes('application/json') && !accept.includes('text/html'))) {
    res.json({
      name: 'AniSora Apo',
      version: '1.8.2',
      status: 'online',
      activeBaseUrl: scraperService.getActiveBaseUrl(),
      mainBaseUrl: config.baseUrl,
      mirrors: config.mirrors,
      providers: ['hianime', 'anilist', 'mal', 'miruro'],
      endpoints: {
        hianime: {
          home: '/api/v1/hianime/home',
          schedule: '/api/v1/hianime/schedule?date=:date&tzOffset=:tzOffset',
          animeDetails: '/api/v1/hianime/anime/:id',
          episodes: '/api/v1/hianime/episodes/:id',
          servers: '/api/v1/hianime/servers?episodeId=:id',
          downloads: '/api/v1/hianime/downloads?episodeId=:id',
          zokoanimeStream: '/api/v1/hianime/stream/zokoanime?url=:streamUrl',
          hd1Stream: '/api/v1/hianime/stream/hd-1?url=:streamUrl',
          animepaheStream: '/api/v1/hianime/stream/animepahe/:anilistId/:episode/:type?',
          anitakuStream: '/api/v1/hianime/stream/anitaku/:anilistId/:episode/:type?',
          aniwaveStream: '/api/v1/hianime/stream/aniwave/:anilistId/:episode/:type?',
          sync: '/api/v1/hianime/anime/sync/:animeId',
          mirrors: '/api/v1/hianime/mirrors',
          random: '/api/v1/hianime/random',
          searchSuggestions: '/api/v1/hianime/search/suggestions?keyword=:keyword',
          search: '/api/v1/hianime/search?keyword=:keyword&page=1',
          filter: '/api/v1/hianime/filter?type=:type&status=:status&sort=:sort&page=1',
          filterOptions: '/api/v1/hianime/filter/options',
          subbedAnime: '/api/v1/hianime/subbed-anime?page=1',
          dubbedAnime: '/api/v1/hianime/dubbed-anime?page=1',
          mostPopular: '/api/v1/hianime/most-popular?page=1',
          movie: '/api/v1/hianime/movie?page=1',
          tv: '/api/v1/hianime/tv?page=1',
          ova: '/api/v1/hianime/ova?page=1',
          ona: '/api/v1/hianime/ona?page=1',
          special: '/api/v1/hianime/special?page=1',
          genres: '/api/v1/hianime/genres/:genre?page=1',
          azList: '/api/v1/hianime/az-list/:letter?page=1',
        },
        anilist: {
          home: '/api/v1/anilist/home',
          trending: '/api/v1/anilist/trending?page=1',
          popular: '/api/v1/anilist/popular?page=1',
          topRated: '/api/v1/anilist/top-rated?page=1',
          movie: '/api/v1/anilist/movie?page=1',
          tv: '/api/v1/anilist/tv?page=1',
          ova: '/api/v1/anilist/ova?page=1',
          ona: '/api/v1/anilist/ona?page=1',
          special: '/api/v1/anilist/special?page=1',
          genres: '/api/v1/anilist/genres',
          animeByGenre: '/api/v1/anilist/genres/:genre?page=1',
          azList: '/api/v1/anilist/az-list/:letter?page=1',
          searchSuggestions: '/api/v1/anilist/search/suggestions?keyword=:keyword',
          search: '/api/v1/anilist/search?keyword=:keyword&page=1',
          filter: '/api/v1/anilist/filter?format=:format&genre=:genre&page=1',
          filterOptions: '/api/v1/anilist/filter/options',
          schedule: '/api/v1/anilist/schedule?date=:date',
          random: '/api/v1/anilist/random',
          animeDetails: '/api/v1/anilist/anime/:id',
          episodes: '/api/v1/anilist/episodes/:id',
          sync: '/api/v1/anilist/sync/:anilistId',
        },
        mal: {
          home: '/api/v1/mal/home',
          trending: '/api/v1/mal/trending?page=1',
          popular: '/api/v1/mal/popular?page=1',
          topRated: '/api/v1/mal/top-rated?page=1',
          movie: '/api/v1/mal/movie?page=1',
          tv: '/api/v1/mal/tv?page=1',
          ova: '/api/v1/mal/ova?page=1',
          ona: '/api/v1/mal/ona?page=1',
          special: '/api/v1/mal/special?page=1',
          genres: '/api/v1/mal/genres',
          animeByGenre: '/api/v1/mal/genres/:genre?page=1',
          azList: '/api/v1/mal/az-list/:letter?page=1',
          searchSuggestions: '/api/v1/mal/search/suggestions?keyword=:keyword',
          search: '/api/v1/mal/search?keyword=:keyword&page=1',
          filter: '/api/v1/mal/filter?type=:type&rating=:rating&page=1',
          filterOptions: '/api/v1/mal/filter/options',
          schedule: '/api/v1/mal/schedule?day=:day',
          random: '/api/v1/mal/random',
          animeDetails: '/api/v1/mal/anime/:id',
          episodes: '/api/v1/mal/episodes/:id',
          sync: '/api/v1/mal/sync/:malId',
        },
        miruro: {
          home: '/api/v1/miruro/home',
          trending: '/api/v1/miruro/trending?page=1',
          popular: '/api/v1/miruro/popular?page=1',
          topRated: '/api/v1/miruro/top-rated?page=1',
          topAiring: '/api/v1/miruro/top-airing?page=1',
          movie: '/api/v1/miruro/movie?page=1',
          tv: '/api/v1/miruro/tv?page=1',
          ova: '/api/v1/miruro/ova?page=1',
          ona: '/api/v1/miruro/ona?page=1',
          special: '/api/v1/miruro/special?page=1',
          subbedAnime: '/api/v1/miruro/subbed-anime?page=1',
          dubbedAnime: '/api/v1/miruro/dubbed-anime?page=1',
          genres: '/api/v1/miruro/genres',
          animeByGenre: '/api/v1/miruro/genres/:genre?page=1',
          azList: '/api/v1/miruro/az-list/:letter?page=1',
          searchSuggestions: '/api/v1/miruro/search/suggestions?keyword=:keyword',
          search: '/api/v1/miruro/search?keyword=:keyword&page=1',
          filter: '/api/v1/miruro/filter?format=:format&genres=:genres&status=:status&page=1',
          filterOptions: '/api/v1/miruro/filter/options',
          schedule: '/api/v1/miruro/schedule?date=:date',
          random: '/api/v1/miruro/random',
          animeDetails: '/api/v1/miruro/anime/:id',
          episodes: '/api/v1/miruro/episodes/:id',
          servers: '/api/v1/miruro/servers?episodeId=:id',
          embed: '/api/v1/miruro/embed?animeId=:id&episode=:ep&category=sub',
          stream: '/api/v1/miruro/stream?id=:id&ep=:ep&server=:server&category=sub',
          sync: '/api/v1/miruro/sync/:id',
        },
        universalEmbed: {
          embed: '/embed?id=:id&ep=:episode&category=sub',
          embedPath: '/embed/:id/:episode/:category?',
          apiV1Embed: '/api/v1/embed?id=:id&ep=:episode',
          playerPreview: '/embed?id=:id&ep=:episode&player=true',
        },
        aniskip: {
          skipTimes: '/skip-times?id=:id&ep=:episode',
          skipTimesPath: '/skip-times/:id/:episode',
          apiV1SkipTimes: '/api/v1/skip-times/:id/:episode',
          apiV1AniSkip: '/api/v1/aniskip/:id/:episode',
        },
        health: '/health',
      },
    });
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderDashboardHtml());
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activeBaseUrl: scraperService.getActiveBaseUrl(),
    mainBaseUrl: config.baseUrl,
    mirrors: config.mirrors,
    timestamp: new Date().toISOString(),
  });
});

// Universal Root Embed: /embed?id=...&ep=...
app.use('/embed', embedRoutes);

// Universal Root Skip Times (AniSkip): /skip-times?id=...&ep=... and /aniskip
app.use('/skip-times', aniskipRoutes);
app.use('/aniskip', aniskipRoutes);
// LocalDB Fast Sync: /localdb/sync
app.use('/localdb', localdbRoutes);

// API Routes
app.use('/api/v1', apiRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('[GlobalErrorHandler]', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

export default app;
