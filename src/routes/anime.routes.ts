import { Router } from 'express';
import { detailController } from '../controllers/detail.controller.js';
import { episodeController } from '../controllers/episode.controller.js';
import { serverController } from '../controllers/server.controller.js';
import { downloadController } from '../controllers/download.controller.js';
import { zokoController } from '../controllers/zoko.controller.js';
import { megaPlayController } from '../controllers/megaplay.controller.js';
import { randomController } from '../controllers/random.controller.js';
import { searchController } from '../controllers/search.controller.js';
import { genreController } from '../controllers/genre.controller.js';
import { azController } from '../controllers/az.controller.js';
import { mirrorController } from '../controllers/mirror.controller.js';
import { scheduleController } from '../controllers/schedule.controller.js';
import { categoryController } from '../controllers/category.controller.js';
import { animePaheController } from '../controllers/animepahe.controller.js';
import { anitakuController } from '../controllers/anitaku.controller.js';
import { aniwaveController } from '../controllers/aniwave.controller.js';
import { syncController } from '../controllers/sync.controller.js';
import { embedController } from '../controllers/embed.controller.js';
import { aniSkipController } from '../controllers/aniskip.controller.js';

const router = Router();

// Mirrors & Health
// GET /api/v1/hianime/mirrors?check=true
// POST /api/v1/hianime/mirrors/switch
router.get('/mirrors', (req, res) => mirrorController.getMirrors(req, res));
router.post('/mirrors/switch', (req, res) => mirrorController.switchMirror(req, res));

// Schedule
// GET /api/v1/hianime/schedule?date=2026-10-18&tzOffset=-360
// GET /api/v1/hianime/anime/schedule (alias)
router.get('/schedule', (req, res) => scheduleController.getSchedule(req, res));
router.get('/anime/schedule', (req, res) => scheduleController.getSchedule(req, res));

// Random Anime
// GET /api/v1/hianime/random
router.get('/random', (req, res) => randomController.getRandomAnime(req, res));

// Search Suggestions
// GET /api/v1/hianime/search/suggestions?keyword=hi
// GET /api/v1/hianime/suggestions?keyword=hi (alias)
router.get('/search/suggestions', (req, res) => searchController.getSuggestions(req, res));
router.get('/suggestions', (req, res) => searchController.getSuggestions(req, res));

// Search Anime (with filter support)
// GET /api/v1/hianime/search?keyword=hi&page=1
// GET /api/v1/hianime/browse?keyword=hi&page=1 (alias)
router.get('/search', (req, res) => searchController.searchAnime(req, res));
router.get('/browse', (req, res) => searchController.searchAnime(req, res));

// Search Matched ID only (fast matching without details)
// GET /api/v1/hianime/search/id?name=Naruto
// POST /api/v1/hianime/search/id
router.get('/search/id', (req, res) => searchController.syncLocalDb(req, res));
router.post('/search/id', (req, res) => searchController.syncLocalDb(req, res));

// Search Filters (Dedicated filter endpoints)
// GET /api/v1/hianime/filter?type=movie&sort=most_viewed
// GET /api/v1/hianime/filter/options
router.get('/filter/options', (req, res) => searchController.getFilterOptions(req, res));
router.get('/search/filter/options', (req, res) => searchController.getFilterOptions(req, res));
router.get('/filter', (req, res) => searchController.filterAnime(req, res));
router.get('/search/filter', (req, res) => searchController.filterAnime(req, res));

// Categories / Listings
// Subbed Anime: GET /api/v1/hianime/subbed-anime?page=1
router.get('/subbed-anime', (req, res) => categoryController.getSubbedAnime(req, res));
router.get('/subbed', (req, res) => categoryController.getSubbedAnime(req, res));

// Dubbed Anime: GET /api/v1/hianime/dubbed-anime?page=1
router.get('/dubbed-anime', (req, res) => categoryController.getDubbedAnime(req, res));
router.get('/dubbed', (req, res) => categoryController.getDubbedAnime(req, res));

// Most Popular: GET /api/v1/hianime/most-popular?page=1
router.get('/most-popular', (req, res) => categoryController.getMostPopular(req, res));
router.get('/popular', (req, res) => categoryController.getMostPopular(req, res));

// Movies: GET /api/v1/hianime/movie?page=1
router.get('/movie', (req, res) => categoryController.getMovies(req, res));
router.get('/movies', (req, res) => categoryController.getMovies(req, res));

