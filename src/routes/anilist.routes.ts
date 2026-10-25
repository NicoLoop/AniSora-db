import { Router } from 'express';
import { syncController } from '../controllers/sync.controller.js';
import { aniListController } from '../controllers/anilist.controller.js';
import { embedController } from '../controllers/embed.controller.js';
import { aniSkipController } from '../controllers/aniskip.controller.js';

const router = Router();

// ==========================================
// ANILIST ANIME PROVIDER ROUTES (/api/v1/anilist/...)
// ==========================================

// 1. Home Highlights Feed
// GET /api/v1/anilist/home
router.get('/home', (req, res) => aniListController.getHome(req, res));

// 2. Trending Anime
// GET /api/v1/anilist/trending?page=1&perPage=20
router.get('/trending', (req, res) => aniListController.getTrending(req, res));

// 3. Most Popular Anime
// GET /api/v1/anilist/most-popular?page=1&perPage=20
// GET /api/v1/anilist/popular
router.get('/most-popular', (req, res) => aniListController.getPopular(req, res));
router.get('/popular', (req, res) => aniListController.getPopular(req, res));

// 4. Top Rated Anime
// GET /api/v1/anilist/top-rated?page=1&perPage=20
// GET /api/v1/anilist/top-10
router.get('/top-rated', (req, res) => aniListController.getTopRated(req, res));
router.get('/top-10', (req, res) => aniListController.getTopRated(req, res));

// 5. Category / Format Shortcuts
// Movies
router.get('/movie', (req, res) => aniListController.getMovies(req, res));
router.get('/movies', (req, res) => aniListController.getMovies(req, res));

// TV Series
router.get('/tv', (req, res) => aniListController.getTvSeries(req, res));
router.get('/tv-series', (req, res) => aniListController.getTvSeries(req, res));

// OVAs
router.get('/ova', (req, res) => aniListController.getOvas(req, res));
router.get('/ovas', (req, res) => aniListController.getOvas(req, res));

// ONAs
router.get('/ona', (req, res) => aniListController.getOnas(req, res));
router.get('/onas', (req, res) => aniListController.getOnas(req, res));

// Specials
router.get('/special', (req, res) => aniListController.getSpecials(req, res));
router.get('/specials', (req, res) => aniListController.getSpecials(req, res));

// Subbed & Dubbed Anime
router.get('/subbed-anime', (req, res) => aniListController.getSubbedAnime(req, res));
router.get('/subbed', (req, res) => aniListController.getSubbedAnime(req, res));
router.get('/dubbed-anime', (req, res) => aniListController.getDubbedAnime(req, res));
router.get('/dubbed', (req, res) => aniListController.getDubbedAnime(req, res));

// Generic Category: GET /api/v1/anilist/category/:category?page=1
router.get('/category/:category', (req, res) => aniListController.getCategory(req, res));

// 6. Genres
// GET /api/v1/anilist/genres
// GET /api/v1/anilist/genres/:genre?page=1
// GET /api/v1/anilist/genre/:genre
router.get('/genres', (req, res) => aniListController.getGenres(req, res));
router.get('/genres/:genre', (req, res) => aniListController.getAnimeByGenre(req, res));
router.get('/genre/:genre', (req, res) => aniListController.getAnimeByGenre(req, res));

// 7. A-Z List Directory
// GET /api/v1/anilist/az-list/:letter?page=1
// GET /api/v1/anilist/az-list?letter=A
router.get('/az-list/:letter', (req, res) => aniListController.getAZList(req, res));
router.get('/az-list', (req, res) => aniListController.getAZList(req, res));

// 8. Search Suggestions
// GET /api/v1/anilist/search/suggestions?keyword=naruto
// GET /api/v1/anilist/suggestions?keyword=naruto
router.get('/search/suggestions', (req, res) => aniListController.getSuggestions(req, res));
router.get('/suggestions', (req, res) => aniListController.getSuggestions(req, res));

// 9. Catalog Search
// GET /api/v1/anilist/search?keyword=naruto&page=1
// GET /api/v1/anilist/browse?keyword=naruto
router.get('/search', (req, res) => aniListController.searchAnime(req, res));
router.get('/browse', (req, res) => aniListController.searchAnime(req, res));

// 10. Filter Options & Filter Endpoint
// GET /api/v1/anilist/filter/options
// GET /api/v1/anilist/filter?format=TV&genre=Action&status=FINISHED
router.get('/filter/options', (req, res) => aniListController.getFilterOptions(req, res));
router.get('/search/filter/options', (req, res) => aniListController.getFilterOptions(req, res));
router.get('/filter', (req, res) => aniListController.filterAnime(req, res));
router.get('/search/filter', (req, res) => aniListController.filterAnime(req, res));

// 11. Airing Schedule
// GET /api/v1/anilist/schedule?date=2026-10-24
// GET /api/v1/anilist/anime/schedule
router.get('/schedule', (req, res) => aniListController.getSchedule(req, res));
router.get('/anime/schedule', (req, res) => aniListController.getSchedule(req, res));

// 12. Random Anime
// GET /api/v1/anilist/random
router.get('/random', (req, res) => aniListController.getRandomAnime(req, res));

// 13. Anime Details
// GET /api/v1/anilist/anime/:id
// GET /api/v1/anilist/animeDetails/:id
router.get('/anime/:id', (req, res) => aniListController.getAnimeDetails(req, res));
router.get('/animeDetails/:id', (req, res) => aniListController.getAnimeDetails(req, res));

// 14. Episodes List
// GET /api/v1/anilist/episodes/:id
// GET /api/v1/anilist/anime/:id/episodes
router.get('/episodes/:id', (req, res) => aniListController.getEpisodes(req, res));
router.get('/anime/:id/episodes', (req, res) => aniListController.getEpisodes(req, res));

// 15. Reverse Sync (AniList ID -> HiAnime Data)
// GET /api/v1/anilist/sync/:anilistId
// GET /api/v1/anilist/sync?id=20958
router.get('/sync/:anilistId', (req, res) => syncController.syncFromAniList(req, res));
router.get('/sync', (req, res) => syncController.syncFromAniList(req, res));

// 16. Universal Embed URL & Stream Sources
// GET /api/v1/anilist/embed?id=21&ep=1
// GET /api/v1/anilist/embed/:id/:episode?
router.get('/embed', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'anilist';
  return embedController.getEmbed(req, res);
});
router.get('/embed/:id', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'anilist';
  return embedController.getEmbed(req, res);
});
router.get('/embed/:id/:episode', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'anilist';
  return embedController.getEmbed(req, res);
});

// 17. AniSkip Intro & Outro Skip Times
// GET /api/v1/anilist/skip-times?id=21&ep=1
// GET /api/v1/anilist/skip-times/:id/:episode
router.get('/skip-times', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'anilist';
  return aniSkipController.getSkipTimes(req, res);
});
router.get('/skip-times/:id', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'anilist';
  return aniSkipController.getSkipTimes(req, res);
});
router.get('/skip-times/:id/:episode', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'anilist';
  return aniSkipController.getSkipTimes(req, res);
});

export default router;
