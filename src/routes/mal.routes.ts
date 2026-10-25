import { Router } from 'express';
import { malController } from '../controllers/mal.controller.js';
import { embedController } from '../controllers/embed.controller.js';
import { aniSkipController } from '../controllers/aniskip.controller.js';

const router = Router();

// ==========================================
// MYANIMELIST (MAL - JIKAN) PROVIDER ROUTES (/api/v1/mal/...)
// ==========================================

// 1. Home Highlights Feed
// GET /api/v1/mal/home
router.get('/home', (req, res) => malController.getHome(req, res));

// 2. Trending Anime (Top Airing)
// GET /api/v1/mal/trending?page=1&limit=25
// GET /api/v1/mal/top-airing
router.get('/trending', (req, res) => malController.getTrending(req, res));
router.get('/top-airing', (req, res) => malController.getTrending(req, res));

// 3. Most Popular Anime
// GET /api/v1/mal/popular?page=1&limit=25
// GET /api/v1/mal/most-popular
router.get('/popular', (req, res) => malController.getPopular(req, res));
router.get('/most-popular', (req, res) => malController.getPopular(req, res));

// 4. Top Rated / Top Score Anime
// GET /api/v1/mal/top-rated?page=1&limit=25
// GET /api/v1/mal/top-10
// GET /api/v1/mal/top
router.get('/top-rated', (req, res) => malController.getTopRated(req, res));
router.get('/top-10', (req, res) => malController.getTopRated(req, res));
router.get('/top', (req, res) => malController.getTopRated(req, res));

// 5. Category / Format Shortcuts
// Movies
router.get('/movie', (req, res) => malController.getMovies(req, res));
router.get('/movies', (req, res) => malController.getMovies(req, res));

// TV Series
router.get('/tv', (req, res) => malController.getTvSeries(req, res));
router.get('/tv-series', (req, res) => malController.getTvSeries(req, res));

// OVAs
router.get('/ova', (req, res) => malController.getOvas(req, res));
router.get('/ovas', (req, res) => malController.getOvas(req, res));

// ONAs
router.get('/ona', (req, res) => malController.getOnas(req, res));
router.get('/onas', (req, res) => malController.getOnas(req, res));

// Specials
router.get('/special', (req, res) => malController.getSpecials(req, res));
router.get('/specials', (req, res) => malController.getSpecials(req, res));

// Subbed & Dubbed Anime
router.get('/subbed-anime', (req, res) => malController.getSubbedAnime(req, res));
router.get('/subbed', (req, res) => malController.getSubbedAnime(req, res));
router.get('/dubbed-anime', (req, res) => malController.getDubbedAnime(req, res));
router.get('/dubbed', (req, res) => malController.getDubbedAnime(req, res));

// Generic Category: GET /api/v1/mal/category/:category?page=1&limit=25
router.get('/category/:category', (req, res) => malController.getCategory(req, res));

// 6. Genres
// GET /api/v1/mal/genres
// GET /api/v1/mal/genres/:genre?page=1&limit=25
// GET /api/v1/mal/genre/:genre
router.get('/genres', (req, res) => malController.getGenres(req, res));
router.get('/genres/:genre', (req, res) => malController.getAnimeByGenre(req, res));
router.get('/genre/:genre', (req, res) => malController.getAnimeByGenre(req, res));

// 7. A-Z List Directory
// GET /api/v1/mal/az-list/:letter?page=1&limit=25
// GET /api/v1/mal/az-list?letter=A
router.get('/az-list/:letter', (req, res) => malController.getAZList(req, res));
router.get('/az-list', (req, res) => malController.getAZList(req, res));

// 8. Search Suggestions
// GET /api/v1/mal/search/suggestions?keyword=naruto
// GET /api/v1/mal/suggestions?keyword=naruto
router.get('/search/suggestions', (req, res) => malController.getSuggestions(req, res));
router.get('/suggestions', (req, res) => malController.getSuggestions(req, res));

// 9. Catalog Search
// GET /api/v1/mal/search?keyword=naruto&page=1&limit=25
// GET /api/v1/mal/browse?keyword=naruto
router.get('/search', (req, res) => malController.searchAnime(req, res));
router.get('/browse', (req, res) => malController.searchAnime(req, res));

// 10. Filter Options & Filter Endpoint
// GET /api/v1/mal/filter/options
// GET /api/v1/mal/search/filter/options
// GET /api/v1/mal/filter?type=tv&rating=pg13
// GET /api/v1/mal/search/filter
router.get('/filter/options', (req, res) => malController.getFilterOptions(req, res));
router.get('/search/filter/options', (req, res) => malController.getFilterOptions(req, res));
router.get('/filter', (req, res) => malController.filterAnime(req, res));
router.get('/search/filter', (req, res) => malController.filterAnime(req, res));

// 11. Airing Schedule
// GET /api/v1/mal/schedule?day=monday
// GET /api/v1/mal/anime/schedule
router.get('/schedule', (req, res) => malController.getSchedule(req, res));
router.get('/anime/schedule', (req, res) => malController.getSchedule(req, res));

// 12. Random Anime
// GET /api/v1/mal/random
router.get('/random', (req, res) => malController.getRandomAnime(req, res));

// 13. Anime Details
// GET /api/v1/mal/anime/:id
// GET /api/v1/mal/animeDetails/:id
router.get('/anime/:id', (req, res) => malController.getAnimeDetails(req, res));
router.get('/animeDetails/:id', (req, res) => malController.getAnimeDetails(req, res));

// 14. Episodes List
// GET /api/v1/mal/episodes/:id?page=1
// GET /api/v1/mal/anime/:id/episodes
router.get('/episodes/:id', (req, res) => malController.getEpisodes(req, res));
router.get('/anime/:id/episodes', (req, res) => malController.getEpisodes(req, res));

// 15. Reverse Sync (MAL ID -> HiAnime / AniList Data)
// GET /api/v1/mal/sync/:malId
// GET /api/v1/mal/sync?id=1
router.get('/sync/:malId', (req, res) => malController.syncAnime(req, res));
router.get('/sync', (req, res) => malController.syncAnime(req, res));

// 16. Universal Embed URL & Stream Sources
// GET /api/v1/mal/embed?id=21&ep=1
// GET /api/v1/mal/embed/:id/:episode?
router.get('/embed', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'mal';
  return embedController.getEmbed(req, res);
});
router.get('/embed/:id', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'mal';
  return embedController.getEmbed(req, res);
});
router.get('/embed/:id/:episode', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'mal';
  return embedController.getEmbed(req, res);
});

// 17. AniSkip Intro & Outro Skip Times
// GET /api/v1/mal/skip-times?id=21&ep=1
// GET /api/v1/mal/skip-times/:id/:episode
router.get('/skip-times', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'mal';
  return aniSkipController.getSkipTimes(req, res);
});
router.get('/skip-times/:id', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'mal';
  return aniSkipController.getSkipTimes(req, res);
});
router.get('/skip-times/:id/:episode', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'mal';
  return aniSkipController.getSkipTimes(req, res);
});

export default router;
