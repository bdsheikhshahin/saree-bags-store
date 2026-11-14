import mongoose from 'mongoose';
import { env } from './env';

export async function connectDb(): Promise<boolean> {
  try {
    // Short timeout: without MongoDB the API must still start quickly
    // and serve seed data, not hang for the 30s default.
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    console.warn('MongoDB not available — API will serve seed data as a fallback. Start MongoDB and restart to use the database.', err instanceof Error ? err.message : err);
    return false;
  }
}

export const isDbConnected = (): boolean => mongoose.connection.readyState === 1;
