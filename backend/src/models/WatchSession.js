import mongoose from 'mongoose';

const watchSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    startedAt: { type: Date, default: Date.now, index: true },
    completedAt: { type: Date, default: null },
    durationWatched: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const WatchSession =
  mongoose.models.WatchSession || mongoose.model('WatchSession', watchSessionSchema);
