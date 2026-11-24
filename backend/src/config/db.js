import mongoose from 'mongoose';

let dbMode = 'local';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();
  if (!uri) {
    dbMode = 'local';
    console.log('[CineFlix DB] MONGODB_URI not configured; using persistent local document store.');
    return { mode: 'local' };
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    dbMode = 'mongodb';
    console.log('[CineFlix DB] Connected to MongoDB via Mongoose.');
    return { mode: 'mongodb' };
  } catch (error) {
    console.warn('[CineFlix DB] MongoDB connection failed, falling back to local document store:', error.message);
    dbMode = 'local';
    return { mode: 'local' };
  }
}

export function getDbMode() {
  return dbMode === 'mongodb' && mongoose.connection.readyState === 1 ? 'mongodb' : 'local';
}
