import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, History, ShieldCheck, User } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [defaultQuality, setDefaultQuality] = useState('1080p');
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => api.get('/api/genres'),
  });
  const genres = genresData?.genres || [];

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setFavoriteGenres(user.preferences?.favoriteGenres || []);
      setDefaultQuality(user.preferences?.defaultQuality || '1080p');
      setAutoplayNext(user.preferences?.autoplayNext ?? true);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="pt-32 pb-20 max-w-lg mx-auto px-4 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-white">Your Profile</h1>
        <p className="text-sm text-zinc-400">Sign in to manage your playback preferences and account settings.</p>
        <Link to="/login" className="inline-block px-6 py-2.5 rounded-lg bg-[#E50914] text-white text-sm font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const toggleGenre = (genreName) => {
    setFavoriteGenres((prev) =>
      prev.includes(genreName) ? prev.filter((g) => g !== genreName) : [...prev, genreName]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/auth/profile', {
        name,
        favoriteGenres,
        defaultQuality,
        autoplayNext,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      await refreshUser();
      setCurrentPassword('');
      setNewPassword('');
      showToast('Profile settings saved.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 sm:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#18181B] border border-white/10 flex items-center justify-center">
            <User className="w-6 h-6 text-[#E50914]" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{user.name}</h1>
            <p className="text-sm text-zinc-400">
              {user.email} · <span className="capitalize text-zinc-200">{user.role}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/watchlist"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#141418] border border-white/10 text-xs font-medium text-zinc-200 hover:text-white"
          >
            <Bookmark className="w-3.5 h-3.5" />
            Watchlist
          </Link>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#141418] border border-white/10 text-xs font-medium text-zinc-200 hover:text-white"
          >
            <History className="w-3.5 h-3.5" />
            Watch History
          </Link>
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E50914] text-xs font-semibold text-white"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Console
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="rounded-xl bg-[#111114] border border-white/10 p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold text-white">Account & Playback Preferences</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Default Stream Quality</label>
              <select
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(e.target.value)}
                className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              >
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p Data Saver</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoplayNext}
              onChange={(e) => setAutoplayNext(e.target.checked)}
              className="accent-[#E50914] w-4 h-4"
            />
            Automatically prompt next episode when watching series
          </label>

          <div className="space-y-2.5 pt-2">
            <p className="text-xs font-medium text-zinc-300">Favorite Genres (powers your Personalized Recommendations)</p>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => {
                const active = favoriteGenres.includes(g.name);
                return (
                  <button
                    key={g._id}
                    type="button"
                    onClick={() => toggleGenre(g.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#E50914] text-white'
                        : 'bg-[#18181B] text-zinc-300 border border-white/10 hover:text-white'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#111114] border border-white/10 p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-white">Change Password</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
