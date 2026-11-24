import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Search, User, X, LogOut, ShieldCheck, Bookmark, History } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [genresOpen, setGenresOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const genresRef = useRef(null);
  const profileRef = useRef(null);

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => api.get('/api/genres'),
    staleTime: 60_000,
  });
  const genres = genresData?.genres || [];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (genresRef.current && !genresRef.current.contains(e.target)) setGenresOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setSearchOpen(false);
    setMobileOpen(false);
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
      isActive ? 'text-white border-[#E50914]' : 'text-zinc-300 hover:text-white border-transparent'
    }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-200 ${
        scrolled ? 'bg-[#09090B]/95 backdrop-blur-md border-b border-white/10' : 'bg-gradient-to-b from-[#09090B]/90 to-transparent'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean wordmark */}
        <Link
          to="/"
          className="font-display text-2xl font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Cine<span className="text-[#E50914]">Flix</span>
        </Link>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/movies" className={navLinkClass}>
            Movies
          </NavLink>
          <NavLink to="/series" className={navLinkClass}>
            TV Series
          </NavLink>
          <div className="relative" ref={genresRef}>
            <button
              type="button"
              onClick={() => setGenresOpen((o) => !o)}
              className="flex items-center gap-1 text-sm font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
            >
              Genres
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${genresOpen ? 'rotate-180' : ''}`} />
            </button>
            {genresOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-[#111114] border border-white/10 shadow-2xl py-2 grid grid-cols-1">
                <Link
                  to="/genres"
                  onClick={() => setGenresOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 border-b border-white/10"
                >
                  All Genres
                </Link>
                {genres.map((g) => (
                  <Link
                    key={g._id}
                    to={`/genres/${g.slug}`}
                    onClick={() => setGenresOpen(false)}
                    className="px-4 py-2 text-sm text-zinc-200 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <NavLink to="/watchlist" className={navLinkClass}>
            Watchlist
          </NavLink>
        </nav>

        {/* Zone 3: Search + Profile / Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center bg-[#141418] border border-white/15 rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
              <input
                type="search"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Titles, actors, directors..."
                className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-48 lg:w-60"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-zinc-400 hover:text-white ml-1"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-zinc-300 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              aria-label="Search movies and series"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg bg-[#18181B] border border-white/10 hover:border-white/25 px-3 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-4 h-4 text-[#E50914]" />
                <span className="max-w-[110px] truncate hidden sm:inline">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#111114] border border-white/10 shadow-2xl py-1.5">
                  <div className="px-4 py-2.5 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-200 hover:text-white hover:bg-white/5"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    Profile
                  </Link>
                  <Link
                    to="/watchlist"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-200 hover:text-white hover:bg-white/5"
                  >
                    <Bookmark className="w-4 h-4 text-zinc-400" />
                    My Watchlist
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-200 hover:text-white hover:bg-white/5"
                  >
                    <History className="w-4 h-4 text-zinc-400" />
                    Watch History
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#E50914] font-medium hover:bg-white/5 border-t border-white/10 mt-1 pt-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin Console
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      setProfileOpen(false);
                      await logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 border-t border-white/10 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-zinc-400" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-[#E50914] hover:bg-[#c80812] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2.5 text-zinc-200 hover:text-white rounded-lg hover:bg-white/5"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#09090B]/98 border-b border-white/10 px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#141418] border border-white/15 rounded-lg px-3 py-2.5">
            <Search className="w-4 h-4 text-zinc-400 mr-2" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search titles, cast, directors..."
              className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none flex-1"
            />
          </form>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/', label: 'Home' },
              { to: '/movies', label: 'Movies' },
              { to: '/series', label: 'TV Series' },
              { to: '/genres', label: 'Genres' },
              { to: '/watchlist', label: 'Watchlist' },
              { to: '/continue-watching', label: 'Continue Watching' },
              { to: '/history', label: 'Watch History' },
              ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin Console' }] : []),
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg bg-[#141418] text-sm font-medium text-zinc-200 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
