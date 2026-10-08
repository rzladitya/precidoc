import { z } from 'zod';

export const newsletterInput = z.object({ email: z.string().email().max(254), locale: z.enum(['en', 'id']), consent: z.literal(true), company: z.string().max(100).default('') });
export async function newsletterPayload(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return { error: 'invalid_origin', status: 403 } as const;
  if (!request.headers.get('content-type')?.startsWith('application/json')) return { error: 'invalid_request', status: 415 } as const;
  const reader = request.body?.getReader();
  if (!reader) return { error: 'invalid_request', status: 400 } as const;
  const decoder = new TextDecoder();
  let body = '', bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 2048) { await reader.cancel(); return { error: 'invalid_request', status: 413 } as const; }
    body += decoder.decode(value, { stream: true });
  }
  try { return { payload: JSON.parse(body + decoder.decode()) as unknown } as const; }
  catch { return { error: 'invalid_request', status: 400 } as const; }
}
