import express from 'express';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/userLibraryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', getWatchlist);
router.post('/:movieId', addToWatchlist);
router.delete('/:movieId', removeFromWatchlist);

export default router;
