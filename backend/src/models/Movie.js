import mongoose from 'mongoose';

const episodeSchema = new mongoose.Schema(
  {
    episodeNumber: { type: Number, required: true },
    seasonNumber: { type: Number, default: 1 },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    duration: { type: Number, required: true },
    videoUrl: { type: String, required: true },
    thumbnail: { type: String, default: '' },
  },
  { _id: true }
);

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    type: { type: String, enum: ['movie', 'series'], default: 'movie', index: true },
    description: { type: String, required: true },
    poster: { type: String, required: true },
    backdrop: { type: String, required: true },
    trailerUrl: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    subtitleUrl: { type: String, default: '' },
    releaseDate: { type: Date, required: true },
    releaseYear: { type: Number, required: true, index: true },
    duration: { type: Number, required: true },
    genres: [{ type: String, index: true }],
    cast: [{ type: String }],
    director: { type: String, required: true, trim: true },
    language: { type: String, default: 'English', index: true },
    country: { type: String, default: 'United States' },
    ageRating: { type: String, default: 'PG-13' },
    rating: { type: Number, default: 8.0, min: 0, max: 10, index: true },
    imdbRating: { type: Number, default: 8.0, min: 0, max: 10 },
    views: { type: Number, default: 0, index: true },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['published', 'draft', 'archived'], default: 'published', index: true },
    episodes: [episodeSchema],
  },
  { timestamps: true }
);

movieSchema.index({ title: 'text', director: 'text', cast: 'text', description: 'text' });

export const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
