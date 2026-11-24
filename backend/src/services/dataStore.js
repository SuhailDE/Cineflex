import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getDbMode } from '../config/db.js';
import { User } from '../models/User.js';
import { Genre } from '../models/Genre.js';
import { Movie } from '../models/Movie.js';
import { WatchHistory } from '../models/WatchHistory.js';
import { Review } from '../models/Review.js';
import { WatchSession } from '../models/WatchSession.js';
import { AuditLog } from '../models/AuditLog.js';
import { ContactMessage } from '../models/ContactMessage.js';

const DATA_DIR = path.resolve(process.cwd(), 'backend', 'data');
const DB_FILE = path.join(DATA_DIR, 'cineflix-db.json');

const EMPTY_DB = {
  users: [],
  genres: [],
  movies: [],
  watchHistory: [],
  reviews: [],
  watchSessions: [],
  auditLogs: [],
  contactMessages: [],
};

let memoryDb = null;

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

function loadLocalDb() {
  if (memoryDb) return memoryDb;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      memoryDb = { ...EMPTY_DB, ...JSON.parse(raw) };
      return memoryDb;
    } catch {
      memoryDb = structuredClone(EMPTY_DB);
      return memoryDb;
    }
  }
  memoryDb = structuredClone(EMPTY_DB);
  saveLocalDb();
  return memoryDb;
}

