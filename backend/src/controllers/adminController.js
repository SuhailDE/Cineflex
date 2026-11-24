import { dataStore } from '../services/dataStore.js';

export async function getAdminDashboard(_req, res) {
  try {
    const [movieRes, genres, userCount, sessions, allUsers] = await Promise.all([
      dataStore.listMovies({ includeAllStatuses: true, status: 'all', limit: 200 }),
      dataStore.listGenres(),
      dataStore.countUsers(),
      dataStore.listWatchSessions(),
      dataStore.getAllUsersForAnalytics(),
    ]);

    const movies = movieRes.movies;
    const mostWatched = [...movies]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 6)
      .map((m) => ({
        _id: m._id,
        title: m.title,
        slug: m.slug,
        views: m.views || 0,
        rating: m.rating || 0,
        type: m.type,
        releaseYear: m.releaseYear,
      }));

    const recentlyAdded = [...movies]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // 7-day viewing activity
    const activityMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      activityMap.set(key, { date: label, sessions: 0, minutesWatched: 0 });
    }

    for (const s of sessions) {
      const key = new Date(s.startedAt).toISOString().slice(0, 10);
      if (activityMap.has(key)) {
        const entry = activityMap.get(key);
        entry.sessions += 1;
        entry.minutesWatched += Math.round((s.durationWatched || 20) / 60) || 12;
      }
    }

    // Monthly user registrations (last 6 months)
    const monthMap = new Map();
    for (let i = 5; i >= 0; i--) {
      const dt = new Date();
      dt.setMonth(dt.getMonth() - i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const label = dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthMap.set(key, { month: label, users: 0 });
    }
    for (const u of allUsers) {
      const dt = new Date(u.createdAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(key)) {
        monthMap.get(key).users += 1;
      }
    }

    // Genre breakdown
    const genreCounts = new Map();
    for (const m of movies) {
      for (const g of m.genres || []) {
        genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
      }
    }
    const genreDistribution = Array.from(genreCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      stats: {
        totalMovies: movies.length,
        publishedMovies: movies.filter((m) => m.status === 'published').length,
        totalUsers: userCount,
        totalGenres: genres.length,
        totalWatchSessions: sessions.length,
      },
      mostWatched,
      recentlyAdded,
      viewingActivity: Array.from(activityMap.values()),
      monthlyRegistrations: Array.from(monthMap.values()),
      genreDistribution,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to load dashboard statistics.' });
  }
}

export async function getAdminUsers(req, res) {
  try {
    const search = String(req.query.search || '');
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const result = await dataStore.listUsers({ search, page, limit });
    return res.json(result);
  } catch {
    return res.status(500).json({ error: 'Failed to load users.' });
  }
}

export async function updateUserRoleOrStatus(req, res) {
  try {
    const targetId = req.params.id;
    const { role, status } = req.body || {};
    const target = await dataStore.findUserById(targetId);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    if (String(target._id) === String(req.user._id) && (role === 'user' || status === 'suspended')) {
      return res.status(400).json({ error: 'You cannot demote or suspend your own active admin account.' });
    }

    const updates = {};
    if (['user', 'admin'].includes(role)) updates.role = role;
    if (['active', 'suspended'].includes(status)) updates.status = status;

    const updated = await dataStore.updateUser(targetId, updates);
    await dataStore.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: String(targetId),
      details: `Updated ${target.email} (${JSON.stringify(updates)})`,
    });
    return res.json({ user: updated });
  } catch {
    return res.status(500).json({ error: 'Failed to update user.' });
  }
}

export async function getAdminReviews(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const result = await dataStore.listAllReviews({ page, limit });
    return res.json(result);
  } catch {
    return res.status(500).json({ error: 'Failed to load reviews.' });
  }
}

export async function deleteAdminReview(req, res) {
  try {
    const removed = await dataStore.deleteReview(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Review not found.' });
    await dataStore.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'REVIEW_DELETED',
      targetType: 'Review',
      targetId: String(req.params.id),
      details: 'Removed review via moderation console',
    });
    return res.json({ message: 'Review removed.' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete review.' });
  }
}

export async function getAdminAuditLogs(_req, res) {
  try {
    const logs = await dataStore.listAuditLogs(50);
    return res.json({ logs });
  } catch {
    return res.status(500).json({ error: 'Failed to load audit logs.' });
  }
}
