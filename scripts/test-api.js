import assert from 'assert';
import { connectDatabase } from '../backend/src/config/db.js';
import { seedInitialData } from '../backend/src/seeders/seedData.js';
import { createApiApp } from '../backend/src/app.js';

await connectDatabase();
await seedInitialData();

const app = createApiApp();
const server = app.listen(0);
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

async function req(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

try {
  // 1. Health & Public Catalog
  const health = await req('/api/health');
  assert.strictEqual(health.status, 200);
  assert.strictEqual(health.data.ok, true);

  const catalog = await req('/api/movies');
  assert.strictEqual(catalog.status, 200);
  assert(catalog.data.movies.length >= 10, 'Expected seeded movies');
  const firstMovie = catalog.data.movies[0];

  // 2. User Registration & Auth Guard
  const testEmail = `test-${Date.now()}@cineflix.test`;
  const reg = await req('/api/auth/register', {
    method: 'POST',
    body: { name: 'Test Viewer', email: testEmail, password: 'Password123!' },
  });
  assert.strictEqual(reg.status, 201);
  assert(reg.data.token, 'Expected JWT token');
  const userToken = reg.data.token;

  // 3. Regular user cannot access admin dashboard or create movies
  const unauthAdmin = await req('/api/admin/dashboard', { token: userToken });
  assert.strictEqual(unauthAdmin.status, 403);

  const unauthCreate = await req('/api/movies', {
    method: 'POST',
    token: userToken,
    body: { title: 'Blocked' },
  });
  assert.strictEqual(unauthCreate.status, 403);

  // 4. Watchlist Add / Prevent Duplicates / Remove
  const addWl = await req(`/api/watchlist/${firstMovie._id}`, { method: 'POST', token: userToken });
  assert.strictEqual(addWl.status, 200);
  const addWlDup = await req(`/api/watchlist/${firstMovie._id}`, { method: 'POST', token: userToken });
  assert.strictEqual(addWlDup.status, 200);
  assert.strictEqual(addWlDup.data.movies.length, 1);

  const delWl = await req(`/api/watchlist/${firstMovie._id}`, { method: 'DELETE', token: userToken });
  assert.strictEqual(delWl.status, 200);
  assert.strictEqual(delWl.data.movies.length, 0);

  // 5. Watch History & Progress
  const prog = await req('/api/history/progress', {
    method: 'POST',
    token: userToken,
    body: { movieId: firstMovie._id, progress: 120, duration: 600 },
  });
  assert.strictEqual(prog.status, 200);
  const hist = await req('/api/history?continueWatching=true', { token: userToken });
  assert.strictEqual(hist.status, 200);
  assert.strictEqual(hist.data.history.length, 1);

  // 6. Reviews
  const rev = await req(`/api/movies/${firstMovie._id}/reviews`, {
    method: 'POST',
    token: userToken,
    body: { rating: 9, comment: 'Sharp pacing and great sound design.' },
  });
  assert.strictEqual(rev.status, 201);

  // 7. NoSQL Injection blocked
  const sqli = await req('/api/auth/login', {
    method: 'POST',
    body: { email: { $gt: '' }, password: 'x' },
  });
  assert.strictEqual(sqli.status, 400);

  console.log('All CineFlix API integration tests passed!');
} finally {
  server.close();
}