function saveLocalDb() {
  if (!memoryDb) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(memoryDb, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

function stripPassword(user) {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
}

export const dataStore = {
  // ---------------- USERS ----------------
  async countUsers(filter = {}) {
    if (getDbMode() === 'mongodb') {
      return User.countDocuments(filter);
    }
    const db = loadLocalDb();
    return db.users.filter((u) => {
      if (filter.role && u.role !== filter.role) return false;
      return true;
    }).length;
  },

  async findUserByEmail(email, includePassword = false) {
    const normalized = String(email || '').toLowerCase().trim();
    if (getDbMode() === 'mongodb') {
      const q = User.findOne({ email: normalized });
      if (includePassword) q.select('+password');
      const doc = await q.lean();
      return doc;
    }
    const db = loadLocalDb();
    const user = db.users.find((u) => u.email === normalized);
    if (!user) return null;
    return includePassword ? { ...user } : stripPassword(user);
  },

  async findUserById(id, includePassword = false) {
    if (getDbMode() === 'mongodb') {
      const q = User.findById(id);
      if (includePassword) q.select('+password');
      return q.lean();
    }
    const db = loadLocalDb();
    const user = db.users.find((u) => String(u._id) === String(id));
    if (!user) return null;
    return includePassword ? { ...user } : stripPassword(user);
  },

  async findUserByResetToken(token) {
    if (!token) return null;
    if (getDbMode() === 'mongodb') {
      return User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      })
        .select('+password')
        .lean();
    }
    const db = loadLocalDb();
    const now = Date.now();
    const user = db.users.find(
      (u) =>
        u.resetPasswordToken === token &&
        u.resetPasswordExpires &&
        new Date(u.resetPasswordExpires).getTime() > now
    );
    return user ? { ...user } : null;
  },

  async createUser(data) {
    if (getDbMode() === 'mongodb') {
      const doc = await User.create(data);
      return stripPassword(doc);
    }
    const db = loadLocalDb();
    const now = new Date().toISOString();
    const user = {
      _id: generateId(),
      name: data.name,
      email: String(data.email).toLowerCase().trim(),
      password: data.password,
      avatar: data.avatar || '',
      role: data.role || 'user',
      status: data.status || 'active',
      watchlist: data.watchlist || [],
      preferences: data.preferences || {
        favoriteGenres: [],
        autoplayNext: true,
        defaultQuality: '1080p',
      },
      resetPasswordToken: null,
      resetPasswordExpires: null,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    db.users.push(user);
    saveLocalDb();
    return stripPassword(user);
  },

  async updateUser(id, updates) {
    if (getDbMode() === 'mongodb') {
      const doc = await User.findByIdAndUpdate(id, updates, { new: true }).lean();
      return stripPassword(doc);
    }
    const db = loadLocalDb();
    const idx = db.users.findIndex((u) => String(u._id) === String(id));
    if (idx === -1) return null;
    db.users[idx] = {
      ...db.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveLocalDb();
    return stripPassword(db.users[idx]);
  },

  async listUsers({ search = '', page = 1, limit = 12 } = {}) {
    if (getDbMode() === 'mongodb') {
      const query = search
        ? {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ],
          }
        : {};
      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      return { users: users.map(stripPassword), total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
    }
    const db = loadLocalDb();
    const q = search.toLowerCase().trim();
    const filtered = db.users
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = filtered.length;
    const start = (page - 1) * limit;
    return {
      users: filtered.slice(start, start + limit).map(stripPassword),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async getAllUsersForAnalytics() {
    if (getDbMode() === 'mongodb') {
      return User.find({}, 'createdAt role status').lean();
    }
    return loadLocalDb().users.map(stripPassword);
  },

  // ---------------- GENRES ----------------
  async listGenres() {
    if (getDbMode() === 'mongodb') {
      return Genre.find({}).sort({ name: 1 }).lean();
    }
    const db = loadLocalDb();
    return [...db.genres].sort((a, b) => a.name.localeCompare(b.name));
  },

  async findGenreBySlugOrId(idOrSlug) {
    if (getDbMode() === 'mongodb') {
      return Genre.findOne({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }).lean().catch(() => Genre.findOne({ slug: idOrSlug }).lean());
    }
    const db = loadLocalDb();
    return db.genres.find((g) => String(g._id) === String(idOrSlug) || g.slug === idOrSlug) || null;
  },

  async createGenre(data) {
    if (getDbMode() === 'mongodb') {
      const doc = await Genre.create(data);
      return doc.toObject();
    }
    const db = loadLocalDb();
    const now = new Date().toISOString();
    const genre = {
      _id: generateId(),
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      createdAt: now,
      updatedAt: now,
    };
    db.genres.push(genre);
    saveLocalDb();
    return { ...genre };
  },

  async updateGenre(id, updates) {
    if (getDbMode() === 'mongodb') {
      return Genre.findByIdAndUpdate(id, updates, { new: true }).lean();
    }
    const db = loadLocalDb();
    const idx = db.genres.findIndex((g) => String(g._id) === String(id));
    if (idx === -1) return null;
    db.genres[idx] = { ...db.genres[idx], ...updates, updatedAt: new Date().toISOString() };
    saveLocalDb();
    return { ...db.genres[idx] };
  },

  async deleteGenre(id) {
    if (getDbMode() === 'mongodb') {
      return Genre.findByIdAndDelete(id).lean();
    }
    const db = loadLocalDb();
    const idx = db.genres.findIndex((g) => String(g._id) === String(id));
    if (idx === -1) return null;
    const [removed] = db.genres.splice(idx, 1);
    saveLocalDb();
    return removed;
  },

  // ---------------- MOVIES ----------------
  async listMovies({
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
    limit = 20,
    includeAllStatuses = false,
  } = {}) {
    if (getDbMode() === 'mongodb') {
      const query = {};
      if (!includeAllStatuses && status) query.status = status;
      else if (includeAllStatuses && status && status !== 'all') query.status = status;
      if (type && type !== 'all') query.type = type;
      if (genre && genre !== 'all') query.genres = { $regex: `^${genre}$`, $options: 'i' };
      if (year && year !== 'all') query.releaseYear = Number(year);
      if (language && language !== 'all') query.language = { $regex: `^${language}$`, $options: 'i' };
      if (Number(minRating) > 0) query.rating = { $gte: Number(minRating) };
      if (featured === 'true' || featured === true) query.featured = true;
      if (trending === 'true' || trending === true) query.trending = true;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { director: { $regex: search, $options: 'i' } },
          { cast: { $regex: search, $options: 'i' } },
          { genres: { $regex: search, $options: 'i' } },
        ];
      }

      const sortMap = {
        popular: { views: -1, rating: -1 },
        newest: { releaseDate: -1, createdAt: -1 },
        rating: { rating: -1, imdbRating: -1 },
        title: { title: 1 },
      };
      const total = await Movie.countDocuments(query);
      const movies = await Movie.find(query)
        .sort(sortMap[sort] || sortMap.popular)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      return { movies, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
    }

    const db = loadLocalDb();
    const q = search.toLowerCase().trim();
    const genreLower = genre.toLowerCase().trim();
    const langLower = language.toLowerCase().trim();

    let filtered = db.movies.filter((m) => {
      if (!includeAllStatuses && status && m.status !== status) return false;
      if (includeAllStatuses && status && status !== 'all' && m.status !== status) return false;
      if (type && type !== 'all' && m.type !== type) return false;
      if (genre && genre !== 'all') {
        const hasGenre = (m.genres || []).some(
          (g) => g.toLowerCase() === genreLower || g.toLowerCase().replace(/\s+/g, '-') === genreLower
        );
        if (!hasGenre) return false;
      }
      if (year && year !== 'all' && Number(m.releaseYear) !== Number(year)) return false;
      if (language && language !== 'all' && (m.language || '').toLowerCase() !== langLower) return false;
      if (Number(minRating) > 0 && Number(m.rating) < Number(minRating)) return false;
      if ((featured === 'true' || featured === true) && !m.featured) return false;
      if ((trending === 'true' || trending === true) && !m.trending) return false;
      if (q) {
        const hay = [
          m.title,
          m.director,
          m.description,
          ...(m.cast || []),
          ...(m.genres || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    filtered = [...filtered].sort((a, b) => {
      if (sort === 'newest') return new Date(b.releaseDate) - new Date(a.releaseDate);
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'title') return a.title.localeCompare(b.title);
      return (b.views || 0) - (a.views || 0) || (b.rating || 0) - (a.rating || 0);
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    return {
      movies: filtered.slice(start, start + limit),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async findMovieByIdOrSlug(idOrSlug) {
    if (getDbMode() === 'mongodb') {
      const bySlug = await Movie.findOne({ slug: idOrSlug }).lean();
      if (bySlug) return bySlug;
      return Movie.findById(idOrSlug).lean().catch(() => null);
    }
    const db = loadLocalDb();
    return (
      db.movies.find((m) => String(m._id) === String(idOrSlug) || m.slug === idOrSlug) || null
    );
  },

  async createMovie(data) {
    if (getDbMode() === 'mongodb') {
      const doc = await Movie.create(data);
      return doc.toObject();
    }
    const db = loadLocalDb();
    const now = new Date().toISOString();
    const movie = {
      _id: generateId(),
      views: 0,
      episodes: [],
      ...data,
      episodes: (data.episodes || []).map((ep) => ({ _id: ep._id || generateId(), ...ep })),
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    db.movies.push(movie);
    saveLocalDb();
    return { ...movie };
  },

  async updateMovie(id, updates) {
    if (getDbMode() === 'mongodb') {
      return Movie.findByIdAndUpdate(id, updates, { new: true }).lean();
    }
    const db = loadLocalDb();
    const idx = db.movies.findIndex((m) => String(m._id) === String(id));
    if (idx === -1) return null;
    db.movies[idx] = {
      ...db.movies[idx],
      ...updates,
      episodes: updates.episodes
        ? updates.episodes.map((ep) => ({ _id: ep._id || generateId(), ...ep }))
        : db.movies[idx].episodes,
      updatedAt: new Date().toISOString(),
    };
    saveLocalDb();
    return { ...db.movies[idx] };
  },

  async deleteMovie(id) {
    if (getDbMode() === 'mongodb') {
      const removed = await Movie.findByIdAndDelete(id).lean();
      if (removed) {
        await Promise.all([
          WatchHistory.deleteMany({ movie: id }),
          Review.deleteMany({ movie: id }),
          WatchSession.deleteMany({ movie: id }),
        ]);
      }
      return removed;
    }
    const db = loadLocalDb();
    const idx = db.movies.findIndex((m) => String(m._id) === String(id));
    if (idx === -1) return null;
    const [removed] = db.movies.splice(idx, 1);
    db.watchHistory = db.watchHistory.filter((h) => String(h.movie) !== String(id));
    db.reviews = db.reviews.filter((r) => String(r.movie) !== String(id));
    db.watchSessions = db.watchSessions.filter((s) => String(s.movie) !== String(id));
    for (const u of db.users) {
      u.watchlist = (u.watchlist || []).filter((mid) => String(mid) !== String(id));
    }
    saveLocalDb();
    return removed;
  },

  async incrementMovieViews(id) {
    if (getDbMode() === 'mongodb') {
      return Movie.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean();
    }
    const db = loadLocalDb();
    const movie = db.movies.find((m) => String(m._id) === String(id));
    if (movie) {
      movie.views = (movie.views || 0) + 1;
      saveLocalDb();
    }
    return movie || null;
  },

  // ---------------- WATCHLIST ----------------
  async getWatchlist(userId) {
    if (getDbMode() === 'mongodb') {
      const user = await User.findById(userId).populate('watchlist').lean();
      return (user?.watchlist || []).filter((m) => m && m.status === 'published');
    }
    const db = loadLocalDb();
    const user = db.users.find((u) => String(u._id) === String(userId));
    if (!user) return [];
    return (user.watchlist || [])
      .map((mid) => db.movies.find((m) => String(m._id) === String(mid)))
      .filter((m) => m && m.status === 'published');
  },

  async addToWatchlist(userId, movieId) {
    if (getDbMode() === 'mongodb') {
      await User.findByIdAndUpdate(userId, { $addToSet: { watchlist: movieId } });
      return this.getWatchlist(userId);
    }
    const db = loadLocalDb();
    const user = db.users.find((u) => String(u._id) === String(userId));
    if (!user) return [];
    const list = user.watchlist || [];
    if (!list.some((id) => String(id) === String(movieId))) {
      list.push(String(movieId));
      user.watchlist = list;
      saveLocalDb();
    }
    return this.getWatchlist(userId);
  },

  async removeFromWatchlist(userId, movieId) {
    if (getDbMode() === 'mongodb') {
      await User.findByIdAndUpdate(userId, { $pull: { watchlist: movieId } });
      return this.getWatchlist(userId);
    }
    const db = loadLocalDb();
    const user = db.users.find((u) => String(u._id) === String(userId));
    if (!user) return [];
    user.watchlist = (user.watchlist || []).filter((id) => String(id) !== String(movieId));
    saveLocalDb();
    return this.getWatchlist(userId);
  },

  // ---------------- WATCH HISTORY & SESSIONS ----------------
  async getWatchHistory(userId, { continueWatchingOnly = false } = {}) {
    if (getDbMode() === 'mongodb') {
      const query = { user: userId };
      if (continueWatchingOnly) query.completed = false;
      const items = await WatchHistory.find(query)
        .populate('movie')
        .sort({ lastWatched: -1 })
        .lean();
      return items.filter((item) => item.movie && item.movie.status === 'published');
    }
    const db = loadLocalDb();
    return db.watchHistory
      .filter((h) => String(h.user) === String(userId) && (!continueWatchingOnly || !h.completed))
      .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched))
      .map((h) => ({
        ...h,
        movie: db.movies.find((m) => String(m._id) === String(h.movie)) || null,
      }))
      .filter((h) => h.movie && h.movie.status === 'published');
  },

  async upsertWatchProgress(userId, movieId, { progress = 0, duration = 0, completed = false, episodeId = null }) {
    const now = new Date();
    const isCompleted = Boolean(completed) || (duration > 0 && progress / duration >= 0.92);

    if (getDbMode() === 'mongodb') {
      const existing = await WatchHistory.findOne({ user: userId, movie: movieId });
      const doc = await WatchHistory.findOneAndUpdate(
        { user: userId, movie: movieId },
        {
          progress: Math.max(0, Number(progress) || 0),
          duration: Math.max(0, Number(duration) || 0),
          completed: isCompleted,
          episodeId: episodeId || null,
          lastWatched: now,
        },
        { new: true, upsert: true }
      ).lean();

      if (!existing) {
        await Movie.findByIdAndUpdate(movieId, { $inc: { views: 1 } });
      }
      await this.recordWatchSession(userId, movieId, Math.min(30, Math.max(5, Number(progress) > 0 ? 15 : 5)), isCompleted);
      return doc;
    }

    const db = loadLocalDb();
    let entry = db.watchHistory.find(
      (h) => String(h.user) === String(userId) && String(h.movie) === String(movieId)
    );
    const isNew = !entry;
    if (!entry) {
      entry = {
        _id: generateId(),
        user: String(userId),
        movie: String(movieId),
        episodeId: episodeId || null,
        progress: Math.max(0, Number(progress) || 0),
        duration: Math.max(0, Number(duration) || 0),
        completed: isCompleted,
        lastWatched: now.toISOString(),
        createdAt: now.toISOString(),
      };
      db.watchHistory.push(entry);
    } else {
      entry.progress = Math.max(0, Number(progress) || 0);
      entry.duration = Math.max(0, Number(duration) || entry.duration || 0);
      entry.completed = isCompleted;
      entry.episodeId = episodeId || entry.episodeId || null;
      entry.lastWatched = now.toISOString();
    }

    if (isNew) {
      const movie = db.movies.find((m) => String(m._id) === String(movieId));
      if (movie) movie.views = (movie.views || 0) + 1;
    }

    // Record/update watch session for today
    const todayKey = now.toISOString().slice(0, 10);
    let session = db.watchSessions.find(
      (s) =>
        String(s.user) === String(userId) &&
        String(s.movie) === String(movieId) &&
        String(s.startedAt).slice(0, 10) === todayKey
    );
    if (!session) {
      db.watchSessions.push({
        _id: generateId(),
        user: String(userId),
        movie: String(movieId),
        startedAt: now.toISOString(),
        completedAt: isCompleted ? now.toISOString() : null,
        durationWatched: 15,
      });
    } else {
      session.durationWatched = Math.max(session.durationWatched || 0, Math.round(Number(progress) || 15));
      if (isCompleted) session.completedAt = now.toISOString();
    }

    saveLocalDb();
    return { ...entry };
  },

  async recordWatchSession(userId, movieId, durationWatched = 15, completed = false) {
    const now = new Date();
    if (getDbMode() === 'mongodb') {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const existing = await WatchSession.findOne({
        user: userId,
        movie: movieId,
        startedAt: { $gte: startOfDay },
      });
      if (!existing) {
        return WatchSession.create({
          user: userId,
          movie: movieId,
          startedAt: now,
          completedAt: completed ? now : null,
          durationWatched,
        });
      }
      existing.durationWatched = (existing.durationWatched || 0) + durationWatched;
      if (completed) existing.completedAt = now;
      return existing.save();
    }
    return null;
  },

  async removeWatchHistory(userId, movieId) {
    if (getDbMode() === 'mongodb') {
      return WatchHistory.findOneAndDelete({ user: userId, movie: movieId }).lean();
    }
    const db = loadLocalDb();
    const before = db.watchHistory.length;
    db.watchHistory = db.watchHistory.filter(
      (h) => !(String(h.user) === String(userId) && String(h.movie) === String(movieId))
    );
    if (db.watchHistory.length !== before) saveLocalDb();
    return { removed: db.watchHistory.length !== before };
  },

  // ---------------- REVIEWS ----------------
  async listReviewsForMovie(movieId) {
    if (getDbMode() === 'mongodb') {
      return Review.find({ movie: movieId })
        .populate('user', 'name avatar role')
        .sort({ createdAt: -1 })
        .lean();
    }
    const db = loadLocalDb();
    return db.reviews
      .filter((r) => String(r.movie) === String(movieId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((r) => {
        const user = db.users.find((u) => String(u._id) === String(r.user));
        return {
          ...r,
          user: user ? { _id: user._id, name: user.name, avatar: user.avatar } : { name: 'CineFlix Member', avatar: '' },
        };
      });
  },

  async upsertReview(userId, movieId, { rating, comment }) {
    if (getDbMode() === 'mongodb') {
      const review = await Review.findOneAndUpdate(
        { user: userId, movie: movieId },
        { rating: Number(rating), comment },
        { new: true, upsert: true }
      )
        .populate('user', 'name avatar')
        .lean();

      const allReviews = await Review.find({ movie: movieId }).lean();
      if (allReviews.length > 0) {
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await Movie.findByIdAndUpdate(movieId, { rating: Number(avg.toFixed(1)) });
      }
      return review;
    }

    const db = loadLocalDb();
    const now = new Date().toISOString();
    let review = db.reviews.find(
      (r) => String(r.user) === String(userId) && String(r.movie) === String(movieId)
    );
    if (!review) {
      review = {
        _id: generateId(),
        user: String(userId),
        movie: String(movieId),
        rating: Number(rating),
        comment,
        createdAt: now,
        updatedAt: now,
      };
      db.reviews.push(review);
    } else {
      review.rating = Number(rating);
      review.comment = comment;
      review.updatedAt = now;
    }

    const movieReviews = db.reviews.filter((r) => String(r.movie) === String(movieId));
    const movie = db.movies.find((m) => String(m._id) === String(movieId));
    if (movie && movieReviews.length > 0) {
      const avg = movieReviews.reduce((sum, r) => sum + r.rating, 0) / movieReviews.length;
      movie.rating = Number(avg.toFixed(1));
    }
    saveLocalDb();
    const user = db.users.find((u) => String(u._id) === String(userId));
    return {
      ...review,
      user: user ? { _id: user._id, name: user.name, avatar: user.avatar } : { name: 'Member', avatar: '' },
    };
  },

  async listAllReviews({ page = 1, limit = 15 } = {}) {
    if (getDbMode() === 'mongodb') {
      const total = await Review.countDocuments();
      const reviews = await Review.find({})
        .populate('user', 'name email')
        .populate('movie', 'title slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      return { reviews, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
    }
    const db = loadLocalDb();
    const sorted = [...db.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = sorted.length;
    const start = (page - 1) * limit;
    const reviews = sorted.slice(start, start + limit).map((r) => {
      const user = db.users.find((u) => String(u._id) === String(r.user));
      const movie = db.movies.find((m) => String(m._id) === String(r.movie));
      return {
        ...r,
        user: user ? { _id: user._id, name: user.name, email: user.email } : { name: 'Deleted User' },
        movie: movie ? { _id: movie._id, title: movie.title, slug: movie.slug } : { title: 'Removed Title' },
      };
    });
    return { reviews, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  },

  async deleteReview(reviewId) {
    if (getDbMode() === 'mongodb') {
      return Review.findByIdAndDelete(reviewId).lean();
    }
    const db = loadLocalDb();
    const idx = db.reviews.findIndex((r) => String(r._id) === String(reviewId));
    if (idx === -1) return null;
    const [removed] = db.reviews.splice(idx, 1);
    saveLocalDb();
    return removed;
  },

  // ---------------- SESSIONS & ANALYTICS ----------------
  async listWatchSessions() {
    if (getDbMode() === 'mongodb') {
      return WatchSession.find({}).populate('movie', 'title genres').lean();
    }
    const db = loadLocalDb();
    return db.watchSessions.map((s) => ({
      ...s,
      movie: db.movies.find((m) => String(m._id) === String(s.movie)) || null,
    }));
  },

  async seedWatchSession(data) {
    if (getDbMode() === 'mongodb') {
      return WatchSession.create(data);
    }
    const db = loadLocalDb();
    db.watchSessions.push({ _id: generateId(), ...data });
    saveLocalDb();
  },

  // ---------------- AUDIT LOGS & CONTACT ----------------
  async createAuditLog(entry) {
    if (getDbMode() === 'mongodb') {
      return AuditLog.create(entry);
    }
    const db = loadLocalDb();
    const log = {
      _id: generateId(),
      ...entry,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.unshift(log);
    if (db.auditLogs.length > 250) db.auditLogs.length = 250;
    saveLocalDb();
    return log;
  },

  async listAuditLogs(limit = 40) {
    if (getDbMode() === 'mongodb') {
      return AuditLog.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    }
    return loadLocalDb().auditLogs.slice(0, limit);
  },

  async createContactMessage(data) {
    if (getDbMode() === 'mongodb') {
      const doc = await ContactMessage.create(data);
      return doc.toObject();
    }
    const db = loadLocalDb();
    const msg = { _id: generateId(), ...data, createdAt: new Date().toISOString() };
    db.contactMessages.unshift(msg);
    saveLocalDb();
    return msg;
  },
};
