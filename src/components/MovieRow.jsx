import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard.jsx';

export default function MovieRow({ title, movies = [], viewAllTo = null, progressMap = null }) {
  const rowRef = useRef(null);

  if (!movies || movies.length === 0) return null;

  const scrollRow = (dir) => {
    if (!rowRef.current) return;
    const offset = rowRef.current.clientWidth * 0.8;
    rowRef.current.scrollBy({ left: dir * offset, behavior: 'smooth' });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
            >
              View all
            </Link>
          )}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollRow(-1)}
              className="p-1.5 rounded-lg bg-[#141418] border border-white/10 text-zinc-300 hover:text-white hover:border-white/25 transition-colors"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollRow(1)}
              className="p-1.5 rounded-lg bg-[#141418] border border-white/10 text-zinc-300 hover:text-white hover:border-white/25 transition-colors"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory"
      >
        {movies.map((movie) => {
          const pct = progressMap ? progressMap.get(String(movie._id)) ?? null : null;
          return (
            <div
              key={movie._id}
              className="w-[165px] sm:w-[195px] lg:w-[215px] shrink-0 snap-start"
            >
              <MovieCard movie={movie} progressPercent={pct} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
