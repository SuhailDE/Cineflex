import mongoose from 'mongoose';

const genreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Genre = mongoose.models.Genre || mongoose.model('Genre', genreSchema);
