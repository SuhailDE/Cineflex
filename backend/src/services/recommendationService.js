import { dataStore } from './dataStore.js';

/**
 * Rule-based recommendation engine designed for future ML collaborative filtering drop-in.
 * Computes genre affinity from user watch history, watchlist, and preferences,
 * then scores candidate published titles.
 */
export async function getPersonalizedRecommendations(userId, limit = 10) {
  const { movies: allMovies } = await dataStore.listMovies({ status: 'published', limit: 100 });
  if (!userId) {
    return [...allMovies]
      .sort((a, b) => (b.rating || 0) * 10 + (b.views || 0) * 0.01 - ((a.rating || 0) * 10 + (a.views || 0) * 0.01))
      .slice(0, limit);
  }

  const [history, watchlist, user] = await Promise.all([
    dataStore.getWatchHistory(userId),
    dataStore.getWatchlist(userId),
    dataStore.findUserById(userId),
  ]);

  const genreWeights = new Map();
  const watchedIds = new Set(history.map((h) => String(h.movie._id)));
  const favoriteGenres = user?.preferences?.favoriteGenres || [];

  for (const g of favoriteGenres) {
    const key = g.toLowerCase();
    genreWeights.set(key, (genreWeights.get(key) || 0) + 3);
  }

  for (const item of history) {
    const boost = item.completed ? 4 : 2;
    for (const g of item.movie.genres || []) {
      const key = g.toLowerCase();
      genreWeights.set(key, (genreWeights.get(key) || 0) + boost);
    }
  }

  for (const item of watchlist) {
    for (const g of item.genres || []) {
      const key = g.toLowerCase();
      genreWeights.set(key, (genreWeights.get(key) || 0) + 2.5);
    }
  }

  if (genreWeights.size === 0) {
    return [...allMovies]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.views || 0) - (a.views || 0))
      .slice(0, limit);
  }

  const scored = allMovies
    .filter((m) => !watchedIds.has(String(m._id)))
    .map((m) => {
      let affinity = 0;
      for (const g of m.genres || []) {
        affinity += genreWeights.get(g.toLowerCase()) || 0;
      }
      const qualityScore = (m.rating || 7) * 0.8 + Math.min(5, (m.views || 0) / 500);
      return { movie: m, score: affinity * 2 + qualityScore };
    })
    .sort((a, b) => b.score - a.score);

  const picks = scored.map((s) => s.movie);
  if (picks.length < limit) {
    for (const m of allMovies) {
      if (!picks.some((p) => String(p._id) === String(m._id))) {
        picks.push(m);
      }
      if (picks.length >= limit) break;
    }
  }
  return picks.slice(0, limit);
}

export async function getSimilarMovies(targetMovie, limit = 6) {
  const { movies: allMovies } = await dataStore.listMovies({ status: 'published', limit: 100 });
  const targetGenres = new Set((targetMovie.genres || []).map((g) => g.toLowerCase()));

  return allMovies
    .filter((m) => String(m._id) !== String(targetMovie._id))
    .map((m) => {
      let overlap = 0;
      for (const g of m.genres || []) {
        if (targetGenres.has(g.toLowerCase())) overlap += 3;
      }
      if (m.director === targetMovie.director) overlap += 2;
      if (m.type === targetMovie.type) overlap += 1;
      const score = overlap + (m.rating || 0) * 0.25;
      return { movie: m, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.movie);
}
