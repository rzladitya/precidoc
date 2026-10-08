import { z } from 'zod';
import { renderAuthEmail, type AuthEmail } from './email-template';

class InvalidWebhook extends Error {}
class Unavailable extends Error {}
const purpose = z.enum(['email-verification', 'sign-in', 'forget-password']);
const envelope = z.object({
  event_id: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  timestamp: z.string().datetime(),
  context: z.object({ endpoint_id: z.string().min(1).max(100) }),
  user: z.object({ email: z.string().email().max(254) }),
});
const payloadSchema = z.discriminatedUnion('event_type', [
  envelope.extend({ event_type: z.literal('send.otp'), event_data: z.object({ otp_type: purpose, otp_code: z.string().regex(/^\d{6}$/), expires_at: z.string().datetime(), delivery_preference: z.literal('email').optional() }) }),
  envelope.extend({ event_type: z.literal('send.magic_link'), event_data: z.object({ link_type: purpose, link_url: z.string().url().max(4096), expires_at: z.string().datetime() }) }),
]);
type SigningKey = JsonWebKey & { kid: string };
let cache: { url: string; keys: SigningKey[]; fetchedAt: number } | undefined;
let pending: Promise<void> | undefined;

async function publicKey(kid: string, authUrl: URL) {
  const url = `${authUrl.href.replace(/\/$/, '')}/.well-known/jwks.json`;
  const key = cache?.url === url && Date.now() - cache.fetchedAt < 300000 ? cache.keys.find(key => key.kid === kid) : undefined;
  if (key) return key;
  // Coalesce refreshes and limit requests caused by unknown key IDs.
  if (!pending && !(cache?.url === url && Date.now() - cache.fetchedAt < 5000)) {
    pending = (async () => {
      const response = await fetch(url, { signal: AbortSignal.timeout(2500), redirect: 'error' });
      if (!response.ok) throw new Unavailable();
      const jwks = await response.json() as { keys?: SigningKey[] };
      if (!Array.isArray(jwks.keys)) throw new Unavailable();
      cache = { url, keys: jwks.keys.filter(key => key.kty === 'OKP' && key.crv === 'Ed25519' && typeof key.kid === 'string' && typeof key.x === 'string'), fetchedAt: Date.now() };
    })().finally(() => { pending = undefined; });
  }
  if (pending) { try { await pending; } catch { throw new Unavailable(); } }
  const found = cache?.url === url ? cache.keys.find(key => key.kid === kid) : undefined;
  if (!found) throw new InvalidWebhook();
  return found;
}

async function verifySignature(raw: string, headers: Headers, authUrl: URL) {
  const signature = headers.get('x-neon-signature');
  const kid = headers.get('x-neon-signature-kid');
  const timestamp = headers.get('x-neon-timestamp');
  if (!signature || !kid || kid.length > 128 || !timestamp || !/^\d{13}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 300000) throw new InvalidWebhook();
  const parts = signature.split('.');
  if (parts.length !== 3 || parts[1] !== '' || !/^[\w-]{1,1024}$/.test(parts[0]) || !/^[\w-]{86}$/.test(parts[2])) throw new InvalidWebhook();
  let header: { alg?: string; kid?: string; crit?: unknown; b64?: boolean };
  try { header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); } catch { throw new InvalidWebhook(); }
  if (!header || header.alg !== 'EdDSA' || header.kid !== kid || header.crit !== undefined || header.b64 === false) throw new InvalidWebhook();
  const jwk = await publicKey(kid, authUrl);
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['verify']);
  const payload = Buffer.from(`${timestamp}.${Buffer.from(raw).toString('base64url')}`).toString('base64url');
  const valid = await crypto.subtle.verify('Ed25519', key, Buffer.from(parts[2], 'base64url'), Buffer.from(`${parts[0]}.${payload}`));
  if (!valid) throw new InvalidWebhook();
}

async function rawBody(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new InvalidWebhook();
  const reader = request.body?.getReader();
  if (!reader) throw new InvalidWebhook();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0, body = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 16384) { await reader.cancel(); throw new InvalidWebhook(); }
    body += decoder.decode(value, { stream: true });
  }
  return body + decoder.decode();
}

export async function deliverAuthEmail(request: Request) {
  const response = (status: number, body: Record<string, unknown>) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  try {
    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    if (!baseUrl) throw new Unavailable();
    const authUrl = new URL(baseUrl);
    if (authUrl.protocol !== 'https:') throw new Unavailable();
    const raw = await rawBody(request);
    await verifySignature(raw, request.headers, authUrl);
    let json: unknown;
    try { json = JSON.parse(raw); } catch { throw new InvalidWebhook(); }
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) throw new InvalidWebhook();
    const payload = parsed.data;
    if (payload.event_id !== request.headers.get('x-neon-event-id') || payload.event_type !== request.headers.get('x-neon-event-type') || payload.context.endpoint_id !== authUrl.hostname.split('.')[0]) throw new InvalidWebhook();
    if (Date.parse(payload.event_data.expires_at) <= Date.now() || Date.parse(payload.event_data.expires_at) <= Date.parse(payload.timestamp)) throw new InvalidWebhook();
    let message: AuthEmail;
    if (payload.event_type === 'send.otp') message = { kind: 'otp', purpose: payload.event_data.otp_type, code: payload.event_data.otp_code, issuedAt: payload.timestamp, expiresAt: payload.event_data.expires_at };
    else {
      const link = new URL(payload.event_data.link_url);
      if (link.protocol !== 'https:' || link.username || link.password || ![authUrl.origin, 'https://precidoc.rainc.web.id'].includes(link.origin)) throw new InvalidWebhook();
      message = { kind: 'link', purpose: payload.event_data.link_type, url: link.href, issuedAt: payload.timestamp, expiresAt: payload.event_data.expires_at };
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Unavailable();
    const email = renderAuthEmail(message);
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(6500),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `precidoc-auth/${payload.event_id}` },
      body: JSON.stringify({ from: 'Precidoc <noreply@rainc.web.id>', to: [payload.user.email], ...email }),
    });
    if (!sent.ok) { console.error('Auth email provider unavailable', sent.status); throw new Unavailable(); }
    const receipt = await sent.json() as { id?: string };
    if (typeof receipt.id !== 'string' || !receipt.id) throw new Unavailable();
    return response(200, { success: true });
  } catch (error) {
    if (error instanceof InvalidWebhook) return response(401, { error: 'invalid_webhook' });
    console.error('Auth email delivery unavailable');
    return response(503, { error: 'email_delivery_unavailable' });
  }
}
