import { dataStore } from '../services/dataStore.js';

export async function getWatchlist(req, res) {
  try {
    const movies = await dataStore.getWatchlist(req.user._id);
    return res.json({ movies });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch watchlist.' });
  }
}

export async function addToWatchlist(req, res) {
  try {
    const movie = await dataStore.findMovieByIdOrSlug(req.params.movieId);
    if (!movie || movie.status !== 'published') {
      return res.status(404).json({ error: 'Movie not found.' });
    }
    const movies = await dataStore.addToWatchlist(req.user._id, movie._id);
    return res.json({ movies, message: 'Added to your watchlist.' });
  } catch {
    return res.status(500).json({ error: 'Failed to update watchlist.' });
  }
}

export async function removeFromWatchlist(req, res) {
  try {
    const movies = await dataStore.removeFromWatchlist(req.user._id, req.params.movieId);
    return res.json({ movies, message: 'Removed from your watchlist.' });
  } catch {
    return res.status(500).json({ error: 'Failed to remove from watchlist.' });
  }
}

export async function getWatchHistory(req, res) {
  try {
    const continueWatchingOnly = req.query.continueWatching === 'true';
    const history = await dataStore.getWatchHistory(req.user._id, { continueWatchingOnly });
    return res.json({ history });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch watch history.' });
  }
}

export async function saveProgress(req, res) {
  try {
    const { movieId, progress = 0, duration = 0, completed = false, episodeId = null } = req.body || {};
    const movie = await dataStore.findMovieByIdOrSlug(movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }
    const entry = await dataStore.upsertWatchProgress(req.user._id, movie._id, {
      progress: Number(progress) || 0,
      duration: Number(duration) || 0,
      completed: Boolean(completed),
      episodeId,
    });
    return res.json({ entry });
  } catch {
    return res.status(500).json({ error: 'Failed to save playback progress.' });
  }
}

export async function removeWatchHistory(req, res) {
  try {
    await dataStore.removeWatchHistory(req.user._id, req.params.movieId);
    return res.json({ message: 'Removed from watch history.' });
  } catch {
    return res.status(500).json({ error: 'Failed to remove watch history item.' });
  }
}
