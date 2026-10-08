import { newsletterInput, newsletterPayload } from '@/lib/newsletter';
import { newsletterRateAllowed, subscribeNewsletter } from '@/db/newsletter';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const input = await newsletterPayload(request);
  if ('error' in input) return Response.json({ error: input.error }, { status: input.status });
  const parsed = newsletterInput.safeParse(input.payload);
  if (!parsed.success) return Response.json({ error: 'invalid_subscription' }, { status: 400 });
  if (parsed.data.company) return Response.json({ ok: true });
  try {
    if (!await newsletterRateAllowed(request.headers.get('cf-connecting-ip') ?? 'local-preview')) return Response.json({ error: 'too_many_requests' }, { status: 429, headers: { 'Retry-After': '600' } });
    await subscribeNewsletter(parsed.data.email.trim().toLowerCase(), parsed.data.locale);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    console.error('Newsletter subscription unavailable');
    return Response.json({ error: 'subscription_unavailable' }, { status: 503 });
  }
}
