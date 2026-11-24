import express from 'express';
import { listGenres, createGenre, updateGenre, deleteGenre } from '../controllers/genreController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', listGenres);
router.post('/', requireAuth, requireAdmin, createGenre);
router.put('/:id', requireAuth, requireAdmin, updateGenre);
router.delete('/:id', requireAuth, requireAdmin, deleteGenre);

export default router;
