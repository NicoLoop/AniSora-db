import { Router } from 'express';
import { miruroController } from '../controllers/miruro.controller.js';
import { embedController } from '../controllers/embed.controller.js';
import { aniSkipController } from '../controllers/aniskip.controller.js';

const router = Router();

// ==========================================
// MIRURO ANIME PROVIDER ROUTES (/api/v1/miruro/...)
// ==========================================

// 1. Home Highlights Feed
// GET /api/v1/miruro/home
router.get('/home', (req, res) => miruroController.getHome(req, res));

// 2. Trending Anime
// GET /api/v1/miruro/trending?page=1
router.get('/trending', (req, res) => miruroController.getTrending(req, res));

// 3. Most Popular Anime
// GET /api/v1/miruro/most-popular?page=1
// GET /api/v1/miruro/popular
router.get('/most-popular', (req, res) => miruroController.getPopular(req, res));
router.get('/popular', (req, res) => miruroController.getPopular(req, res));

// 4. Top Rated Anime
// GET /api/v1/miruro/top-rated?page=1
// GET /api/v1/miruro/top-10
router.get('/top-rated', (req, res) => miruroController.getTopRated(req, res));
router.get('/top-10', (req, res) => miruroController.getTopRated(req, res));
router.get('/top', (req, res) => miruroController.getTopRated(req, res));

// 5. Top Airing Anime
// GET /api/v1/miruro/top-airing?page=1
router.get('/top-airing', (req, res) => miruroController.getTopAiring(req, res));

// 6. Category / Format Shortcuts
// Movies
router.get('/movie', (req, res) => miruroController.getMovies(req, res));
router.get('/movies', (req, res) => miruroController.getMovies(req, res));

// TV Series
router.get('/tv', (req, res) => miruroController.getTvSeries(req, res));
router.get('/tv-series', (req, res) => miruroController.getTvSeries(req, res));

// OVAs
router.get('/ova', (req, res) => miruroController.getOvas(req, res));
router.get('/ovas', (req, res) => miruroController.getOvas(req, res));

// ONAs
router.get('/ona', (req, res) => miruroController.getOnas(req, res));
router.get('/onas', (req, res) => miruroController.getOnas(req, res));

// Specials
router.get('/special', (req, res) => miruroController.getSpecials(req, res));
router.get('/specials', (req, res) => miruroController.getSpecials(req, res));

// Subbed & Dubbed Anime
router.get('/subbed-anime', (req, res) => miruroController.getSubbedAnime(req, res));
router.get('/subbed', (req, res) => miruroController.getSubbedAnime(req, res));
router.get('/dubbed-anime', (req, res) => miruroController.getDubbedAnime(req, res));
router.get('/dubbed', (req, res) => miruroController.getDubbedAnime(req, res));

// Generic Category: GET /api/v1/miruro/category/:category?page=1
router.get('/category/:category', (req, res) => miruroController.getCategory(req, res));

// 7. Genres
// GET /api/v1/miruro/genres
// GET /api/v1/miruro/genres/:genre?page=1
// GET /api/v1/miruro/genre/:genre
router.get('/genres', (req, res) => miruroController.getGenres(req, res));
router.get('/genres/:genre', (req, res) => miruroController.getAnimeByGenre(req, res));
router.get('/genre/:genre', (req, res) => miruroController.getAnimeByGenre(req, res));

// 8. A-Z List Directory
// GET /api/v1/miruro/az-list/:letter?page=1
// GET /api/v1/miruro/az-list?letter=A
router.get('/az-list/:letter', (req, res) => miruroController.getAZList(req, res));
router.get('/az-list', (req, res) => miruroController.getAZList(req, res));

// 9. Search Suggestions
// GET /api/v1/miruro/search/suggestions?keyword=naruto
// GET /api/v1/miruro/suggestions?keyword=naruto
router.get('/search/suggestions', (req, res) => miruroController.getSuggestions(req, res));
router.get('/suggestions', (req, res) => miruroController.getSuggestions(req, res));

// 10. Catalog Search
// GET /api/v1/miruro/search?keyword=naruto&page=1
// GET /api/v1/miruro/browse?keyword=naruto
router.get('/search', (req, res) => miruroController.searchAnime(req, res));
router.get('/browse', (req, res) => miruroController.searchAnime(req, res));

