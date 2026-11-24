import bcrypt from 'bcryptjs';
import { dataStore } from '../services/dataStore.js';

const GENRES_SEED = [
  { name: 'Action', slug: 'action', description: 'High-stakes pursuits, tactical espionage, and kinetic cinema.' },
  { name: 'Science Fiction', slug: 'science-fiction', description: 'Speculative futures, orbital expeditions, and synthetic worlds.' },
  { name: 'Thriller', slug: 'thriller', description: 'Taut neo-noir investigations, psychological tension, and suspense.' },
  { name: 'Drama', slug: 'drama', description: 'Character-driven prestige narratives and historical epics.' },
  { name: 'Horror', slug: 'horror', description: 'Atmospheric dread, folklore mystery, and nocturnal survival.' },
  { name: 'Comedy', slug: 'comedy', description: 'Sharp wit, ensemble satire, and warm offbeat storytelling.' },
  { name: 'Romance', slug: 'romance', description: 'Intimate portraits of connection, memory, and devotion.' },
  { name: 'Mystery', slug: 'mystery', description: 'Whodunits, cold cases, and labyrinthine conspiracies.' },
];

// Licensed Blender Foundation Creative Commons & public Google sample MP4 streams
const SAMPLE_VIDEOS = {
  tearsOfSteel: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  sintel: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  bigBuckBunny: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  elephantsDream: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  blazes: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  escapes: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  joyrides: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  subaru: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
};

