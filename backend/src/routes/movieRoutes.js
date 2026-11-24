import express from 'express';
import {
  listMovies,
  getRecommendations,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieReviews,
  createMovieReview,
} from '../controllers/movieController.js';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, listMovies);
router.get('/recommendations', optionalAuth, getRecommendations);
router.get('/:id', optionalAuth, getMovie);
router.post('/', requireAuth, requireAdmin, createMovie);
router.put('/:id', requireAuth, requireAdmin, updateMovie);
router.delete('/:id', requireAuth, requireAdmin, deleteMovie);
router.get('/:id/reviews', getMovieReviews);
router.post('/:id/reviews', requireAuth, createMovieReview);

export default router;
