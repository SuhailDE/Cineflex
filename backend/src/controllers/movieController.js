import { cache } from '../config/cache.js';
import { dataStore } from '../services/dataStore.js';
import { getPersonalizedRecommendations, getSimilarMovies } from '../services/recommendationService.js';
import {
  isPlainString,
  isSafeMediaUrl,
  sanitizeString,
  sanitizeArrayOfStrings,
  slugify,
  hasNoSqlOperators,
} from '../utils/validators.js';

export async function listMovies(req, res) {
  try {
    const {
      search = '',
      genre = '',
      year = '',
      language = '',
      minRating = 0,
      type = '',
      featured = '',
      trending = '',
      status = 'published',
      sort = 'popular',
      page = 1,
      limit = 24,
    } = req.query;

    const isAdmin = req.user?.role === 'admin';
    const effectiveStatus = isAdmin ? status : 'published';
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(60, Math.max(1, Number(limit) || 24));

    const cacheKey = `movies:${JSON.stringify({
      search,
      genre,
      year,
      language,
      minRating,
      type,
      featured,
      trending,
      effectiveStatus,
      sort,
      pageNum,
      limitNum,
    })}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const result = await dataStore.listMovies({
      search: sanitizeString(search, 120),
      genre: sanitizeString(genre, 60),
      year: sanitizeString(year, 10),
      language: sanitizeString(language, 40),
      minRating: Number(minRating) || 0,
      type: sanitizeString(type, 20),
      featured,
      trending,
      status: effectiveStatus,
      sort: sanitizeString(sort, 20),
      page: pageNum,
      limit: limitNum,
      includeAllStatuses: isAdmin,
    });

    cache.set(cacheKey, result, 30);
    return res.json(result);
  } catch {
    return res.status(500).json({ error: 'Failed to load movies.' });
  }
}

export async function getRecommendations(req, res) {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
    const movies = await getPersonalizedRecommendations(req.user?._id || null, limit);
    return res.json({ movies });
  } catch {
    return res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
}

export async function getMovie(req, res) {
  try {
    const movie = await dataStore.findMovieByIdOrSlug(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found.' });
    }
    if (movie.status !== 'published' && req.user?.role !== 'admin') {
      return res.status(404).json({ error: 'Movie not found.' });
    }

    const [similar, reviews] = await Promise.all([
      getSimilarMovies(movie, 6),
      dataStore.listReviewsForMovie(movie._id),
    ]);

    return res.json({ movie, similar, reviews });
  } catch {
    return res.status(500).json({ error: 'Failed to load movie details.' });
  }
}

export async function createMovie(req, res) {
  try {
    if (hasNoSqlOperators(req.body)) {
      return res.status(400).json({ error: 'Invalid input payload.' });
    }
    const body = req.body || {};
    if (!isPlainString(body.title, 1, 160)) {
      return res.status(400).json({ error: 'Movie title is required.' });
    }
    if (!isPlainString(body.description, 10, 2000)) {
      return res.status(400).json({ error: 'Description must be at least 10 characters.' });
    }
    if (!isPlainString(body.director, 2, 100)) {
      return res.status(400).json({ error: 'Director name is required.' });
    }
    if (
      !isSafeMediaUrl(body.poster, false) ||
      !isSafeMediaUrl(body.backdrop, false) ||
      !isSafeMediaUrl(body.videoUrl, false) ||
      !isSafeMediaUrl(body.trailerUrl, true)
    ) {
      return res.status(400).json({ error: 'All media URLs must be valid HTTP(S) or app-relative paths.' });
    }

    const releaseDate = body.releaseDate ? new Date(body.releaseDate) : new Date();
    const releaseYear = Number(body.releaseYear) || releaseDate.getFullYear();
    const baseSlug = slugify(body.slug || body.title) || `title-${Date.now()}`;
    const existingSlug = await dataStore.findMovieByIdOrSlug(baseSlug);
    const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const payload = {
      title: body.title.trim(),
      slug: finalSlug,
      type: body.type === 'series' ? 'series' : 'movie',
      description: body.description.trim(),
      poster: body.poster.trim(),
      backdrop: body.backdrop.trim(),
      trailerUrl: sanitizeString(body.trailerUrl, 500),
      videoUrl: body.videoUrl.trim(),
      releaseDate: releaseDate.toISOString(),
      releaseYear,
      duration: Math.max(1, Number(body.duration) || 105),
      genres: sanitizeArrayOfStrings(body.genres, 10, 40),
      cast: sanitizeArrayOfStrings(body.cast, 20, 80),
      director: body.director.trim(),
      language: sanitizeString(body.language || 'English', 40) || 'English',
      country: sanitizeString(body.country || 'United States', 60) || 'United States',
      ageRating: sanitizeString(body.ageRating || 'PG-13', 16) || 'PG-13',
      rating: Math.min(10, Math.max(0, Number(body.imdbRating ?? body.rating ?? 8.0))),
      imdbRating: Math.min(10, Math.max(0, Number(body.imdbRating ?? body.rating ?? 8.0))),
      featured: Boolean(body.featured),
      trending: Boolean(body.trending),
      status: ['published', 'draft', 'archived'].includes(body.status) ? body.status : 'published',
      episodes: Array.isArray(body.episodes)
        ? body.episodes
            .filter((ep) => ep && isPlainString(ep.title, 1, 120) && isSafeMediaUrl(ep.videoUrl, false))
            .map((ep, idx) => ({
              episodeNumber: Number(ep.episodeNumber) || idx + 1,
              seasonNumber: Number(ep.seasonNumber) || 1,
              title: ep.title.trim(),
              description: sanitizeString(ep.description || '', 500),
              duration: Math.max(1, Number(ep.duration) || 45),
              videoUrl: ep.videoUrl.trim(),
            }))
        : [],
    };

    const movie = await dataStore.createMovie(payload);
    await dataStore.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'MOVIE_CREATED',
      targetType: 'Movie',
      targetId: String(movie._id),
      details: `Added "${movie.title}" (${movie.releaseYear})`,
    });
    cache.invalidatePrefix('movies:');
    return res.status(201).json({ movie });
  } catch {
    return res.status(500).json({ error: 'Failed to create movie.' });
  }
}

export async function updateMovie(req, res) {
  try {
    if (hasNoSqlOperators(req.body)) {
      return res.status(400).json({ error: 'Invalid input payload.' });
    }
    const existing = await dataStore.findMovieByIdOrSlug(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Movie not found.' });
    }

    const body = req.body || {};
    const updates = {};

    if (body.title !== undefined) {
      if (!isPlainString(body.title, 1, 160)) return res.status(400).json({ error: 'Invalid title.' });
      updates.title = body.title.trim();
    }
    if (body.description !== undefined) {
      if (!isPlainString(body.description, 10, 2000)) return res.status(400).json({ error: 'Invalid description.' });
      updates.description = body.description.trim();
    }
    if (body.poster !== undefined) {
      if (!isSafeMediaUrl(body.poster, false)) return res.status(400).json({ error: 'Invalid poster URL.' });
      updates.poster = body.poster.trim();
    }
    if (body.backdrop !== undefined) {
      if (!isSafeMediaUrl(body.backdrop, false)) return res.status(400).json({ error: 'Invalid backdrop URL.' });
      updates.backdrop = body.backdrop.trim();
    }
    if (body.videoUrl !== undefined) {
      if (!isSafeMediaUrl(body.videoUrl, false)) return res.status(400).json({ error: 'Invalid video URL.' });
      updates.videoUrl = body.videoUrl.trim();
    }
    if (body.trailerUrl !== undefined) {
      if (!isSafeMediaUrl(body.trailerUrl, true)) return res.status(400).json({ error: 'Invalid trailer URL.' });
      updates.trailerUrl = sanitizeString(body.trailerUrl, 500);
    }
    if (body.type !== undefined) updates.type = body.type === 'series' ? 'series' : 'movie';
    if (body.director !== undefined && isPlainString(body.director, 1, 100)) updates.director = body.director.trim();
    if (body.language !== undefined) updates.language = sanitizeString(body.language, 40) || 'English';
    if (body.country !== undefined) updates.country = sanitizeString(body.country, 60) || 'United States';
    if (body.ageRating !== undefined) updates.ageRating = sanitizeString(body.ageRating, 16) || 'PG-13';
    if (body.releaseDate !== undefined) {
      const dt = new Date(body.releaseDate);
      if (!Number.isNaN(dt.getTime())) {
        updates.releaseDate = dt.toISOString();
        updates.releaseYear = Number(body.releaseYear) || dt.getFullYear();
      }
    } else if (body.releaseYear !== undefined) {
      updates.releaseYear = Number(body.releaseYear);
    }
    if (body.duration !== undefined) updates.duration = Math.max(1, Number(body.duration) || existing.duration);
    if (body.genres !== undefined) updates.genres = sanitizeArrayOfStrings(body.genres, 10, 40);
    if (body.cast !== undefined) updates.cast = sanitizeArrayOfStrings(body.cast, 20, 80);
    if (body.imdbRating !== undefined) {
      updates.imdbRating = Math.min(10, Math.max(0, Number(body.imdbRating)));
      updates.rating = updates.imdbRating;
    }
    if (body.featured !== undefined) updates.featured = Boolean(body.featured);
    if (body.trending !== undefined) updates.trending = Boolean(body.trending);
    if (['published', 'draft', 'archived'].includes(body.status)) updates.status = body.status;
    if (Array.isArray(body.episodes)) {
      updates.episodes = body.episodes
        .filter((ep) => ep && isPlainString(ep.title, 1, 120) && isSafeMediaUrl(ep.videoUrl, false))
        .map((ep, idx) => ({
          episodeNumber: Number(ep.episodeNumber) || idx + 1,
          seasonNumber: Number(ep.seasonNumber) || 1,
          title: ep.title.trim(),
          description: sanitizeString(ep.description || '', 500),
          duration: Math.max(1, Number(ep.duration) || 45),
          videoUrl: ep.videoUrl.trim(),
        }));
    }

    const updated = await dataStore.updateMovie(existing._id, updates);
    await dataStore.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'MOVIE_UPDATED',
      targetType: 'Movie',
      targetId: String(existing._id),
      details: `Updated "${updated.title}"`,
    });
    cache.invalidatePrefix('movies:');
    return res.json({ movie: updated });
  } catch {
    return res.status(500).json({ error: 'Failed to update movie.' });
  }
}

export async function deleteMovie(req, res) {
  try {
    const existing = await dataStore.findMovieByIdOrSlug(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Movie not found.' });
    }
    await dataStore.deleteMovie(existing._id);
    await dataStore.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'MOVIE_DELETED',
      targetType: 'Movie',
      targetId: String(existing._id),
      details: `Deleted "${existing.title}"`,
    });
    cache.invalidatePrefix('movies:');
    return res.json({ message: 'Movie deleted successfully.' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete movie.' });
  }
}

export async function getMovieReviews(req, res) {
  try {
    const movie = await dataStore.findMovieByIdOrSlug(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });
    const reviews = await dataStore.listReviewsForMovie(movie._id);
    return res.json({ reviews });
  } catch {
    return res.status(500).json({ error: 'Failed to load reviews.' });
  }
}

export async function createMovieReview(req, res) {
  try {
    if (hasNoSqlOperators(req.body)) {
      return res.status(400).json({ error: 'Invalid input payload.' });
    }
    const movie = await dataStore.findMovieByIdOrSlug(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found.' });

    const { rating, comment } = req.body || {};
    const numRating = Number(rating);
    if (!Number.isFinite(numRating) || numRating < 1 || numRating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10.' });
    }
    if (!isPlainString(comment, 3, 1000)) {
      return res.status(400).json({ error: 'Review comment must be between 3 and 1000 characters.' });
    }

    const review = await dataStore.upsertReview(req.user._id, movie._id, {
      rating: numRating,
      comment: comment.trim(),
    });
    cache.invalidatePrefix('movies:');
    return res.status(201).json({ review });
  } catch {
    return res.status(500).json({ error: 'Failed to save review.' });
  }
}
