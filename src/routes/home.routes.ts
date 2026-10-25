import { Router } from 'express';
import { homeController } from '../controllers/home.controller.js';

const router = Router();

// GET /api/v1/hianime/home
router.get('/home', (req, res) => homeController.getHomePage(req, res));

export default router;
