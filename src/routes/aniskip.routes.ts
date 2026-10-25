import { Router } from 'express';
import { aniSkipController } from '../controllers/aniskip.controller.js';

const router = Router();

// Query param support: GET /skip-times?id=21&ep=1
router.get('/', (req, res) => aniSkipController.getSkipTimes(req, res));

// Path param support: GET /skip-times/:id or GET /skip-times/:id/:episode
router.get('/:id', (req, res) => aniSkipController.getSkipTimes(req, res));
router.get('/:id/:episode', (req, res) => aniSkipController.getSkipTimes(req, res));

export default router;