// TV Series: GET /api/v1/hianime/tv?page=1
router.get('/tv', (req, res) => categoryController.getTvSeries(req, res));
router.get('/tv-series', (req, res) => categoryController.getTvSeries(req, res));

// OVAs: GET /api/v1/hianime/ova?page=1
router.get('/ova', (req, res) => categoryController.getOvas(req, res));
router.get('/ovas', (req, res) => categoryController.getOvas(req, res));

// ONAs: GET /api/v1/hianime/ona?page=1
router.get('/ona', (req, res) => categoryController.getOnas(req, res));
router.get('/onas', (req, res) => categoryController.getOnas(req, res));

// Specials: GET /api/v1/hianime/special?page=1
router.get('/special', (req, res) => categoryController.getSpecials(req, res));
router.get('/specials', (req, res) => categoryController.getSpecials(req, res));

// Generic Category Route: GET /api/v1/hianime/category/:category?page=1
router.get('/category/:category', (req, res) => categoryController.getAnimeByCategory(req, res));

// Genre
// GET /api/v1/hianime/genres/:genre?page=1
// GET /api/v1/hianime/genre/:genre?page=1 (alias)
router.get('/genres/:genre', (req, res) => genreController.getAnimeByGenre(req, res));
router.get('/genre/:genre', (req, res) => genreController.getAnimeByGenre(req, res));

// A-Z List
// GET /api/v1/hianime/az-list/:letter?page=1
// GET /api/v1/hianime/az-list?letter=a&page=1
router.get('/az-list/:letter', (req, res) => azController.getAnimeByLetter(req, res));
router.get('/az-list', (req, res) => azController.getAnimeByLetter(req, res));

// Anime Sync (HiAnime Anime ID -> AniList Metadata)
// GET /api/v1/hianime/anime/sync/:animeId
// GET /api/v1/hianime/anime/sync?animeId=attack-on-titan-season-2-865
router.get('/anime/sync/:animeId', (req, res) => syncController.syncAnime(req, res));
router.get('/anime/sync', (req, res) => syncController.syncAnime(req, res));
router.get('/sync/:animeId', (req, res) => syncController.syncAnime(req, res));
router.get('/sync', (req, res) => syncController.syncAnime(req, res));

// Reverse Sync Alias (AniList ID -> HiAnime Data)
// GET /api/v1/hianime/anilist/sync/:anilistId
router.get('/anilist/sync/:anilistId', (req, res) => syncController.syncFromAniList(req, res));
router.get('/anilist/sync', (req, res) => syncController.syncFromAniList(req, res));

// Anime Details
// GET /api/v1/hianime/anime/:id
// GET /api/v1/hianime/animeDetails/:id (alias)
router.get('/anime/:id', (req, res) => detailController.getAnimeDetails(req, res));
router.get('/animeDetails/:id', (req, res) => detailController.getAnimeDetails(req, res));

// Anime Episodes
// GET /api/v1/hianime/episodes/:id
// GET /api/v1/hianime/anime/:id/episodes (alias)
router.get('/episodes/:id', (req, res) => episodeController.getEpisodes(req, res));
router.get('/anime/:id/episodes', (req, res) => episodeController.getEpisodes(req, res));

// Episode Servers
// GET /api/v1/hianime/servers?episodeId=1
// GET /api/v1/hianime/servers/:episodeId
// GET /api/v1/hianime/episode/servers?episodeId=1
router.get('/servers', (req, res) => serverController.getServers(req, res));
router.get('/servers/:episodeId', (req, res) => serverController.getServers(req, res));
router.get('/episode/servers', (req, res) => serverController.getServers(req, res));

// Episode Downloads
// GET /api/v1/hianime/downloads?episodeId=1
// GET /api/v1/hianime/downloads/:episodeId
// GET /api/v1/hianime/episode/downloads?episodeId=1
router.get('/downloads', (req, res) => downloadController.getDownloads(req, res));
router.get('/downloads/:episodeId', (req, res) => downloadController.getDownloads(req, res));
router.get('/episode/downloads', (req, res) => downloadController.getDownloads(req, res));

// Universal Embed URL & Stream Sources
// GET /api/v1/hianime/embed?id=one-piece-100&ep=1
// GET /api/v1/hianime/embed/:id/:episode?
router.get('/embed', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'hianime';
  return embedController.getEmbed(req, res);
});
router.get('/embed/:id', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'hianime';
  return embedController.getEmbed(req, res);
});
router.get('/embed/:id/:episode', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'hianime';
  return embedController.getEmbed(req, res);
});

