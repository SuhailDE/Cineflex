import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Film, Play, Plus, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function MovieCard({ movie, progressPercent = null }) {
  const { watchlistIds, toggleWatchlist } = useAuth();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  if (!movie) return null;
  const inWatchlist = watchlistIds.has(String(movie._id));
  const primaryGenre = movie.genres?.[0] || (movie.type === 'series' ? 'Series' : 'Film');

  return (
    <div className="group relative flex flex-col rounded-xl bg-[#111114] border border-white/10 overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:border-white/25">
      <Link to={`/movies/${movie.slug || movie._id}`} className="relative aspect-[3/4] w-full overflow-hidden bg-[#18181B]">
        {!imgError && movie.poster ? (
          <img
            src={movie.poster}
            alt={`${movie.title} poster`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#18181B] via-[#111114] to-[#09090B]">
            <Film className="w-8 h-8 text-zinc-500 mb-2" />
            <span className="font-display text-sm font-semibold text-zinc-200 line-clamp-2">{movie.title}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

        {/* Hover action controls */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/watch/${movie.slug || movie._id}`);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-xs font-semibold shadow-lg transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleWatchlist(movie._id);
            }}
            aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`p-2 rounded-lg border transition-colors ${
              inWatchlist
                ? 'bg-white text-black border-white'
                : 'bg-[#09090B]/85 text-white border-white/25 hover:border-white'
            }`}
          >
            {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>

        {progressPercent !== null && progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-full bg-[#E50914]" style={{ width: `${Math.min(100, Math.round(progressPercent))}%` }} />
          </div>
        )}
      </Link>

      <div className="p-3.5 flex flex-col gap-1">
        <Link
          to={`/movies/${movie.slug || movie._id}`}
          className="font-display text-sm sm:text-base font-semibold text-white truncate hover:text-[#E50914] transition-colors"
        >
          {movie.title}
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono tabular-nums truncate">
          <span>{movie.releaseYear}</span>
          <span aria-hidden="true">·</span>
          <span className="font-sans truncate">{primaryGenre}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 text-zinc-200">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {Number(movie.rating || movie.imdbRating || 8).toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
