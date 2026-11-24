# CineFlix — Full-Stack Movie & Series Streaming Platform

CineFlix is a JavaScript-only full-stack streaming application built with React, Vite, Tailwind CSS, TanStack Query, React Hook Form, Recharts, Express.js, and Mongoose (MongoDB).

## Features
- **Public Discovery & Catalog**: Hero spotlight carousel, genre shelves (Trending, Popular, Recently Added, Top Rated, Action, Comedy, Horror, Romance, Sci-Fi, Recommended For You), debounced search by title/actor/director, multi-filter catalog, and pagination.
- **Cinematic HTML5 Video Player**: Custom controls with play/pause, seek timeline, volume/mute, playback speed (`0.5x`–`2x`), stream quality selector, English CC WebVTT subtitles, fullscreen, resume playback, and automatic progress syncing + Next Episode prompt for TV Series.
- **Authentication & RBAC**: Bcrypt password hashing, HTTP-only cookies (`SameSite=None; Partitioned` on HTTPS), Bearer fallback, password reset flow, first-run Admin claim, and role-based route protection.
- **Watchlist, Watch History & Recommendations**: Duplicate-safe watchlist, playback progress tracking, Continue Watching, audience reviews, and rule-based genre affinity recommendations.
- **Admin Studio Console**: Live Recharts analytics, Movie & Series CRUD with episode editor, Genre CRUD, User role/status management, Review moderation, and Admin audit logging.

## Setup & Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (optional for local preview; `.env.example` documents `MONGODB_URI`, `ADMIN_PASSCODE`, `REDIS_URL`, `CLOUDINARY_*`):
   - When `MONGODB_URI` is provided, CineFlix connects to MongoDB via Mongoose ODM.
   - When omitted, CineFlix persists records automatically to `backend/data/cineflix-db.json`.
3. Run development server on port 3000:
   ```bash
   npm run dev
   ```
4. Build and start in production:
   ```bash
   npm run build
   npm start
   ```
5. Run syntax and API integration tests:
   ```bash
   npm run lint
   node scripts/test-api.js
   ```

## REST API Overview
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/profile`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/admin-status`, `POST /api/auth/claim-admin`
- **Movies**: `GET /api/movies`, `GET /api/movies/recommendations`, `GET /api/movies/:id`, `POST /api/movies`, `PUT /api/movies/:id`, `DELETE /api/movies/:id`, `GET /api/movies/:id/reviews`, `POST /api/movies/:id/reviews`
- **Genres**: `GET /api/genres`, `POST /api/genres`, `PUT /api/genres/:id`, `DELETE /api/genres/:id`
- **Watchlist & History**: `GET/POST/DELETE /api/watchlist`, `GET /api/history`, `POST /api/history/progress`, `DELETE /api/history/:movieId`
- **Admin**: `GET /api/admin/dashboard`, `GET /api/admin/users`, `PUT /api/admin/users/:id/role`, `GET/DELETE /api/admin/reviews`, `GET /api/admin/audit-logs`