const MOVIES_SEED = [
  {
    title: 'Solaris Horizon',
    slug: 'solaris-horizon',
    type: 'movie',
    description:
      'When an orbital relay station loses contact with Earth above a tidal exoplanet, flight engineer Nadia Vance uncovers a forty-year-old signal buried beneath the ocean floor.',
    poster: '/src/assets/images/poster_solaris_horizon_1795532107664.jpg',
    backdrop: '/src/assets/images/hero_solaris_horizon_1795532107126.jpg',
    trailerUrl: SAMPLE_VIDEOS.blazes,
    videoUrl: SAMPLE_VIDEOS.tearsOfSteel,
    releaseDate: '2026-03-14',
    releaseYear: 2026,
    duration: 138,
    genres: ['Science Fiction', 'Drama', 'Thriller'],
    cast: ['Elena Rostova', 'Marcus Thorne', 'Kenji Takahashi', 'Sora Lindqvist'],
    director: 'Claire Moreau',
    language: 'English',
    country: 'United States',
    ageRating: 'PG-13',
    rating: 8.9,
    imdbRating: 8.8,
    views: 4820,
    featured: true,
    trending: true,
    status: 'published',
  },
  {
    title: 'Velvet Noir',
    slug: 'velvet-noir',
    type: 'movie',
    description:
      'In a rain-soaked port metropolis during the winter blackout of 1979, a disgraced precinct archivist traces a missing jazz tape linked to the mayor’s inner circle.',
    poster: '/src/assets/images/poster_velvet_noir_1795532109170.jpg',
    backdrop: '/src/assets/images/hero_velvet_noir_1795532108060.jpg',
    trailerUrl: SAMPLE_VIDEOS.escapes,
    videoUrl: SAMPLE_VIDEOS.elephantsDream,
    releaseDate: '2025-11-08',
    releaseYear: 2025,
    duration: 124,
    genres: ['Thriller', 'Mystery', 'Drama'],
    cast: ['Julian Mercer', 'Camille Laurent', 'Arthur Pendelton', 'Nadia Koury'],
    director: 'Henrik Solberg',
    language: 'English',
    country: 'United Kingdom',
    ageRating: 'R',
    rating: 8.6,
    imdbRating: 8.5,
    views: 3940,
    featured: true,
    trending: true,
    status: 'published',
  },
  {
    title: 'Iron Echoes',
    slug: 'iron-echoes',
    type: 'movie',
    description:
      'Tasked with recovering an encrypted diplomatic ledger from an alpine rail vault, a former courier has six hours before the coastal bridge lockdown traps his crew.',
    poster: '/src/assets/images/poster_iron_echoes_1795532109304.jpg',
    backdrop: '/src/assets/images/hero_iron_echoes_1795532107102.jpg',
    trailerUrl: SAMPLE_VIDEOS.joyrides,
    videoUrl: SAMPLE_VIDEOS.sintel,
    releaseDate: '2026-01-22',
    releaseYear: 2026,
    duration: 116,
    genres: ['Action', 'Thriller'],
    cast: ['Devon Cross', 'Maya Lin', 'Viktor Novak', 'Rafael Silva'],
    director: 'Tomasz Kowalski',
    language: 'English',
    country: 'Canada',
    ageRating: 'PG-13',
    rating: 8.4,
    imdbRating: 8.3,
    views: 5190,
    featured: true,
    trending: true,
    status: 'published',
  },
  {
    title: 'The Glass Garden',
    slug: 'the-glass-garden',
    type: 'movie',
    description:
      'Two botanical illustrators reunite inside a nineteenth-century Parisian conservatory slated for demolition, spending one autumn week cataloging rare orchids.',
    poster: '/src/assets/images/poster_glass_garden_1795532108955.jpg',
    backdrop: '/src/assets/images/poster_glass_garden_1795532108955.jpg',
    trailerUrl: SAMPLE_VIDEOS.escapes,
    videoUrl: SAMPLE_VIDEOS.bigBuckBunny,
    releaseDate: '2025-09-19',
    releaseYear: 2025,
    duration: 109,
    genres: ['Romance', 'Drama'],
    cast: ['Claire Beaumont', 'Theo Vance', 'Margaux Delacroix'],
    director: 'Amelie Girard',
    language: 'French',
    country: 'France',
    ageRating: 'PG',
    rating: 8.5,
    imdbRating: 8.4,
    views: 2780,
    featured: false,
    trending: true,
    status: 'published',
  },
  {
    title: 'Hollow Pines',
    slug: 'hollow-pines',
    type: 'movie',
    description:
      'A sound recordist hired to archive winter bird calls in a remote Nordic timber valley discovers a cabin whose tape reels capture conversations from decades before it was built.',
    poster: '/src/assets/images/poster_hollow_pines_1795532109931.jpg',
    backdrop: '/src/assets/images/poster_hollow_pines_1795532109931.jpg',
    trailerUrl: SAMPLE_VIDEOS.blazes,
    videoUrl: SAMPLE_VIDEOS.elephantsDream,
    releaseDate: '2025-10-31',
    releaseYear: 2025,
    duration: 102,
    genres: ['Horror', 'Mystery', 'Thriller'],
    cast: ['Freja Holm', 'Lukas Berg', 'Astrid Nyman'],
    director: 'Mads Lind',
    language: 'Norwegian',
    country: 'Norway',
    ageRating: 'R',
    rating: 8.2,
    imdbRating: 8.1,
    views: 3120,
    featured: false,
    trending: true,
    status: 'published',
  },
  {
    title: 'Laughing Stock',
    slug: 'laughing-stock',
    type: 'movie',
    description:
      'When a historic neighborhood comedy playhouse faces foreclosure, a chaotic troupe of washed-up improvisers stages a 24-hour telethon to save the building.',
    poster: '/src/assets/images/poster_laughing_stock_1795532110061.jpg',
    backdrop: '/src/assets/images/poster_laughing_stock_1795532110061.jpg',
    trailerUrl: SAMPLE_VIDEOS.joyrides,
    videoUrl: SAMPLE_VIDEOS.bigBuckBunny,
    releaseDate: '2026-02-11',
    releaseYear: 2026,
    duration: 98,
    genres: ['Comedy', 'Drama'],
    cast: ['Hannah Cho', 'Samir Patel', 'Gabe Morales', 'Ruthie Vance'],
    director: 'Noah Bernstein',
    language: 'English',
    country: 'United States',
    ageRating: 'PG-13',
    rating: 7.9,
    imdbRating: 7.8,
    views: 2450,
    featured: false,
    trending: false,
    status: 'published',
  },
  {
    title: 'Crimson Crown',
    slug: 'crimson-crown',
    type: 'series',
    description:
      'Across a fractured northern archipelago, three royal houses wage a quiet war of treaties, spies, and succession after the sudden vanishing of the High Regent.',
    poster: '/src/assets/images/poster_crimson_crown_1795532111375.jpg',
    backdrop: '/src/assets/images/poster_crimson_crown_1795532111375.jpg',
    trailerUrl: SAMPLE_VIDEOS.blazes,
    videoUrl: SAMPLE_VIDEOS.sintel,
    releaseDate: '2026-04-02',
    releaseYear: 2026,
    duration: 54,
    genres: ['Drama', 'Mystery', 'Action'],
    cast: ['Rowan Stark', 'Isolde Vane', 'Caleb Ashworth', 'Mira Thorne'],
    director: 'Eleanor Wright',
    language: 'English',
    country: 'United Kingdom',
    ageRating: 'TV-MA',
    rating: 9.1,
    imdbRating: 9.0,
    views: 6410,
    featured: false,
    trending: true,
    status: 'published',
    episodes: [
      {
        episodeNumber: 1,
        seasonNumber: 1,
        title: 'Ashes of the Regent',
        description: 'An empty throne room sparks an overnight summit at Basalt Keep.',
        duration: 54,
        videoUrl: SAMPLE_VIDEOS.sintel,
      },
      {
        episodeNumber: 2,
        seasonNumber: 1,
        title: 'The Salt Treaty',
        description: 'Envoy Isolde Vane sails through the blockade to broker an uneasy truce.',
        duration: 51,
        videoUrl: SAMPLE_VIDEOS.tearsOfSteel,
      },
      {
        episodeNumber: 3,
        seasonNumber: 1,
        title: 'Velvet and Iron',
        description: 'A forged seal threatens to plunge the eastern harbors into open conflict.',
        duration: 58,
        videoUrl: SAMPLE_VIDEOS.elephantsDream,
      },
    ],
  },
  {
    title: 'Orbital Drift',
    slug: 'orbital-drift',
    type: 'series',
    description:
      'A salvage crew aboard an aging tugboat orbits the Jupiter debris belt, intercepting derelict research pods while outrunning corporate claim jumpers.',
    poster: '/src/assets/images/poster_solaris_horizon_1795532107664.jpg',
    backdrop: '/src/assets/images/hero_solaris_horizon_1795532107126.jpg',
    trailerUrl: SAMPLE_VIDEOS.escapes,
    videoUrl: SAMPLE_VIDEOS.tearsOfSteel,
    releaseDate: '2025-08-15',
    releaseYear: 2025,
    duration: 46,
    genres: ['Science Fiction', 'Action'],
    cast: ['Juno Park', 'Liam O’Connor', 'Tariq Al-Mansoor'],
    director: 'Claire Moreau',
    language: 'English',
    country: 'United States',
    ageRating: 'TV-14',
    rating: 8.4,
    imdbRating: 8.3,
    views: 3580,
    featured: false,
    trending: false,
    status: 'published',
    episodes: [
      {
        episodeNumber: 1,
        seasonNumber: 1,
        title: 'Dead Reckoning',
        description: 'The crew locks onto an unmarked research beacon drifting near Europa.',
        duration: 46,
        videoUrl: SAMPLE_VIDEOS.tearsOfSteel,
      },
      {
        episodeNumber: 2,
        seasonNumber: 1,
        title: 'Cold Thrusters',
        description: 'Solar flares knock out primary navigation during a high-risk tow.',
        duration: 44,
        videoUrl: SAMPLE_VIDEOS.blazes,
      },
    ],
  },
  {
    title: 'Midnight Precinct',
    slug: 'midnight-precinct',
    type: 'series',
    description:
      'Over a single winter season in Chicago’s West Loop, night-shift detectives untangle a string of art gallery heists tied to an unsolved 1998 cold case.',
    poster: '/src/assets/images/poster_velvet_noir_1795532109170.jpg',
    backdrop: '/src/assets/images/hero_velvet_noir_1795532108060.jpg',
    trailerUrl: SAMPLE_VIDEOS.joyrides,
    videoUrl: SAMPLE_VIDEOS.elephantsDream,
    releaseDate: '2024-11-20',
    releaseYear: 2024,
    duration: 48,
    genres: ['Thriller', 'Mystery', 'Drama'],
    cast: ['Dante Brooks', 'Sofia Reyes', 'Martin Gallagher'],
    director: 'Henrik Solberg',
    language: 'English',
    country: 'United States',
    ageRating: 'TV-MA',
    rating: 8.7,
    imdbRating: 8.6,
    views: 4100,
    featured: false,
    trending: false,
    status: 'published',
    episodes: [
      {
        episodeNumber: 1,
        seasonNumber: 1,
        title: 'Rain on Wabash',
        description: 'A canvas vanishes between midnight gallery patrols.',
        duration: 48,
        videoUrl: SAMPLE_VIDEOS.elephantsDream,
      },
      {
        episodeNumber: 2,
        seasonNumber: 1,
        title: 'The Locker Key',
        description: 'Ballistics match a weapon logged in the 1998 evidence vault.',
        duration: 49,
        videoUrl: SAMPLE_VIDEOS.sintel,
      },
    ],
  },
  {
    title: 'Coastal Pursuit',
    slug: 'coastal-pursuit',
    type: 'movie',
    description:
      'A retired stunt driver agrees to one final cross-border escort along Highway 1, only to discover her passenger is a whistleblower carrying classified aviation logs.',
    poster: '/src/assets/images/poster_iron_echoes_1795532109304.jpg',
    backdrop: '/src/assets/images/hero_iron_echoes_1795532107102.jpg',
    trailerUrl: SAMPLE_VIDEOS.subaru,
    videoUrl: SAMPLE_VIDEOS.subaru,
    releaseDate: '2024-06-12',
    releaseYear: 2024,
    duration: 112,
    genres: ['Action', 'Comedy'],
    cast: ['Elena Vance', 'Jordan Blake', 'Chris Sato'],
    director: 'Tomasz Kowalski',
    language: 'English',
    country: 'United States',
    ageRating: 'PG-13',
    rating: 7.8,
    imdbRating: 7.7,
    views: 2890,
    featured: false,
    trending: false,
    status: 'published',
  },
  {
    title: 'Autumn in Kyoto',
    slug: 'autumn-in-kyoto',
    type: 'movie',
    description:
      'An architectural restorer and a vinyl shop owner cross paths during a week of late-autumn typhoons, trading letters tucked inside rare jazz sleeves.',
    poster: '/src/assets/images/poster_glass_garden_1795532108955.jpg',
    backdrop: '/src/assets/images/poster_glass_garden_1795532108955.jpg',
    trailerUrl: SAMPLE_VIDEOS.escapes,
    videoUrl: SAMPLE_VIDEOS.bigBuckBunny,
    releaseDate: '2024-10-04',
    releaseYear: 2024,
    duration: 105,
    genres: ['Romance', 'Comedy'],
    cast: ['Haruka Sato', 'Renji Mori', 'Mei Watanabe'],
    director: 'Kenji Watanabe',
    language: 'Japanese',
    country: 'Japan',
    ageRating: 'PG',
    rating: 8.3,
    imdbRating: 8.2,
    views: 2150,
    featured: false,
    trending: false,
    status: 'published',
  },
  {
    title: 'The Winter Cabin',
    slug: 'the-winter-cabin',
    type: 'movie',
    description:
      'Stranded by an early blizzard in the Yukon, four documentary filmmakers realize the abandoned trapper cabin on their map was erased from regional surveys in 1962.',
    poster: '/src/assets/images/poster_hollow_pines_1795532109931.jpg',
    backdrop: '/src/assets/images/poster_hollow_pines_1795532109931.jpg',
    trailerUrl: SAMPLE_VIDEOS.blazes,
    videoUrl: SAMPLE_VIDEOS.sintel,
    releaseDate: '2023-12-01',
    releaseYear: 2023,
    duration: 96,
    genres: ['Horror', 'Thriller'],
    cast: ['Clara Diaz', 'Owen Mercer', 'Tess Harper'],
    director: 'Mads Lind',
    language: 'English',
    country: 'Canada',
    ageRating: 'R',
    rating: 7.7,
    imdbRating: 7.6,
    views: 1980,
    featured: false,
    trending: false,
    status: 'published',
  },
];

