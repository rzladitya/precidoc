import { getAccountDb } from './index';

export async function newsletterRateAllowed(ip: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${process.env.NEON_AUTH_COOKIE_SECRET}|newsletter|${ip}`));
  const fingerprint = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  const bucket = Math.floor(Date.now() / 600000);
  const sql = getAccountDb();
  const rows = await sql`INSERT INTO precidoc_newsletter_rate (fingerprint, bucket, attempts) VALUES (${fingerprint}, ${bucket}, 1)
    ON CONFLICT (fingerprint) DO UPDATE SET bucket = EXCLUDED.bucket,
    attempts = CASE WHEN precidoc_newsletter_rate.bucket = EXCLUDED.bucket THEN precidoc_newsletter_rate.attempts + 1 ELSE 1 END RETURNING attempts`;
  return Number(rows[0]?.attempts) <= 5;
}
export async function subscribeNewsletter(email: string, locale: 'en' | 'id') {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
  const sql = getAccountDb();
  await sql`INSERT INTO precidoc_newsletter (email, locale, unsubscribe_token, consent_version) VALUES (${email}, ${locale}, ${token}, 'product-updates-v1')
    ON CONFLICT (email) DO UPDATE SET locale = EXCLUDED.locale, unsubscribed_at = NULL, consent_version = EXCLUDED.consent_version, consent_at = CURRENT_TIMESTAMP`;
}
export async function unsubscribeNewsletter(token: string) {
  const sql = getAccountDb();
  const rows = await sql`UPDATE precidoc_newsletter SET unsubscribed_at = COALESCE(unsubscribed_at, CURRENT_TIMESTAMP) WHERE unsubscribe_token = ${token} RETURNING 1 AS updated`;
  return rows.length > 0;
}
