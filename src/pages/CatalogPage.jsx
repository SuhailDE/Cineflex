import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Film, Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../services/api.js';
import MovieCard from '../components/MovieCard.jsx';

export default function CatalogPage({ fixedType = '' }) {
  const { slug: routeGenreSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(routeGenreSlug || searchParams.get('genre') || 'all');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || 'all');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || 'all');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '0');
  const [sort, setSort] = useState(searchParams.get('sort') || 'popular');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  useEffect(() => {
    if (routeGenreSlug) {
      setSelectedGenre(routeGenreSlug);
      setPage(1);
    }
  }, [routeGenreSlug]);

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    setSearchInput(qParam);
    setDebouncedSearch(qParam);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => api.get('/api/genres'),
  });
  const genres = genresData?.genres || [];

  const queryStr = new URLSearchParams({
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(selectedGenre !== 'all' ? { genre: selectedGenre.replace(/-/g, ' ') } : {}),
    ...(selectedYear !== 'all' ? { year: selectedYear } : {}),
    ...(selectedLanguage !== 'all' ? { language: selectedLanguage } : {}),
    ...(Number(minRating) > 0 ? { minRating } : {}),
    ...(fixedType ? { type: fixedType } : {}),
    sort,
    page: String(page),
    limit: '18',
  }).toString();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['catalog', queryStr],
    queryFn: () => api.get(`/api/movies?${queryStr}`),
  });

  const movies = data?.movies || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const activeGenreName =
    genres.find((g) => g.slug === selectedGenre || g.name.toLowerCase() === selectedGenre.toLowerCase())?.name ||
    (selectedGenre !== 'all' ? selectedGenre.replace(/-/g, ' ') : null);

  const pageTitle =
    fixedType === 'series'
      ? 'TV Series'
      : fixedType === 'movie'
      ? 'Movies'
      : debouncedSearch
      ? `Search results for "${debouncedSearch}"`
      : activeGenreName
      ? `${activeGenreName} Collection`
      : 'Browse Genres & Titles';

  const resetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedGenre('all');
    setSelectedYear('all');
    setSelectedLanguage('all');
    setMinRating('0');
    setSort('popular');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="pt-24 pb-16 max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white capitalize">
            {pageTitle}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400 font-mono tabular-nums">
            {total} {total === 1 ? 'title' : 'titles'} available
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, actor, or director..."
            className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-[#111114] border border-white/15 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedGenre('all');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              selectedGenre === 'all'
                ? 'bg-[#E50914] text-white'
                : 'bg-[#141418] text-zinc-300 border border-white/10 hover:text-white'
            }`}
          >
            All Genres
          </button>
          {genres.map((g) => {
            const active =
              selectedGenre.toLowerCase() === g.slug.toLowerCase() ||
              selectedGenre.toLowerCase() === g.name.toLowerCase();
            return (
              <button
                key={g._id}
                type="button"
                onClick={() => {
                  setSelectedGenre(g.name);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#E50914] text-white'
                    : 'bg-[#141418] text-zinc-300 border border-white/10 hover:text-white'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="inline-flex items-center gap-2 text-xs text-zinc-400 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Refine:</span>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by release year"
            className="px-3 py-2 rounded-lg bg-[#111114] border border-white/15 text-xs text-white focus:outline-none focus:border-[#E50914]"
          >
            <option value="all">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>

          <select
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by language"
            className="px-3 py-2 rounded-lg bg-[#111114] border border-white/15 text-xs text-white focus:outline-none focus:border-[#E50914]"
          >
            <option value="all">All Languages</option>
            <option value="English">English</option>
            <option value="French">French</option>
            <option value="Japanese">Japanese</option>
            <option value="Norwegian">Norwegian</option>
          </select>

          <select
            value={minRating}
            onChange={(e) => {
              setMinRating(e.target.value);
              setPage(1);
            }}
            aria-label="Minimum rating"
            className="px-3 py-2 rounded-lg bg-[#111114] border border-white/15 text-xs text-white focus:outline-none focus:border-[#E50914]"
          >
            <option value="0">Any Rating</option>
            <option value="7.5">7.5+ Rated</option>
            <option value="8">8.0+ Rated</option>
            <option value="8.5">8.5+ Rated</option>
          </select>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            aria-label="Sort results"
            className="px-3 py-2 rounded-lg bg-[#111114] border border-white/15 text-xs text-white focus:outline-none focus:border-[#E50914]"
          >
            <option value="popular">Sort: Most Popular</option>
            <option value="newest">Sort: Newest Release</option>
            <option value="rating">Sort: Highest Rated</option>
            <option value="title">Sort: Title A–Z</option>
          </select>

          {(debouncedSearch || selectedGenre !== 'all' || selectedYear !== 'all' || selectedLanguage !== 'all' || minRating !== '0') && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white underline underline-offset-4"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl bg-[#111114] border border-white/10 p-10 text-center space-y-3">
          <p className="text-base font-medium text-white">Unable to load titles right now.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg bg-[#E50914] text-white text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      ) : movies.length === 0 ? (
        <div className="rounded-xl bg-[#111114] border border-white/10 p-12 text-center space-y-3">
          <Film className="w-10 h-10 text-zinc-500 mx-auto" />
          <h2 className="font-display text-lg font-semibold text-white">No matching titles found</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Try adjusting your search keywords, release year, or genre filters to discover more movies and series.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map((m) => (
              <MovieCard key={m._id} movie={m} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-lg bg-[#141418] border border-white/10 text-sm text-white disabled:opacity-40 hover:border-white/25"
              >
                Previous
              </button>
              <span className="text-sm font-mono tabular-nums text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-lg bg-[#141418] border border-white/10 text-sm text-white disabled:opacity-40 hover:border-white/25"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
