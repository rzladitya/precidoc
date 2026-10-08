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
console.log('Precidoc account table is available in Neon.');
await sql`CREATE TABLE IF NOT EXISTS precidoc_newsletter (
  email text PRIMARY KEY NOT NULL,
  locale text NOT NULL CHECK (locale IN ('en', 'id')),
  unsubscribe_token text UNIQUE NOT NULL,
  consent_version text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subscribed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at timestamptz
)`;
await sql`CREATE TABLE IF NOT EXISTS precidoc_newsletter_rate (
  fingerprint text PRIMARY KEY NOT NULL,
  bucket integer NOT NULL,
  attempts integer NOT NULL
)`;
console.log('Precidoc newsletter tables are available in Neon.');
