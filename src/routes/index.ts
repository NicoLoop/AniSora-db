import { Router } from 'express';
import homeRoutes from './home.routes.js';
import animeRoutes from './anime.routes.js';
import anilistRoutes from './anilist.routes.js';
import malRoutes from './mal.routes.js';
import miruroRoutes from './miruro.routes.js';
import embedRoutes from './embed.routes.js';
import aniskipRoutes from './aniskip.routes.js';
import localdbRoutes from './localdb.routes.js';

const apiRouter = Router();

// Universal Embed & Stream routes: /api/v1/embed/...
apiRouter.use('/embed', embedRoutes);

// AniSkip Intro/Outro Skip Times routes: /api/v1/skip-times/... and /api/v1/aniskip/...
apiRouter.use('/skip-times', aniskipRoutes);
apiRouter.use('/aniskip', aniskipRoutes);

// HiAnime v1 routes: /api/v1/hianime/...
apiRouter.use('/hianime', homeRoutes);
apiRouter.use('/hianime', animeRoutes);

// AniList v1 routes: /api/v1/anilist/...
apiRouter.use('/anilist', anilistRoutes);

// MyAnimeList (MAL - Jikan) v1 routes: /api/v1/mal/...
apiRouter.use('/mal', malRoutes);

// Miruro v1 routes: /api/v1/miruro/...
apiRouter.use('/miruro', miruroRoutes);

// LocalDB fast sync routes: /api/v1/localdb/...
apiRouter.use('/localdb', localdbRoutes);

export default apiRouter;

