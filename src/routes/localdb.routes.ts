import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';

const router = Router();

router.get('/sync', (req, res) => searchController.syncLocalDb(req, res));
router.post('/sync', (req, res) => searchController.syncLocalDb(req, res));
router.get('/search/id', (req, res) => searchController.syncLocalDb(req, res));
router.post('/search/id', (req, res) => searchController.syncLocalDb(req, res));
router.get('/search', (req, res) => searchController.syncLocalDb(req, res));
router.post('/search', (req, res) => searchController.syncLocalDb(req, res));

export default router;
