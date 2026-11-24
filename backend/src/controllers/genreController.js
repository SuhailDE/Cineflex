import { cache } from '../config/cache.js';
import { dataStore } from '../services/dataStore.js';
import { isPlainString, sanitizeString, slugify, hasNoSqlOperators } from '../utils/validators.js';

export async function listGenres(_req, res) {
  try {
    const cached = cache.get('genres:all');
    if (cached) return res.json({ genres: cached });
    const genres = await dataStore.listGenres();
    cache.set('genres:all', genres, 60);
    return res.json({ genres });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch genres.' });
  }
}

export async function createGenre(req, res) {
  try {
    if (hasNoSqlOperators(req.body)) return res.status(400).json({ error: 'Invalid payload.' });
    const { name, description = '' } = req.body || {};
    if (!isPlainString(name, 2, 50)) {
      return res.status(400).json({ error: 'Genre name must be between 2 and 50 characters.' });
    }
    const slug = slugify(name);
    const existing = await dataStore.findGenreBySlugOrId(slug);
    if (existing) {
      return res.status(409).json({ error: 'A genre with this name already exists.' });
    }
    const genre = await dataStore.createGenre({
      name: name.trim(),
      slug,
      description: sanitizeString(description, 300),
    });
    await dataStore.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'GENRE_CREATED',
      targetType: 'Genre',
      targetId: String(genre._id),
      details: `Created genre "${genre.name}"`,
    });
    cache.del('genres:all');
    return res.status(201).json({ genre });
  } catch {
    return res.status(500).json({ error: 'Failed to create genre.' });
  }
}

export async function updateGenre(req, res) {
  try {
    if (hasNoSqlOperators(req.body)) return res.status(400).json({ error: 'Invalid payload.' });
    const existing = await dataStore.findGenreBySlugOrId(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Genre not found.' });

    const { name, description } = req.body || {};
    const updates = {};
    if (name !== undefined) {
      if (!isPlainString(name, 2, 50)) return res.status(400).json({ error: 'Invalid genre name.' });
      updates.name = name.trim();
      updates.slug = slugify(name);
    }
    if (description !== undefined) {
      updates.description = sanitizeString(description, 300);
    }

    const genre = await dataStore.updateGenre(existing._id, updates);
    await dataStore.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'GENRE_UPDATED',
      targetType: 'Genre',
      targetId: String(existing._id),
      details: `Updated genre "${genre.name}"`,
    });
    cache.del('genres:all');
    return res.json({ genre });
  } catch {
    return res.status(500).json({ error: 'Failed to update genre.' });
  }
}

export async function deleteGenre(req, res) {
  try {
    const existing = await dataStore.findGenreBySlugOrId(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Genre not found.' });

    await dataStore.deleteGenre(existing._id);
    await dataStore.createAuditLog({
      actor: req.user._id,
      actorEmail: req.user.email,
      action: 'GENRE_DELETED',
      targetType: 'Genre',
      targetId: String(existing._id),
      details: `Deleted genre "${existing.name}"`,
    });
    cache.del('genres:all');
    return res.json({ message: 'Genre deleted successfully.' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete genre.' });
  }
}
