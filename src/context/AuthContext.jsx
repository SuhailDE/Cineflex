import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setInMemoryToken } from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [adminStatus, setAdminStatus] = useState({ hasAdmin: true, canClaimAdmin: false });
  const { showToast } = useToast();

  const syncWatchlistIds = useCallback(async (loggedInUser) => {
    if (!loggedInUser) {
      setWatchlistIds(new Set());
      return;
    }
    try {
      const res = await api.get('/api/watchlist');
      setWatchlistIds(new Set((res.movies || []).map((m) => String(m._id))));
    } catch {
      setWatchlistIds(new Set((loggedInUser.watchlist || []).map(String)));
    }
  }, []);

  const refreshAdminStatus = useCallback(async () => {
    try {
      const status = await api.get('/api/auth/admin-status');
      setAdminStatus(status);
    } catch {
      // keep safe default
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me');
      setUser(data.user);
      await syncWatchlistIds(data.user);
      return data.user;
    } catch {
      setUser(null);
      setWatchlistIds(new Set());
      return null;
    } finally {
      setLoading(false);
    }
  }, [syncWatchlistIds]);

  useEffect(() => {
    refreshUser();
    refreshAdminStatus();
  }, [refreshUser, refreshAdminStatus]);

  const login = async (credentials) => {
    const data = await api.post('/api/auth/login', credentials);
    if (data.token) setInMemoryToken(data.token);
    setUser(data.user);
    await syncWatchlistIds(data.user);
    showToast(`Welcome back, ${data.user.name}`, 'success');
    return data.user;
  };

  const register = async (payload) => {
    const data = await api.post('/api/auth/register', payload);
    if (data.token) setInMemoryToken(data.token);
    setUser(data.user);
    await syncWatchlistIds(data.user);
    showToast('Account created. Welcome to CineFlix.', 'success');
    return data.user;
  };

  const claimAdmin = async (payload) => {
    const data = await api.post('/api/auth/claim-admin', payload);
    if (data.token) setInMemoryToken(data.token);
    setUser(data.user);
    await refreshAdminStatus();
    await syncWatchlistIds(data.user);
    showToast('Administrator workspace claimed.', 'success');
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    }
    setInMemoryToken(null);
    setUser(null);
    setWatchlistIds(new Set());
    showToast('Signed out.', 'info');
  };

  const toggleWatchlist = async (movieId) => {
    if (!user) {
      showToast('Sign in to save titles to your watchlist.', 'info');
      return false;
    }
    const idStr = String(movieId);
    const exists = watchlistIds.has(idStr);
    try {
      if (exists) {
        await api.del(`/api/watchlist/${idStr}`);
        setWatchlistIds((prev) => {
          const next = new Set(prev);
          next.delete(idStr);
          return next;
        });
        showToast('Removed from My List.', 'info');
      } else {
        await api.post(`/api/watchlist/${idStr}`);
        setWatchlistIds((prev) => new Set(prev).add(idStr));
        showToast('Added to My List.', 'success');
      }
      return true;
    } catch (err) {
      showToast(err.message || 'Could not update watchlist.', 'error');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        watchlistIds,
        adminStatus,
        login,
        register,
        claimAdmin,
        logout,
        refreshUser,
        refreshAdminStatus,
        toggleWatchlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
