import { useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Plus, Star } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import MovieRow from '../components/MovieRow.jsx';

export default function WatchPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, watchlistIds, toggleWatchlist } = useAuth();

  const episodeParam = Number(searchParams.get('episode')) || 1;

  const { data, isLoading } = useQuery({
    queryKey: ['watch-movie', id],
    queryFn: () => api.get(`/api/movies/${id}`),
  });

  const { data: historyData } = useQuery({
    queryKey: ['watch-history', user?._id],
    queryFn: () => api.get('/api/history'),
    enabled: Boolean(user),
  });

  const movie = data?.movie;
  const similar = data?.similar || [];

  const activeEpisode = useMemo(() => {
    if (!movie || movie.type !== 'series' || !movie.episodes?.length) return null;
    return (
      movie.episodes.find((ep) => ep.episodeNumber === episodeParam) || movie.episodes[0]
    );
  }, [movie, episodeParam]);

  const nextEpisode = useMemo(() => {
    if (!movie || movie.type !== 'series' || !movie.episodes?.length || !activeEpisode) return null;
    const idx = movie.episodes.findIndex((ep) => ep.episodeNumber === activeEpisode.episodeNumber);
    return idx >= 0 && idx + 1 < movie.episodes.length ? movie.episodes[idx + 1] : null;
  }, [movie, activeEpisode]);

  const initialTime = useMemo(() => {
    if (!movie || !historyData?.history) return 0;
    const match = historyData.history.find((h) => String(h.movie?._id) === String(movie._id));
    if (!match || match.completed) return 0;
    if (activeEpisode && match.episodeId && String(match.episodeId) !== String(activeEpisode._id || activeEpisode.episodeNumber)) {
      return 0;
    }
    return match.progress || 0;
  }, [movie, historyData, activeEpisode]);

  const handleProgressSync = useCallback(
    async ({ progress, duration, completed }) => {
      if (!user || !movie) return;
      try {
        await api.post('/api/history/progress', {
          movieId: movie._id,
          progress,
          duration,
          completed,
          episodeId: activeEpisode ? String(activeEpisode._id || activeEpisode.episodeNumber) : null,
        });
      } catch {
        // non-blocking background sync
      }
    },
    [user, movie, activeEpisode]
  );

  if (isLoading) {
    return (
      <div className="pt-24 pb-16 max-w-[1440px] mx-auto px-4 sm:px-8">
        <div className="aspect-video w-full rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="pt-32 pb-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-white">Video Unavailable</h1>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-lg bg-[#E50914] text-white text-sm font-medium"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const streamUrl = activeEpisode?.videoUrl || movie.videoUrl;
  const inWatchlist = watchlistIds.has(String(movie._id));

  return (
    <div className="pt-20 pb-16 max-w-[1440px] mx-auto px-4 sm:px-8 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to={`/movies/${movie.slug || movie._id}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {movie.title}
        </Link>

        {!user && (
          <Link to="/login" className="text-xs text-zinc-400 hover:text-white underline underline-offset-4">
            Sign in to sync watch progress across devices
          </Link>
        )}
      </div>

      <VideoPlayer
        src={streamUrl}
        poster={movie.backdrop || movie.poster}
        title={activeEpisode ? `${movie.title} — ${activeEpisode.title}` : movie.title}
        initialTime={initialTime}
        onProgressSync={user ? handleProgressSync : null}
        nextEpisode={nextEpisode}
        onSelectNextEpisode={(ep) => setSearchParams({ episode: String(ep.episodeNumber) })}
      />

      {/* Title Metadata Bar */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/10 pb-8">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono tabular-nums">
            <span>{movie.releaseYear}</span>
            <span aria-hidden="true">·</span>
            <span>{movie.ageRating}</span>
            <span aria-hidden="true">·</span>
            <span className="font-sans">{(movie.genres || []).join(' / ')}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-zinc-200">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {Number(movie.rating || 8).toFixed(1)}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {movie.title}
            {activeEpisode && (
              <span className="text-zinc-400 font-normal"> — Ep. {activeEpisode.episodeNumber}: {activeEpisode.title}</span>
            )}
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {activeEpisode?.description || movie.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggleWatchlist(movie._id)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#141418] hover:bg-[#1C1C22] border border-white/15 text-sm font-medium text-white shrink-0"
        >
          {inWatchlist ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
          {inWatchlist ? 'In My Watchlist' : 'Add to Watchlist'}
        </button>
      </div>

      {/* Episodes Switcher */}
      {movie.type === 'series' && movie.episodes?.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-white">Episodes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {movie.episodes.map((ep) => {
              const isCurrent = activeEpisode?.episodeNumber === ep.episodeNumber;
              return (
                <button
                  key={ep._id || ep.episodeNumber}
                  type="button"
                  onClick={() => setSearchParams({ episode: String(ep.episodeNumber) })}
                  className={`text-left rounded-xl p-4 border transition-colors ${
                    isCurrent
                      ? 'bg-[#E50914]/15 border-[#E50914]'
                      : 'bg-[#111114] border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-400 mb-1">
                    <span>Episode {ep.episodeNumber}</span>
                    <span>{ep.duration} min</span>
                  </div>
                  <p className="font-display text-sm font-semibold text-white">{ep.title}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <MovieRow title="Up Next & Related" movies={similar} />
    </div>
  );
}
