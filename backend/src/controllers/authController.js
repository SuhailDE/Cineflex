import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { dataStore } from '../services/dataStore.js';
import { signAuthToken, setAuthCookie, clearAuthCookie } from '../middleware/authMiddleware.js';
import {
  isPlainString,
  isValidEmail,
  isSafeMediaUrl,
  sanitizeArrayOfStrings,
  hasNoSqlOperators,
} from '../utils/validators.js';

export async function register(req, res) {
  try {
    if (hasNoSqlOperators(req.body)) {
      return res.status(400).json({ error: 'Invalid input payload.' });
    }
    const { name, email, password } = req.body || {};
    if (!isPlainString(name, 2, 80)) {
      return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
    }

    const existing = await dataStore.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await dataStore.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'user',
    });

    const token = signAuthToken(user);
    setAuthCookie(req, res, token);
    return res.status(201).json({ user, token });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

export async function login(req, res) {
  try {
    if (hasNoSqlOperators(req.body)) {
      return res.status(400).json({ error: 'Invalid input payload.' });
    }
    const { email, password } = req.body || {};
    if (!isValidEmail(email) || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userWithPassword = await dataStore.findUserByEmail(email, true);
    if (!userWithPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (userWithPassword.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }

    // Check ADMIN_PASSCODE override if configured in environment for admin accounts
    const envAdminPasscode = process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim();
    let valid = false;
    if (userWithPassword.role === 'admin' && envAdminPasscode) {
      valid = password === envAdminPasscode || (await bcrypt.compare(password, userWithPassword.password));
    } else {
      valid = await bcrypt.compare(password, userWithPassword.password);
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const cleanUser = await dataStore.findUserById(userWithPassword._id);
    const token = signAuthToken(cleanUser);
    setAuthCookie(req, res, token);
    return res.json({ user: cleanUser, token });
  } catch {
    return res.status(500).json({ error: 'Sign in failed. Please try again.' });
  }
}

export async function logout(req, res) {
  clearAuthCookie(req, res);
  return res.json({ message: 'Signed out successfully.' });
}

export async function getMe(req, res) {
  return res.json({ user: req.user });
}

export async function updateProfile(req, res) {
  try {
    if (hasNoSqlOperators(req.body)) {
      return res.status(400).json({ error: 'Invalid input payload.' });
    }
    const { name, avatar, favoriteGenres, defaultQuality, autoplayNext, currentPassword, newPassword } =
      req.body || {};
    const updates = {};

    if (name !== undefined) {
      if (!isPlainString(name, 2, 80)) {
        return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
      }
      updates.name = name.trim();
    }

    if (avatar !== undefined) {
      if (!isSafeMediaUrl(avatar, true)) {
        return res.status(400).json({ error: 'Avatar must be a valid HTTP(S) or local path.' });
      }
      updates.avatar = String(avatar || '').trim();
    }

    if (favoriteGenres !== undefined || defaultQuality !== undefined || autoplayNext !== undefined) {
      updates.preferences = {
        favoriteGenres:
          favoriteGenres !== undefined
            ? sanitizeArrayOfStrings(favoriteGenres, 10, 40)
            : req.user.preferences?.favoriteGenres || [],
        defaultQuality:
          ['1080p', '720p', '480p'].includes(defaultQuality)
            ? defaultQuality
            : req.user.preferences?.defaultQuality || '1080p',
        autoplayNext:
          typeof autoplayNext === 'boolean'
            ? autoplayNext
            : req.user.preferences?.autoplayNext ?? true,
      };
    }

    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters.' });
      }
      const fullUser = await dataStore.findUserById(req.user._id, true);
      if (typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, fullUser.password))) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      updates.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await dataStore.updateUser(req.user._id, updates);
    return res.json({ user: updated });
  } catch {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const user = await dataStore.findUserByEmail(email);
    if (!user) {
      return res.json({
        message: 'If an account matches that email, password reset instructions have been issued.',
      });
    }

    const rawToken = crypto.randomBytes(24).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await dataStore.updateUser(user._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });

    const isProd = process.env.NODE_ENV === 'production';
    return res.json({
      message: 'Password reset token generated. Check your inbox or use the reset link below.',
      ...(isProd ? {} : { resetToken: rawToken }),
    });
  } catch {
    return res.status(500).json({ error: 'Unable to process password reset request.' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ error: 'Reset token is required.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const user = await dataStore.findUserByResetToken(hashedToken);
    if (!user) {
      return res.status(400).json({ error: 'Reset token is invalid or has expired.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await dataStore.updateUser(user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}

export async function getAdminStatus(_req, res) {
  const adminCount = await dataStore.countUsers({ role: 'admin' });
  const envPasscodeConfigured = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim());
  return res.json({
    hasAdmin: adminCount > 0,
    canClaimAdmin: adminCount === 0 && !envPasscodeConfigured,
    envPasscodeConfigured,
  });
}

export async function claimAdmin(req, res) {
  try {
    if (hasNoSqlOperators(req.body)) {
      return res.status(400).json({ error: 'Invalid input payload.' });
    }
    const envPasscode = process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim();
    const adminCount = await dataStore.countUsers({ role: 'admin' });
    if (adminCount > 0) {
      return res.status(403).json({ error: 'An administrator account has already been claimed.' });
    }

    const { name, email, password } = req.body || {};
    if (!isPlainString(name, 2, 80)) {
      return res.status(400).json({ error: 'Admin name must be between 2 and 80 characters.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Admin password must be at least 8 characters.' });
    }
    if (envPasscode && password !== envPasscode) {
      return res.status(403).json({ error: 'Invalid administrator setup passcode.' });
    }

    const existing = await dataStore.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await dataStore.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'admin',
    });

    await dataStore.createAuditLog({
      actor: admin._id,
      actorEmail: admin.email,
      action: 'ADMIN_CLAIMED',
      targetType: 'User',
      targetId: String(admin._id),
      details: 'Initial administrator workspace claimed.',
    });

    const token = signAuthToken(admin);
    setAuthCookie(req, res, token);
    return res.status(201).json({ user: admin, token });
  } catch {
    return res.status(500).json({ error: 'Failed to claim administrator account.' });
  }
}
