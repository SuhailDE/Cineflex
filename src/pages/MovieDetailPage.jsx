import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Check, Film, Play, Plus, Star, X } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import MovieRow from '../components/MovieRow.jsx';

export default function MovieDetailPage() {
  const { id } = useParams();
  const { user, watchlistIds, toggleWatchlist } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [trailerOpen, setTrailerOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['movie-detail', id],
    queryFn: () => api.get(`/api/movies/${id}`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { rating: '9', comment: '' },
  });

  const reviewMutation = useMutation({
    mutationFn: (payload) => api.post(`/api/movies/${data.movie._id}/reviews`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-detail', id] });
      reset({ rating: '9', comment: '' });
      showToast('Your review has been published.', 'success');
    },
    onError: (err) => showToast(err.message || 'Could not submit review.', 'error'),
  });

  if (isLoading) {
    return (
      <div className="pt-24 max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
        <div className="h-[460px] rounded-2xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (isError || !data?.movie) {
    return (
      <div className="pt-32 pb-20 max-w-xl mx-auto px-4 text-center space-y-4">
        <Film className="w-12 h-12 text-zinc-500 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-white">Title Not Found</h1>
        <p className="text-sm text-zinc-400">This film or series is unavailable or has been removed.</p>
        <Link to="/movies" className="inline-block px-5 py-2.5 rounded-lg bg-[#E50914] text-white text-sm font-medium">
          Browse Catalog
        </Link>
      </div>
    );
  }

  const { movie, similar = [], reviews = [] } = data;
  const inWatchlist = watchlistIds.has(String(movie._id));
  const durationLabel =
    movie.type === 'series'
      ? `${movie.episodes?.length || 1} Episodes`
      : `${Math.floor((movie.duration || 100) / 60)}h ${(movie.duration || 100) % 60}m`;

  return (
    <div className="pb-16">
      {/* Backdrop Hero */}
      <section className="relative min-h-[540px] w-full overflow-hidden bg-[#09090B] pt-24 pb-12">
        <img
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/75 to-[#09090B]/50" />

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 items-end pt-8">
          <div className="hidden md:block aspect-[3/4] rounded-xl overflow-hidden border border-white/15 shadow-2xl bg-[#111114]">
            <img
              src={movie.poster}
              alt={`${movie.title} poster`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-300 font-mono tabular-nums">
              <span className="font-sans uppercase tracking-wider text-xs font-semibold text-[#E50914]">
                {movie.type === 'series' ? 'Original Series' : 'Feature Film'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{movie.releaseYear}</span>
              <span aria-hidden="true">·</span>
              <span>{movie.ageRating}</span>
              <span aria-hidden="true">·</span>
              <span>{durationLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-sans">{movie.language}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-white font-semibold">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {Number(movie.rating || movie.imdbRating || 8).toFixed(1)}
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white" style={{ textWrap: 'balance' }}>
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
              {(movie.genres || []).join(' · ')}
            </div>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
              {movie.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-300 pt-1">
              <div>
                <span className="text-zinc-500">Director: </span>
                <span className="text-white font-medium">{movie.director}</span>
              </div>
              <div>
                <span className="text-zinc-500">Country: </span>
                <span className="text-white font-medium">{movie.country}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-500">Starring: </span>
                <span className="text-zinc-200">{(movie.cast || []).join(', ')}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={`/watch/${movie.slug || movie._id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </Link>
              {movie.trailerUrl && (
                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Watch Trailer
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleWatchlist(movie._id)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[#141418] hover:bg-[#1C1C22] border border-white/15 text-zinc-200 text-sm font-medium transition-colors whitespace-nowrap"
              >
                {inWatchlist ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                {inWatchlist ? 'Saved to Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-14 mt-8">
        {/* Episodes Section for TV Series */}
        {movie.type === 'series' && movie.episodes?.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-white">Episodes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {movie.episodes.map((ep) => (
                <Link
                  key={ep._id || ep.episodeNumber}
                  to={`/watch/${movie.slug || movie._id}?episode=${ep.episodeNumber}`}
                  className="group rounded-xl bg-[#111114] border border-white/10 hover:border-white/25 p-5 flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-400">
                      <span>S{ep.seasonNumber || 1} · Episode {ep.episodeNumber}</span>
                      <span>{ep.duration} min</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-white group-hover:text-[#E50914] transition-colors">
                      {ep.title}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">{ep.description}</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-white">
                    <Play className="w-3.5 h-3.5 text-[#E50914] fill-current" />
                    Play Episode
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-white/10 pt-10">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-white">Audience Reviews</h2>
            {user ? (
              <form
                onSubmit={handleSubmit((vals) => reviewMutation.mutate({ rating: Number(vals.rating), comment: vals.comment }))}
                className="rounded-xl bg-[#111114] border border-white/10 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <label htmlFor="rating-select" className="text-sm font-medium text-zinc-200">
                    Your Rating
                  </label>
                  <select
                    id="rating-select"
                    {...register('rating')}
                    className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-white/15 text-sm font-mono text-white"
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} / 10
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <textarea
                    rows={3}
                    placeholder="Share your thoughts on the cinematography, pacing, or performances..."
                    {...register('comment', { required: 'Please enter a short review.', minLength: { value: 3, message: 'At least 3 characters required.' } })}
                    className="w-full rounded-lg bg-[#18181B] border border-white/15 p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
                  />
                  {errors.comment && <p className="mt-1 text-xs text-red-400">{errors.comment.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="px-5 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="rounded-xl bg-[#111114] border border-white/10 p-5 space-y-3">
                <p className="text-sm text-zinc-300">Sign in to rate this title and post a review.</p>
                <Link
                  to="/login"
                  className="inline-block px-4 py-2 rounded-lg bg-[#E50914] text-white text-sm font-medium"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-xl bg-[#111114] border border-white/10 p-8 text-center text-sm text-zinc-400">
                No reviews yet. Be the first viewer to rate {movie.title}.
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev._id} className="rounded-xl bg-[#111114] border border-white/10 p-5 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-sm text-white">{rev.user?.name || 'CineFlix Member'}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {rev.rating}/10
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <MovieRow title="More Like This" movies={similar} />
      </div>

      {/* Trailer Modal */}
      {trailerOpen && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-xl bg-[#111114] border border-white/15 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="font-display text-sm font-semibold text-white">{movie.title} — Official Trailer</span>
              <button
                type="button"
                onClick={() => setTrailerOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
                aria-label="Close trailer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <video src={movie.trailerUrl} controls autoPlay className="w-full aspect-video bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}