export async function seedInitialData() {
  const existingGenres = await dataStore.listGenres();
  if (existingGenres.length === 0) {
    for (const g of GENRES_SEED) {
      await dataStore.createGenre(g);
    }
    console.log(`[CineFlix Seed] Seeded ${GENRES_SEED.length} genres.`);
  }

  const { total: movieCount } = await dataStore.listMovies({ includeAllStatuses: true, status: 'all', limit: 1 });
  if (movieCount === 0) {
    const createdMovies = [];
    for (const m of MOVIES_SEED) {
      createdMovies.push(await dataStore.createMovie(m));
    }
    console.log(`[CineFlix Seed] Seeded ${createdMovies.length} movies & series.`);

    // Seed two regular member profiles (never an admin with hardcoded password)
    const userCount = await dataStore.countUsers();
    let sampleUser = null;
    if (userCount === 0) {
      const saltHash = await bcrypt.hash('MemberPreview#2026', 10);
      sampleUser = await dataStore.createUser({
        name: 'Maya Chen',
        email: 'maya@cineflix.demo',
        password: saltHash,
        role: 'user',
        preferences: { favoriteGenres: ['Science Fiction', 'Thriller'], autoplayNext: true, defaultQuality: '1080p' },
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      });
      await dataStore.createUser({
        name: 'Carlos Rivera',
        email: 'carlos@cineflix.demo',
        password: saltHash,
        role: 'user',
        preferences: { favoriteGenres: ['Action', 'Comedy'], autoplayNext: true, defaultQuality: '1080p' },
        createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      });
    }

    if (sampleUser && createdMovies.length >= 4) {
      await dataStore.upsertReview(sampleUser._id, createdMovies[0]._id, {
        rating: 9,
        comment: 'Breathtaking orbital cinematography and an unforgettable slow-burn finale.',
      });
      await dataStore.upsertReview(sampleUser._id, createdMovies[1]._id, {
        rating: 9,
        comment: 'Rain-soaked atmosphere and sharp dialogue worthy of classic 70s noir.',
      });

      // Seed 7-day watch sessions for real analytics chart activity
      for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const sessionsPerDay = 2 + ((6 - dayOffset) % 3);
        for (let i = 0; i < sessionsPerDay; i++) {
          const targetMovie = createdMovies[(dayOffset + i) % createdMovies.length];
          const dt = new Date(Date.now() - dayOffset * 86400000);
          await dataStore.seedWatchSession({
            user: sampleUser._id,
            movie: targetMovie._id,
            startedAt: dt.toISOString(),
            completedAt: dt.toISOString(),
            durationWatched: 42 + i * 18,
          });
        }
      }
    }
  }
}
