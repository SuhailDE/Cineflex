import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    episodeId: { type: String, default: null },
    progress: { type: Number, default: 0, min: 0 },
    duration: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
    lastWatched: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

watchHistorySchema.index({ user: 1, movie: 1 }, { unique: true });

export const WatchHistory =
  mongoose.models.WatchHistory || mongoose.model('WatchHistory', watchHistorySchema);
