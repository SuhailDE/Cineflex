import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Clock, History, Play, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import MovieCard from '../components/MovieCard.jsx';

function AuthGate({ title, description }) {
  return (
    <div className="pt-32 pb-20 max-w-lg mx-auto px-4 text-center space-y-4">
      <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
      <p className="text-sm text-zinc-400">{description}</p>
      <Link
        to="/login"
        className="inline-block px-6 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors"
      >
        Sign In to Continue
      </Link>
    </div>
  );
}

export function WatchlistPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['watchlist', user?._id],
    queryFn: () => api.get('/api/watchlist'),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <AuthGate
        title="My Watchlist"
        description="Sign in to save films and series to watch later across any device."
      />
    );
  }

  const movies = data?.movies || [];

  return (
    <div className="pt-24 pb-16 max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
      <div className="border-b border-white/10 pb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">My Watchlist</h1>
          <p className="text-sm text-zinc-400 mt-1 font-mono tabular-nums">{movies.length} saved titles</p>
        </div>
        <Link to="/movies" className="text-sm text-zinc-300 hover:text-white underline underline-offset-4">
          Explore Catalog
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="rounded-xl bg-[#111114] border border-white/10 p-12 text-center space-y-3">
          <Bookmark className="w-10 h-10 text-zinc-500 mx-auto" />
          <h2 className="font-display text-lg font-semibold text-white">Your watchlist is empty</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Browse CineFlix and click the plus icon on any title to keep track of what you want to watch next.
          </p>
          <Link
            to="/movies"
            className="inline-block px-5 py-2.5 rounded-lg bg-[#E50914] text-white text-sm font-medium"
          >
            Discover Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((m) => (
            <MovieCard key={m._id} movie={m} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ContinueWatchingPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['continue-watching', user?._id],
    queryFn: () => api.get('/api/history?continueWatching=true'),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <AuthGate
        title="Continue Watching"
        description="Sign in to resume playback from your exact timestamp."
      />
    );
  }

  const items = data?.history || [];

  return (
    <div className="pt-24 pb-16 max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
      <div className="border-b border-white/10 pb-5">
        <h1 className="font-display text-3xl font-bold text-white">Continue Watching</h1>
        <p className="text-sm text-zinc-400 mt-1">Pick up right where you left off.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-[#111114] border border-white/10 p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-zinc-500 mx-auto" />
          <h2 className="font-display text-lg font-semibold text-white">Nothing in progress</h2>
          <p className="text-sm text-zinc-400">Start watching a movie or series and your progress will appear here automatically.</p>
          <Link to="/" className="inline-block px-5 py-2.5 rounded-lg bg-[#E50914] text-white text-sm font-medium">
            Browse Home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => {
            const pct = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;
            return <MovieCard key={item._id} movie={item.movie} progressPercent={pct} />;
          })}
        </div>
      )}
    </div>
  );
}

export function HistoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['watch-history', user?._id],
    queryFn: () => api.get('/api/history'),
    enabled: Boolean(user),
  });

  const removeMutation = useMutation({
    mutationFn: (movieId) => api.del(`/api/history/${movieId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history'] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
      showToast('Removed from watch history.', 'info');
    },
    onError: (err) => showToast(err.message || 'Could not remove entry.', 'error'),
  });

  if (!user) {
    return (
      <AuthGate
        title="Watch History"
        description="Sign in to view and manage the titles you have streamed."
      />
    );
  }

  const history = data?.history || [];

  return (
    <div className="pt-24 pb-16 max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
      <div className="border-b border-white/10 pb-5 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Watch History</h1>
          <p className="text-sm text-zinc-400 mt-1 font-mono tabular-nums">{history.length} recorded titles</p>
        </div>
        <Link to="/continue-watching" className="text-sm text-zinc-300 hover:text-white underline underline-offset-4">
          Continue Watching
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-xl bg-[#111114] border border-white/10 p-12 text-center space-y-3">
          <History className="w-10 h-10 text-zinc-500 mx-auto" />
          <h2 className="font-display text-lg font-semibold text-white">No watch history yet</h2>
          <p className="text-sm text-zinc-400">Titles you stream on CineFlix are logged here for quick resuming.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const pct = item.duration > 0 ? Math.min(100, Math.round((item.progress / item.duration) * 100)) : 0;
            return (
              <div
                key={item._id}
                className="rounded-xl bg-[#111114] border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.movie.poster}
                    alt={item.movie.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-20 object-cover rounded-lg bg-[#18181B] shrink-0"
                  />
                  <div className="space-y-1">
                    <Link
                      to={`/movies/${item.movie.slug || item.movie._id}`}
                      className="font-display text-base font-semibold text-white hover:text-[#E50914] transition-colors"
                    >
                      {item.movie.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono tabular-nums">
                      <span>{item.completed ? 'Completed' : `${pct}% watched`}</span>
                      <span aria-hidden="true">·</span>
                      <span>Last watched {new Date(item.lastWatched).toLocaleDateString()}</span>
                    </div>
                    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#E50914]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/watch/${item.movie.slug || item.movie._id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-xs font-semibold transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {item.completed ? 'Watch Again' : 'Resume'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(item.movie._id)}
                    aria-label={`Remove ${item.movie.title} from watch history`}
                    className="p-2 rounded-lg bg-[#18181B] border border-white/10 text-zinc-400 hover:text-white hover:border-white/25 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