// AniSkip Intro & Outro Skip Times
// GET /api/v1/hianime/skip-times?id=one-piece-100&ep=1
// GET /api/v1/hianime/skip-times/:id/:episode
router.get('/skip-times', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'hianime';
  return aniSkipController.getSkipTimes(req, res);
});
router.get('/skip-times/:id', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'hianime';
  return aniSkipController.getSkipTimes(req, res);
});
router.get('/skip-times/:id/:episode', (req, res) => {
  if (!req.query.provider && !req.query.source) req.query.provider = 'hianime';
  return aniSkipController.getSkipTimes(req, res);
});

// ZokoAnime Stream Extractor
// GET /api/v1/hianime/stream/zokoanime?url=https://zokoanime.video/stream/mal/21/1/sub
// GET /api/v1/hianime/stream/zokoanime/:provider/:id/:ep/:category?
// POST /api/v1/hianime/stream/zokoanime
router.get('/stream/zokoanime', (req, res) => zokoController.getStream(req, res));
router.post('/stream/zokoanime', (req, res) => zokoController.getStream(req, res));
router.get('/stream/zokoanime/:provider/:id/:ep/:category?', (req, res) => zokoController.getStream(req, res));

// Aliases for ZokoAnime
router.get('/zokoanime/stream', (req, res) => zokoController.getStream(req, res));
router.post('/zokoanime/stream', (req, res) => zokoController.getStream(req, res));
router.get('/zokoanime/stream/:provider/:id/:ep/:category?', (req, res) => zokoController.getStream(req, res));

// HD-1 (MegaPlay) Stream Extractor
// GET /api/v1/hianime/stream/hd-1?url=https://megaplay.buzz/stream/s-2/2142/sub?s=tcdn
// GET /api/v1/hianime/stream/hd-1/:id/:category?
// POST /api/v1/hianime/stream/hd-1
router.get('/stream/hd-1', (req, res) => megaPlayController.getStream(req, res));
router.post('/stream/hd-1', (req, res) => megaPlayController.getStream(req, res));
router.get('/stream/hd-1/:id/:category?', (req, res) => megaPlayController.getStream(req, res));

// Aliases for HD-1 (MegaPlay)
router.get('/stream/megaplay', (req, res) => megaPlayController.getStream(req, res));
router.post('/stream/megaplay', (req, res) => megaPlayController.getStream(req, res));
router.get('/stream/megaplay/:id/:category?', (req, res) => megaPlayController.getStream(req, res));

// AnimePahe (VidNest) Direct Stream Extractor
// GET /api/v1/hianime/stream/animepahe/:anilistId/:episode/:type?
// GET /api/v1/hianime/stream/animepahe?anilistId=16498&episode=1&type=dub
router.get('/stream/animepahe/:anilistId/:episode/:type?', (req, res) => animePaheController.getStream(req, res));
router.get('/stream/animepahe', (req, res) => animePaheController.getStream(req, res));

// Aliases for AnimePahe
router.get('/animepahe/stream/:anilistId/:episode/:type?', (req, res) => animePaheController.getStream(req, res));
router.get('/animepahe/stream', (req, res) => animePaheController.getStream(req, res));

// Anitaku Stream Extractor
// GET /api/v1/hianime/stream/anitaku/:anilistId/:episode/:type?
// GET /api/v1/hianime/stream/anitaku?anilistId=21&episode=1&type=sub
router.get('/stream/anitaku/:anilistId/:episode/:type?', (req, res) => anitakuController.getStream(req, res));
router.get('/stream/anitaku', (req, res) => anitakuController.getStream(req, res));

// Aliases for Anitaku
router.get('/anitaku/stream/:anilistId/:episode/:type?', (req, res) => anitakuController.getStream(req, res));
router.get('/anitaku/stream', (req, res) => anitakuController.getStream(req, res));

// Aniwave Stream Extractor
// GET /api/v1/hianime/stream/aniwave/:anilistId/:episode/:type?
// GET /api/v1/hianime/stream/aniwave?anilistId=21&episode=1&type=sub
router.get('/stream/aniwave/:anilistId/:episode/:type?', (req, res) => aniwaveController.getStream(req, res));
router.get('/stream/aniwave', (req, res) => aniwaveController.getStream(req, res));

// Aliases for Aniwave
router.get('/aniwave/stream/:anilistId/:episode/:type?', (req, res) => aniwaveController.getStream(req, res));
router.get('/aniwave/stream', (req, res) => aniwaveController.getStream(req, res));

export default router;