// 11. Filter Options & Filter Endpoint
// GET /api/v1/miruro/filter/options
// GET /api/v1/miruro/filter?format=TV&genres=Action&status=FINISHED
router.get('/filter/options', (req, res) => miruroController.getFilterOptions(req, res));
router.get('/search/filter/options', (req, res) => miruroController.getFilterOptions(req, res));
router.get('/filter', (req, res) => miruroController.filterAnime(req, res));
router.get('/search/filter', (req, res) => miruroController.filterAnime(req, res));

// 12. Airing Schedule
// GET /api/v1/miruro/schedule?date=2026-10-24
// GET /api/v1/miruro/anime/schedule
router.get('/schedule', (req, res) => miruroController.getSchedule(req, res));
router.get('/anime/schedule', (req, res) => miruroController.getSchedule(req, res));

// 13. Random Anime
// GET /api/v1/miruro/random
router.get('/random', (req, res) => miruroController.getRandomAnime(req, res));

// 14. Anime Details
// GET /api/v1/miruro/anime/:id
// GET /api/v1/miruro/animeDetails/:id
// GET /api/v1/miruro/info/:id
router.get('/anime/:id', (req, res) => miruroController.getAnimeDetails(req, res));
router.get('/animeDetails/:id', (req, res) => miruroController.getAnimeDetails(req, res));
router.get('/info/:id', (req, res) => miruroController.getAnimeDetails(req, res));

// 15. Episodes List
// GET /api/v1/miruro/episodes/:id
// GET /api/v1/miruro/anime/:id/episodes
router.get('/episodes/:id', (req, res) => miruroController.getEpisodes(req, res));
router.get('/anime/:id/episodes', (req, res) => miruroController.getEpisodes(req, res));

// 16. Episode Servers
// GET /api/v1/miruro/servers?episodeId=...
// GET /api/v1/miruro/servers/:episodeId
// GET /api/v1/miruro/episode/servers?episodeId=...
router.get('/servers', (req, res) => miruroController.getServers(req, res));
router.get('/servers/:episodeId', (req, res) => miruroController.getServers(req, res));
router.get('/episode/servers', (req, res) => miruroController.getServers(req, res));

// 17. Episode Embed URL / Sources (Unified format)
// GET /api/v1/miruro/embed?animeId=...&episode=1&server=...&category=sub
// GET /api/v1/miruro/embed/:id/:episode?
// GET /api/v1/miruro/episode/sources?animeId=...&ep=1
router.get('/embed', (req, res) => miruroController.getSources(req, res));
router.get('/embed/:id', (req, res) => miruroController.getSources(req, res));
router.get('/embed/:id/:episode', (req, res) => miruroController.getSources(req, res));
router.get('/episode/sources', (req, res) => miruroController.getSources(req, res));
router.get('/episode/embed', (req, res) => miruroController.getSources(req, res));

// 18. Episode Direct Streams with Proxy
// GET /api/v1/miruro/stream?id=...&ep=1&server=...&category=sub
// GET /api/v1/miruro/stream/:id/:episode?
// GET /api/v1/miruro/episode/stream
router.get('/stream', (req, res) => miruroController.getStream(req, res));
router.get('/stream/:id', (req, res) => miruroController.getStream(req, res));
router.get('/stream/:id/:episode', (req, res) => miruroController.getStream(req, res));
router.get('/episode/stream', (req, res) => miruroController.getStream(req, res));

// 19. Sync / Reverse Sync
// GET /api/v1/miruro/sync/:id
// GET /api/v1/miruro/sync?id=...
router.get('/sync/:id', (req, res) => miruroController.syncAnime(req, res));
router.get('/sync', (req, res) => miruroController.syncAnime(req, res));

// 19. AniSkip Intro & Outro Skip Times
// GET /api/v1/miruro/skip-times?id=...&ep=1
// GET /api/v1/miruro/skip-times/:id/:episode
router.get('/skip-times', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'miruro';
  return aniSkipController.getSkipTimes(req, res);
});
router.get('/skip-times/:id', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'miruro';
  return aniSkipController.getSkipTimes(req, res);
});
router.get('/skip-times/:id/:episode', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'miruro';
  return aniSkipController.getSkipTimes(req, res);
});

export default router;
