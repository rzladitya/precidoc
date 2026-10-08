import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { neon } from '@neondatabase/serverless';

const args = process.argv.slice(2);
const file = args.find(arg => arg.startsWith('--message-file='))?.slice('--message-file='.length);
if (!file || !process.env.DATABASE_URL) throw new Error('Set DATABASE_URL and pass --message-file=/path/to/update.json. Without --send this only previews the recipient count.');
const message = JSON.parse(await readFile(file, 'utf8'));
const url = new URL(message.url);
if (url.origin !== 'https://precidoc.rainc.web.id' || url.username || url.password) throw new Error('The update URL must point to the Precidoc website.');
for (const locale of ['en', 'id']) {
  if (typeof message[locale]?.subject !== 'string' || !message[locale].subject.trim() || message[locale].subject.length > 200 || /[\r\n]/.test(message[locale].subject) || typeof message[locale]?.intro !== 'string' || !message[locale].intro.trim() || message[locale].intro.length > 5000) throw new Error('Provide a subject and intro for both en and id.');
}
const sql = neon(process.env.DATABASE_URL);
const subscribers = await sql`SELECT email, locale, unsubscribe_token FROM precidoc_newsletter WHERE unsubscribed_at IS NULL`;
console.log(JSON.stringify({ mode: args.includes('--send') ? 'send' : 'preview', recipients: subscribers.length, url: url.href }));
if (!args.includes('--send')) process.exit(0);
if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is required to send the update.');
const escape = text => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
let sent = 0;
for (const subscriber of subscribers) {
  if (subscriber.email.endsWith('.invalid')) throw new Error('A reserved test address remains in the subscriber list. Clean up the test fixture before sending.');
  const copy = message[subscriber.locale];
  const unsubscribe = `https://precidoc.rainc.web.id/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;
  const isEnglish = subscriber.locale === 'en';
  const text = `${copy.intro}\n\n${url.href}\n\n${isEnglish ? 'Unsubscribe from Precidoc updates' : 'Berhenti menerima pembaruan Precidoc'}: ${unsubscribe}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#182230"><h1 style="font-size:24px">${escape(copy.subject)}</h1><p style="line-height:1.8;white-space:pre-line">${escape(copy.intro)}</p><p><a href="${escape(url.href)}">${isEnglish ? 'Read the update' : 'Baca pembaruan'}</a></p><hr style="border:0;border-top:1px solid #dbe2ed;margin-top:32px"><p style="font-size:12px;color:#526174">${isEnglish ? 'You subscribed to Precidoc product updates.' : 'Kamu berlangganan pembaruan produk Precidoc.'} <a href="${escape(unsubscribe)}">${isEnglish ? 'Unsubscribe' : 'Berhenti berlangganan'}</a></p></div>`;
  const idempotency = createHash('sha256').update(`${subscriber.email}|${text}|${copy.subject}`).digest('hex');
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotency }, body: JSON.stringify({ from: 'Precidoc <noreply@rainc.web.id>', to: [subscriber.email], subject: copy.subject, text, html }), signal: AbortSignal.timeout(30000) });
  if (!response.ok) { console.error(`Email service returned HTTP ${response.status} after ${sent} accepted messages. Stop and diagnose before retrying.`); process.exitCode = 1; break; }
  sent++;
  await setTimeout(600);
}
console.log(JSON.stringify({ accepted: sent, total: subscribers.length }));
