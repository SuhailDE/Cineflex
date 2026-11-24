import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#09090B] mt-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <Link to="/" className="font-display text-xl font-bold tracking-tight text-white">
            Cine<span className="text-[#E50914]">Flix</span>
          </Link>
          <p className="mt-2 text-sm text-zinc-400 max-w-sm">
            Curated cinema and original episodic storytelling engineered for seamless streaming across every screen.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-400">
          <Link to="/movies" className="hover:text-white transition-colors">
            Movies
          </Link>
          <Link to="/series" className="hover:text-white transition-colors">
            TV Series
          </Link>
          <Link to="/genres" className="hover:text-white transition-colors">
            Genres
          </Link>
          <Link to="/continue-watching" className="hover:text-white transition-colors">
            Continue Watching
          </Link>
          <Link to="/about" className="hover:text-white transition-colors">
            About Us
          </Link>
          <Link to="/contact" className="hover:text-white transition-colors">
            Contact Us
          </Link>
        </div>

        <p className="text-xs text-zinc-500 font-mono tabular-nums">
          © {new Date().getFullYear()} CineFlix Media.
        </p>
      </div>
    </footer>
  );
}
