import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { dataStore } from '../services/dataStore.js';

const EPHEMERAL_JWT_SECRET = crypto.randomBytes(32).toString('hex');

export function getJwtSecret() {
  return process.env.JWT_SECRET && process.env.JWT_SECRET.trim()
    ? process.env.JWT_SECRET.trim()
    : EPHEMERAL_JWT_SECRET;
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function setAuthCookie(req, res, token) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('cineflix_token', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    partitioned: isHttps,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(req, res) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie('cineflix_token', {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    partitioned: isHttps,
    path: '/',
  });
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.cookies && typeof req.cookies.cineflix_token === 'string') {
    return req.cookies.cineflix_token;
  }
  return null;
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      req.user = null;
      return next();
    }
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await dataStore.findUserById(decoded.sub);
    if (!user || user.status === 'suspended') {
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  } catch {
    req.user = null;
    next();
  }
}

export async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await dataStore.findUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or user no longer exists.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator privileges required.' });
  }
  next();
}

export function verifyCsrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  // If authenticated via Bearer token or custom X-Requested-With header, allow
  if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return next();
    } catch {
      return res.status(403).json({ error: 'Invalid request origin.' });
    }
  }
  return res.status(403).json({ error: 'Cross-site request blocked.' });
}
