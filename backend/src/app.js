import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { verifyCsrfProtection } from './middleware/authMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import genreRoutes from './routes/genreRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

export function createApiApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, true);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 180,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', apiLimiter);
  app.use('/api', verifyCsrfProtection);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'cineflix-api' });
  });

  // Sample WebVTT caption track served same-origin for HTML5 Video Player subtitles
  app.get('/api/subtitles/sample.vtt', (_req, res) => {
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.send(`WEBVTT

00:00:01.000 --> 00:00:06.000
[Atmospheric score swells across the opening frame]

00:00:07.000 --> 00:00:13.000
"Every signal leaves an echo if you listen long enough."

00:00:14.000 --> 00:00:21.000
[Low ambient hum fades into studio dialogue]

00:00:22.000 --> 00:00:30.000
CineFlix Captions · English CC enabled
`);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/genres', genreRoutes);
  app.use('/api/watchlist', watchlistRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/contact', contactRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  return app;
}
