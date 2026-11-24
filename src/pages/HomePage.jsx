import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import HeroBanner from '../components/HeroBanner.jsx';
import MovieRow from '../components/MovieRow.jsx';

export default function HomePage() {
  const { user } = useAuth();

  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['home-catalog'],
    queryFn: () => api.get('/api/movies?limit=60&sort=popular'),
  });

  const { data: recData } = useQuery({
    queryKey: ['recommendations', user?._id || 'anon'],
    queryFn: () => api.get('/api/movies/recommendations?limit=12'),
  });

  const { data: continueData } = useQuery({
    queryKey: ['continue-watching', user?._id],
    queryFn: () => api.get('/api/history?continueWatching=true'),
    enabled: Boolean(user),
  });

  const allMovies = catalogData?.movies || [];

  const sections = useMemo(() => {
    const featured = allMovies.filter((m) => m.featured);
    const trending = allMovies.filter((m) => m.trending);
    const popular = [...allMovies].sort((a, b) => (b.views || 0) - (a.views || 0));
    const recentlyAdded = [...allMovies].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    const topRated = [...allMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const byGenre = (name) =>
      allMovies.filter((m) => (m.genres || []).some((g) => g.toLowerCase() === name.toLowerCase()));

    return {
      featured: featured.length > 0 ? featured : allMovies.slice(0, 3),
      trending: trending.length > 0 ? trending : popular.slice(0, 8),
      popular: popular.slice(0, 10),
      recentlyAdded: recentlyAdded.slice(0, 10),
      topRated: topRated.slice(0, 10),
      action: byGenre('Action'),
      comedy: byGenre('Comedy'),
      horror: byGenre('Horror'),
      romance: byGenre('Romance'),
      sciFi: byGenre('Science Fiction'),
    };
  }, [allMovies]);

  const continueWatchingItems = continueData?.history || [];
  const continueMovies = continueWatchingItems.map((h) => h.movie).filter(Boolean);
  const progressMap = useMemo(() => {
    const map = new Map();
    for (const h of continueWatchingItems) {
      if (h.movie && h.duration > 0) {
        map.set(String(h.movie._id), (h.progress / h.duration) * 100);
      }
    }
    return map;
  }, [continueWatchingItems]);

  return (
    <div className="pb-12">
      <HeroBanner movies={sections.featured} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 -mt-6 relative z-10 space-y-12">
        {isLoading ? (
          <div className="space-y-8 pt-8">
            {[1, 2, 3].map((row) => (
              <div key={row} className="space-y-3">
                <div className="h-6 w-44 bg-white/10 rounded animate-pulse" />
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((card) => (
                    <div key={card} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {continueMovies.length > 0 && (
              <MovieRow
                title="Continue Watching"
                movies={continueMovies}
                viewAllTo="/continue-watching"
                progressMap={progressMap}
              />
            )}
            <MovieRow title="Trending Now" movies={sections.trending} viewAllTo="/movies?sort=popular" />
            <MovieRow
              title="Recommended For You"
              movies={recData?.movies || sections.topRated}
              viewAllTo="/movies?sort=rating"
            />
            <MovieRow title="Popular on CineFlix" movies={sections.popular} viewAllTo="/movies?sort=popular" />
            <MovieRow title="Recently Added" movies={sections.recentlyAdded} viewAllTo="/movies?sort=newest" />
            <MovieRow title="Top Rated Movies" movies={sections.topRated} viewAllTo="/movies?sort=rating" />
            <MovieRow title="Action & Tactical" movies={sections.action} viewAllTo="/genres/action" />
            <MovieRow title="Science Fiction" movies={sections.sciFi} viewAllTo="/genres/science-fiction" />
            <MovieRow title="Comedy" movies={sections.comedy} viewAllTo="/genres/comedy" />
            <MovieRow title="Horror & Suspense" movies={sections.horror} viewAllTo="/genres/horror" />
            <MovieRow title="Romance" movies={sections.romance} viewAllTo="/genres/romance" />
          </>
        )}
      </div>
    </div>
  );
}
