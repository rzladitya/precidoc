import { newsletterPayload } from '@/lib/newsletter';
import { unsubscribeNewsletter } from '@/db/newsletter';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const input = await newsletterPayload(request);
  if ('error' in input) return Response.json({ error: input.error }, { status: input.status });
  const payload = input.payload;
  const token = payload && typeof payload === 'object' && 'token' in payload ? payload.token : null;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return Response.json({ error: 'invalid_link' }, { status: 400 });
  try {
    if (!await unsubscribeNewsletter(token)) return Response.json({ error: 'invalid_link' }, { status: 404 });
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'subscription_unavailable' }, { status: 503 });
  }
}
