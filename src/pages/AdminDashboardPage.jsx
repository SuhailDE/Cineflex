import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  Edit3,
  Film,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  Search,
  Settings,
  ShieldAlert,
  Tags,
  Trash2,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'add-movie', label: 'Add Movie', icon: PlusCircle },
  { id: 'genres', label: 'Genres', icon: Tags },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings & Logs', icon: Settings },
];

const EMPTY_MOVIE_FORM = {
  title: '',
  type: 'movie',
  description: '',
  poster: '/src/assets/images/poster_solaris_horizon_1795532107664.jpg',
  backdrop: '/src/assets/images/hero_solaris_horizon_1795532107126.jpg',
  trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  releaseDate: '2026-05-01',
  duration: '120',
  genres: ['Science Fiction', 'Thriller'],
  cast: 'Elena Rostova, Marcus Thorne',
  director: 'Claire Moreau',
  language: 'English',
  country: 'United States',
  ageRating: 'PG-13',
  imdbRating: '8.5',
  featured: false,
  trending: true,
  status: 'published',
  episodes: [],
};

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState('dashboard');
  const [movieSearch, setMovieSearch] = useState('');
  const [moviePage, setMoviePage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);

  const [editingMovieId, setEditingMovieId] = useState(null);
  const [movieForm, setMovieForm] = useState(EMPTY_MOVIE_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [genreForm, setGenreForm] = useState({ id: null, name: '', description: '' });

  const isAdmin = user?.role === 'admin';

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/api/admin/dashboard'),
    enabled: isAdmin,
  });

  const { data: moviesData } = useQuery({
    queryKey: ['admin-movies', movieSearch, moviePage],
    queryFn: () =>
      api.get(`/api/movies?status=all&search=${encodeURIComponent(movieSearch)}&page=${moviePage}&limit=10`),
    enabled: isAdmin && (tab === 'movies' || tab === 'dashboard'),
  });

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => api.get('/api/genres'),
    enabled: isAdmin,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users', userSearch, userPage],
    queryFn: () => api.get(`/api/admin/users?search=${encodeURIComponent(userSearch)}&page=${userPage}&limit=10`),
    enabled: isAdmin && tab === 'users',
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => api.get('/api/admin/reviews?limit=25'),
    enabled: isAdmin && tab === 'reviews',
  });

  const { data: logsData } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.get('/api/admin/audit-logs'),
    enabled: isAdmin && tab === 'settings',
  });

  const saveMovieMutation = useMutation({
    mutationFn: (payload) =>
      editingMovieId
        ? api.put(`/api/movies/${editingMovieId}`, payload)
        : api.post('/api/movies', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['home-catalog'] });
      showToast(editingMovieId ? 'Movie updated.' : 'Movie added to catalog.', 'success');
      setEditingMovieId(null);
      setMovieForm(EMPTY_MOVIE_FORM);
      setTab('movies');
    },
    onError: (err) => showToast(err.message || 'Could not save movie.', 'error'),
  });

  const deleteMovieMutation = useMutation({
    mutationFn: (id) => api.del(`/api/movies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['home-catalog'] });
      setConfirmDelete(null);
      showToast('Movie deleted.', 'info');
    },
    onError: (err) => showToast(err.message || 'Delete failed.', 'error'),
  });

  const saveGenreMutation = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? api.put(`/api/genres/${payload.id}`, { name: payload.name, description: payload.description })
        : api.post('/api/genres', { name: payload.name, description: payload.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setGenreForm({ id: null, name: '', description: '' });
      showToast('Genre saved.', 'success');
    },
    onError: (err) => showToast(err.message || 'Failed to save genre.', 'error'),
  });

  const deleteGenreMutation = useMutation({
    mutationFn: (id) => api.del(`/api/genres/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      showToast('Genre removed.', 'info');
    },
    onError: (err) => showToast(err.message || 'Could not delete genre.', 'error'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, role, status }) => api.put(`/api/admin/users/${id}/role`, { role, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('User permissions updated.', 'success');
    },
    onError: (err) => showToast(err.message || 'Could not update user.', 'error'),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id) => api.del(`/api/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      showToast('Review removed.', 'info');
    },
    onError: (err) => showToast(err.message || 'Could not delete review.', 'error'),
  });

  if (authLoading) {
    return <div className="pt-28 text-center text-zinc-400 text-sm">Verifying session...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="pt-32 pb-20 max-w-lg mx-auto px-4 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-[#E50914] mx-auto" />
        <h1 className="font-display text-3xl font-bold text-white">Administrator Access Required</h1>
        <p className="text-sm text-zinc-400">
          Sign in with an administrator account to access catalog management and platform analytics.
        </p>
        <Link to="/login" className="inline-block px-6 py-2.5 rounded-lg bg-[#E50914] text-white text-sm font-semibold">
          Go to Sign In
        </Link>
      </div>
    );
  }

  const stats = dashData?.stats || {};
  const genres = genresData?.genres || [];

  const startEditMovie = (m) => {
    setEditingMovieId(m._id);
    setMovieForm({
      title: m.title || '',
      type: m.type || 'movie',
      description: m.description || '',
      poster: m.poster || '',
      backdrop: m.backdrop || '',
      trailerUrl: m.trailerUrl || '',
      videoUrl: m.videoUrl || '',
      releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().slice(0, 10) : '2026-01-01',
      duration: String(m.duration || 110),
      genres: m.genres || [],
      cast: (m.cast || []).join(', '),
      director: m.director || '',
      language: m.language || 'English',
      country: m.country || 'United States',
      ageRating: m.ageRating || 'PG-13',
      imdbRating: String(m.imdbRating || m.rating || 8.0),
      featured: Boolean(m.featured),
      trending: Boolean(m.trending),
      status: m.status || 'published',
      episodes: m.episodes || [],
    });
    setTab('add-movie');
  };

  const handleMovieSubmit = (e) => {
    e.preventDefault();
    saveMovieMutation.mutate({
      ...movieForm,
      duration: Number(movieForm.duration) || 100,
      imdbRating: Number(movieForm.imdbRating) || 8.0,
      cast: movieForm.cast
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="pt-20 pb-16 max-w-[1440px] mx-auto px-4 sm:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* Admin Sidebar */}
        <aside className="rounded-xl bg-[#111114] border border-white/10 p-3 h-fit lg:sticky lg:top-20 space-y-1">
          <div className="px-3 py-2 border-b border-white/10 mb-2">
            <p className="font-display text-sm font-semibold text-white">CineFlix Studio</p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
          </div>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'add-movie' && tab !== 'add-movie') {
                    setEditingMovieId(null);
                    setMovieForm(EMPTY_MOVIE_FORM);
                  }
                  setTab(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active ? 'bg-[#E50914] text-white' : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Main Workspace */}
        <main className="space-y-8 min-w-0">
          {/* DASHBOARD & ANALYTICS */}
          {(tab === 'dashboard' || tab === 'analytics') && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {tab === 'analytics' ? 'Platform Analytics' : 'Dashboard Overview'}
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1">Real-time catalog metrics, engagement sessions, and member growth.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMovieId(null);
                    setMovieForm(EMPTY_MOVIE_FORM);
                    setTab('add-movie');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-xs font-semibold transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Movie
                </button>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Titles', value: stats.totalMovies ?? 0, sub: `${stats.publishedMovies ?? 0} published` },
                  { label: 'Registered Users', value: stats.totalUsers ?? 0, sub: 'Active platform members' },
                  { label: 'Genres', value: stats.totalGenres ?? 0, sub: 'Catalog categories' },
                  { label: 'Watch Sessions', value: stats.totalWatchSessions ?? 0, sub: 'Tracked playback events' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl bg-[#111114] border border-white/10 p-5 space-y-1">
                    <p className="text-xs font-medium text-zinc-400">{kpi.label}</p>
                    <p className="font-mono tabular-nums text-3xl font-bold text-white">
                      {dashLoading ? '—' : kpi.value}
                    </p>
                    <p className="text-xs text-zinc-500">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-xl bg-[#111114] border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-semibold text-white">7-Day Viewing Activity</h2>
                    <Activity className="w-4 h-4 text-[#E50914]" />
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashData?.viewingActivity || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} />
                        <YAxis stroke="#a1a1aa" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111114', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8 }}
                        />
                        <Area type="monotone" dataKey="sessions" stroke="#E50914" fill="#E50914" fillOpacity={0.22} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl bg-[#111114] border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-semibold text-white">Monthly User Registrations</h2>
                    <Users className="w-4 h-4 text-[#E50914]" />
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashData?.monthlyRegistrations || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} />
                        <YAxis stroke="#a1a1aa" fontSize={12} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111114', borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8 }}
                        />
                        <Bar dataKey="users" fill="#E50914" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Most Watched & Recently Added */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-xl bg-[#111114] border border-white/10 p-5 space-y-4">
                  <h2 className="font-display text-base font-semibold text-white">Most Watched Titles</h2>
                  <div className="divide-y divide-white/10">
                    {(dashData?.mostWatched || []).map((m) => (
                      <div key={m._id} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{m.title}</p>
                          <p className="text-xs text-zinc-400 font-mono tabular-nums">
                            {m.releaseYear} · {m.type}
                          </p>
                        </div>
                        <span className="font-mono tabular-nums text-xs text-zinc-200 shrink-0">
                          {m.views.toLocaleString()} views
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#111114] border border-white/10 p-5 space-y-4">
                  <h2 className="font-display text-base font-semibold text-white">Recently Added</h2>
                  <div className="divide-y divide-white/10">
                    {(dashData?.recentlyAdded || []).map((m) => (
                      <div key={m._id} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{m.title}</p>
                          <p className="text-xs text-zinc-400">{(m.genres || []).slice(0, 2).join(', ')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEditMovie(m)}
                          className="text-xs text-zinc-300 hover:text-white underline underline-offset-4 shrink-0"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MOVIES MANAGEMENT TABLE */}
          {tab === 'movies' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <h1 className="font-display text-2xl font-bold text-white">Manage Movies & Series</h1>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={movieSearch}
                      onChange={(e) => {
                        setMovieSearch(e.target.value);
                        setMoviePage(1);
                      }}
                      placeholder="Filter titles..."
                      className="pl-9 pr-3 py-2 rounded-lg bg-[#111114] border border-white/15 text-sm text-white focus:outline-none focus:border-[#E50914]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMovieId(null);
                      setMovieForm(EMPTY_MOVIE_FORM);
                      setTab('add-movie');
                    }}
                    className="px-4 py-2 rounded-lg bg-[#E50914] text-white text-xs font-semibold whitespace-nowrap"
                  >
                    + Add Title
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#111114] border border-white/10 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs text-zinc-400">
                    <tr>
                      <th className="py-3 px-4 font-medium">Title</th>
                      <th className="py-3 px-4 font-medium">Type</th>
                      <th className="py-3 px-4 font-medium">Year</th>
                      <th className="py-3 px-4 font-medium text-right">Rating</th>
                      <th className="py-3 px-4 font-medium text-right">Views</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {(moviesData?.movies || []).map((m) => (
                      <tr key={m._id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-medium text-white">
                          <div className="flex items-center gap-3">
                            <img
                              src={m.poster}
                              alt={m.title}
                              referrerPolicy="no-referrer"
                              className="w-9 h-12 object-cover rounded bg-[#18181B]"
                            />
                            <div>
                              <p className="font-medium text-white">{m.title}</p>
                              <p className="text-xs text-zinc-400">{(m.genres || []).slice(0, 2).join(', ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-300 capitalize">{m.type}</td>
                        <td className="py-3 px-4 font-mono tabular-nums text-zinc-300">{m.releaseYear}</td>
                        <td className="py-3 px-4 font-mono tabular-nums text-right text-zinc-200">
                          {Number(m.rating || 8).toFixed(1)}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-right text-zinc-300">
                          {(m.views || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs capitalize text-zinc-300">{m.status}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditMovie(m)}
                              aria-label={`Edit ${m.title}`}
                              className="p-1.5 rounded-lg bg-[#18181B] border border-white/10 text-zinc-300 hover:text-white"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete({ type: 'movie', id: m._id, title: m.title })}
                              aria-label={`Delete ${m.title}`}
                              className="p-1.5 rounded-lg bg-[#18181B] border border-white/10 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(moviesData?.totalPages || 1) > 1 && (
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={moviePage <= 1}
                    onClick={() => setMoviePage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg bg-[#141418] border border-white/10 text-xs text-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-mono tabular-nums text-zinc-400">
                    {moviePage} / {moviesData?.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={moviePage >= (moviesData?.totalPages || 1)}
                    onClick={() => setMoviePage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-[#141418] border border-white/10 text-xs text-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ADD / EDIT MOVIE FORM */}
          {tab === 'add-movie' && (
            <form onSubmit={handleMovieSubmit} className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h1 className="font-display text-2xl font-bold text-white">
                  {editingMovieId ? 'Edit Title' : 'Add New Movie or Series'}
                </h1>
                <button
                  type="button"
                  onClick={() => setTab('movies')}
                  className="text-sm text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="rounded-xl bg-[#111114] border border-white/10 p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Title</label>
                    <input
                      type="text"
                      required
                      value={movieForm.title}
                      onChange={(e) => setMovieForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Solaris Horizon"
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Content Type</label>
                    <select
                      value={movieForm.type}
                      onChange={(e) => setMovieForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                    >
                      <option value="movie">Movie</option>
                      <option value="series">TV Series</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Synopsis / Description</label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    value={movieForm.description}
                    onChange={(e) => setMovieForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg bg-[#18181B] border border-white/15 p-3 text-sm text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Poster URL</label>
                    <input
                      type="text"
                      required
                      value={movieForm.poster}
                      onChange={(e) => setMovieForm((f) => ({ ...f, poster: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Backdrop URL</label>
                    <input
                      type="text"
                      required
                      value={movieForm.backdrop}
                      onChange={(e) => setMovieForm((f) => ({ ...f, backdrop: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Video Stream URL (MP4 / HLS)</label>
                    <input
                      type="text"
                      required
                      value={movieForm.videoUrl}
                      onChange={(e) => setMovieForm((f) => ({ ...f, videoUrl: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Trailer URL</label>
                    <input
                      type="text"
                      value={movieForm.trailerUrl}
                      onChange={(e) => setMovieForm((f) => ({ ...f, trailerUrl: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Release Date</label>
                    <input
                      type="date"
                      value={movieForm.releaseDate}
                      onChange={(e) => setMovieForm((f) => ({ ...f, releaseDate: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Duration (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={movieForm.duration}
                      onChange={(e) => setMovieForm((f) => ({ ...f, duration: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3 py-2 text-sm font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">IMDb Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      value={movieForm.imdbRating}
                      onChange={(e) => setMovieForm((f) => ({ ...f, imdbRating: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3 py-2 text-sm font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Visibility</label>
                    <select
                      value={movieForm.status}
                      onChange={(e) => setMovieForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3 py-2 text-sm text-white"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Director</label>
                    <input
                      type="text"
                      required
                      value={movieForm.director}
                      onChange={(e) => setMovieForm((f) => ({ ...f, director: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Language</label>
                    <input
                      type="text"
                      value={movieForm.language}
                      onChange={(e) => setMovieForm((f) => ({ ...f, language: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Age Rating</label>
                    <input
                      type="text"
                      value={movieForm.ageRating}
                      onChange={(e) => setMovieForm((f) => ({ ...f, ageRating: e.target.value }))}
                      className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Cast (comma-separated)</label>
                  <input
                    type="text"
                    value={movieForm.cast}
                    onChange={(e) => setMovieForm((f) => ({ ...f, cast: e.target.value }))}
                    className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-300">Genres</p>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((g) => {
                      const active = movieForm.genres.includes(g.name);
                      return (
                        <button
                          key={g._id}
                          type="button"
                          onClick={() =>
                            setMovieForm((f) => ({
                              ...f,
                              genres: active
                                ? f.genres.filter((x) => x !== g.name)
                                : [...f.genres, g.name],
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            active
                              ? 'bg-[#E50914] text-white'
                              : 'bg-[#18181B] border border-white/10 text-zinc-300'
                          }`}
                        >
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-1">
                  <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={movieForm.featured}
                      onChange={(e) => setMovieForm((f) => ({ ...f, featured: e.target.checked }))}
                      className="accent-[#E50914]"
                    />
                    Featured on Hero Banner
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={movieForm.trending}
                      onChange={(e) => setMovieForm((f) => ({ ...f, trending: e.target.checked }))}
                      className="accent-[#E50914]"
                    />
                    Mark as Trending Now
                  </label>
                </div>

                {movieForm.type === 'series' && (
                  <div className="border-t border-white/10 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Episodes</p>
                      <button
                        type="button"
                        onClick={() =>
                          setMovieForm((f) => ({
                            ...f,
                            episodes: [
                              ...f.episodes,
                              {
                                episodeNumber: f.episodes.length + 1,
                                seasonNumber: 1,
                                title: `Episode ${f.episodes.length + 1}`,
                                description: '',
                                duration: 48,
                                videoUrl: f.videoUrl,
                              },
                            ],
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-white"
                      >
                        + Add Episode
                      </button>
                    </div>
                    {movieForm.episodes.map((ep, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#18181B] p-3 rounded-lg">
                        <input
                          type="text"
                          value={ep.title}
                          onChange={(e) =>
                            setMovieForm((f) => {
                              const next = [...f.episodes];
                              next[idx] = { ...next[idx], title: e.target.value };
                              return { ...f, episodes: next };
                            })
                          }
                          placeholder="Episode title"
                          className="sm:col-span-2 rounded bg-[#111114] border border-white/10 px-3 py-1.5 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={ep.videoUrl}
                          onChange={(e) =>
                            setMovieForm((f) => {
                              const next = [...f.episodes];
                              next[idx] = { ...next[idx], videoUrl: e.target.value };
                              return { ...f, episodes: next };
                            })
                          }
                          placeholder="Episode video URL"
                          className="rounded bg-[#111114] border border-white/10 px-3 py-1.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setMovieForm((f) => ({
                              ...f,
                              episodes: f.episodes.filter((_, i) => i !== idx),
                            }))
                          }
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saveMovieMutation.isPending}
                    className="px-6 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {saveMovieMutation.isPending
                      ? 'Saving...'
                      : editingMovieId
                      ? 'Save Changes'
                      : 'Publish Title'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* GENRES CRUD */}
          {tab === 'genres' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-white border-b border-white/10 pb-4">Manage Genres</h1>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveGenreMutation.mutate(genreForm);
                }}
                className="rounded-xl bg-[#111114] border border-white/10 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
              >
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Genre Name</label>
                  <input
                    type="text"
                    required
                    value={genreForm.name}
                    onChange={(e) => setGenreForm((g) => ({ ...g, name: e.target.value }))}
                    placeholder="e.g. Documentary"
                    className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={genreForm.description}
                    onChange={(e) => setGenreForm((g) => ({ ...g, description: e.target.value }))}
                    placeholder="Short category summary"
                    className="w-full rounded-lg bg-[#18181B] border border-white/15 px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#E50914] text-white text-sm font-semibold"
                  >
                    {genreForm.id ? 'Update Genre' : 'Add Genre'}
                  </button>
                  {genreForm.id && (
                    <button
                      type="button"
                      onClick={() => setGenreForm({ id: null, name: '', description: '' })}
                      className="px-3 py-2 rounded-lg bg-white/10 text-xs text-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="rounded-xl bg-[#111114] border border-white/10 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs text-zinc-400">
                    <tr>
                      <th className="py-3 px-4">Genre</th>
                      <th className="py-3 px-4">Slug</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {genres.map((g) => (
                      <tr key={g._id}>
                        <td className="py-3 px-4 font-medium text-white">{g.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-400">{g.slug}</td>
                        <td className="py-3 px-4 text-zinc-400">{g.description}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setGenreForm({ id: g._id, name: g.name, description: g.description || '' })}
                            className="text-xs text-zinc-300 hover:text-white underline underline-offset-4"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGenreMutation.mutate(g._id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS MANAGEMENT */}
          {tab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <h1 className="font-display text-2xl font-bold text-white">Manage Users</h1>
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  placeholder="Search name or email..."
                  className="px-3.5 py-2 rounded-lg bg-[#111114] border border-white/15 text-sm text-white"
                />
              </div>

              <div className="rounded-xl bg-[#111114] border border-white/10 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs text-zinc-400">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {(usersData?.users || []).map((u) => (
                      <tr key={u._id}>
                        <td className="py-3 px-4">
                          <p className="font-medium text-white">{u.name}</p>
                          <p className="text-xs text-zinc-400">{u.email}</p>
                        </td>
                        <td className="py-3 px-4 capitalize text-zinc-200">{u.role}</td>
                        <td className="py-3 px-4 capitalize text-zinc-300">{u.status || 'active'}</td>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateUserMutation.mutate({
                                id: u._id,
                                role: u.role === 'admin' ? 'user' : 'admin',
                              })
                            }
                            className="px-2.5 py-1 rounded bg-[#18181B] border border-white/10 text-xs text-zinc-200 hover:text-white"
                          >
                            {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateUserMutation.mutate({
                                id: u._id,
                                status: u.status === 'suspended' ? 'active' : 'suspended',
                              })
                            }
                            className="px-2.5 py-1 rounded bg-[#18181B] border border-white/10 text-xs text-zinc-300 hover:text-white"
                          >
                            {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REVIEWS MODERATION */}
          {tab === 'reviews' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-white border-b border-white/10 pb-4">Audience Reviews</h1>
              <div className="space-y-3">
                {(reviewsData?.reviews || []).length === 0 ? (
                  <p className="text-sm text-zinc-400">No reviews submitted yet.</p>
                ) : (
                  (reviewsData?.reviews || []).map((r) => (
                    <div key={r._id} className="rounded-xl bg-[#111114] border border-white/10 p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">
                          {r.movie?.title || 'Title'} · <span className="font-mono text-amber-400">{r.rating}/10</span>
                        </p>
                        <p className="text-xs text-zinc-400">By {r.user?.name || 'Member'}</p>
                        <p className="text-sm text-zinc-300">{r.comment}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteReviewMutation.mutate(r._id)}
                        className="p-2 rounded-lg bg-[#18181B] border border-white/10 text-red-400 hover:text-red-300"
                        aria-label="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SETTINGS & AUDIT LOGS */}
          {tab === 'settings' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-white border-b border-white/10 pb-4">
                Security & Admin Audit Log
              </h1>
              <div className="rounded-xl bg-[#111114] border border-white/10 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs text-zinc-400">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {(logsData?.logs || []).map((log) => (
                      <tr key={log._id}>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-zinc-200">{log.actorEmail}</td>
                        <td className="py-3 px-4 font-mono text-xs text-white">{log.action}</td>
                        <td className="py-3 px-4 text-zinc-400">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#111114] border border-white/15 p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-white">Confirm Deletion</h2>
            <p className="text-sm text-zinc-300">
              Permanently delete <span className="font-semibold text-white">{confirmDelete.title}</span> from CineFlix? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMovieMutation.mutate(confirmDelete.id)}
                className="px-4 py-2 rounded-lg bg-[#E50914] text-sm font-semibold text-white"
              >
                Delete Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
