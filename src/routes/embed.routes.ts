import { Router } from 'express';
import { embedController } from '../controllers/embed.controller.js';

const router = Router();

// ==========================================
// UNIVERSAL ANIME EMBED & STREAM ROUTES
// Works with any provider: Miruro, AniList, MAL, HiAnime, etc.
// ==========================================

// GET /embed?id=...&ep=...&category=...&server=...
// GET /api/v1/embed?id=...&ep=...
router.get('/', (req, res) => embedController.getEmbed(req, res));

// Route param variations
router.get('/:id', (req, res) => embedController.getEmbed(req, res));
router.get('/:id/:episode', (req, res) => embedController.getEmbed(req, res));
router.get('/:id/:episode/:category', (req, res) => embedController.getEmbed(req, res));

export default router;
