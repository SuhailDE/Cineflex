import express from 'express';
import { getWatchHistory, saveProgress, removeWatchHistory } from '../controllers/userLibraryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', getWatchHistory);
router.post('/progress', saveProgress);
router.delete('/:movieId', removeWatchHistory);

export default router;
