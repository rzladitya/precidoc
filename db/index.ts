import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function getAccountDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required for the account database');
  return neon(url);
}

export function getDb() {
  return drizzle(getAccountDb(), { schema });
}
