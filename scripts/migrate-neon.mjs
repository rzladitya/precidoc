import { neon } from '@neondatabase/serverless';
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error('Set DATABASE_URL_UNPOOLED or DATABASE_URL before running migrations');
const sql = neon(url);
await sql`CREATE TABLE IF NOT EXISTS precidoc_accounts (
  user_id text PRIMARY KEY NOT NULL,
  email text NOT NULL,
  display_name text NOT NULL,
  created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
console.log('PreciDoc account table is available in Neon.');
