import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Info, Play, Plus, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function HeroBanner({ movies = [] }) {
  const [index, setIndex] = useState(0);
  const { watchlistIds, toggleWatchlist } = useAuth();

  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [movies.length]);

  if (!movies || movies.length === 0) {
    return (
      <div className="h-[72vh] min-h-[520px] w-full bg-[#111114] animate-pulse" />
    );
  }

  const current = movies[index % movies.length];
  const inWatchlist = watchlistIds.has(String(current._id));
  const durationLabel =
    current.type === 'series'
      ? `${current.episodes?.length || 1} Episodes`
      : `${Math.floor((current.duration || 100) / 60)}h ${(current.duration || 100) % 60}m`;

  return (
    <section className="relative h-[78vh] min-h-[540px] max-h-[820px] w-full overflow-hidden bg-[#09090B]">
      <img
        key={current._id}
        src={current.backdrop || current.poster}
        alt={current.title}
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700"
      />
      {/* Measured contrast scrims */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/55 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#09090B]/90 via-[#09090B]/45 to-transparent" />

      <div className="relative h-full max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col justify-end pb-14 sm:pb-20">
        <div className="max-w-2xl space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-300 font-mono tabular-nums">
            <span className="font-sans font-semibold text-[#E50914] uppercase tracking-wider text-xs">
              Featured {current.type === 'series' ? 'Series' : 'Premiere'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{current.releaseYear}</span>
            <span aria-hidden="true">·</span>
            <span className="font-sans">{(current.genres || []).slice(0, 2).join(' / ')}</span>
            <span aria-hidden="true">·</span>
            <span>{durationLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-white font-semibold">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              IMDb {Number(current.imdbRating || current.rating || 8.5).toFixed(1)}
            </span>
          </div>

          <h1
            className="font-display font-bold tracking-tight text-white leading-[1.06]"
            style={{ fontSize: 'clamp(2.25rem, 4.5vw, 4rem)', textWrap: 'balance' }}
          >
            {current.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed line-clamp-3 max-w-xl">
            {current.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to={`/watch/${current.slug || current._id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-sm font-semibold transition-colors whitespace-nowrap shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Now
            </Link>
            <Link
              to={`/movies/${current.slug || current._id}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Info className="w-4 h-4" />
              More Info
            </Link>
            <button
              type="button"
              onClick={() => toggleWatchlist(current._id)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-[#141418]/80 hover:bg-[#1C1C22] border border-white/15 text-zinc-200 text-sm font-medium transition-colors whitespace-nowrap"
            >
              {inWatchlist ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
              {inWatchlist ? 'In Watchlist' : 'Watchlist'}
            </button>
          </div>
        </div>

        {movies.length > 1 && (
          <div className="flex items-center gap-2 mt-8">
            {movies.map((m, i) => (
              <button
                key={m._id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show featured title ${m.title}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-8 bg-[#E50914]' : 'w-3 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
