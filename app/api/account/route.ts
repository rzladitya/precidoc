import { getChatGPTUser } from '@/app/chatgpt-auth';
import { createAccount } from '@/db/accounts';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'sign_in_required' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: 'invalid_origin' }, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return Response.json({ error: 'invalid_request' }, { status: 415 });
  const body = await request.text();
  if (body.length > 4096) return Response.json({ error: 'invalid_request' }, { status: 413 });
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return Response.json({ error: 'invalid_request' }, { status: 400 }); }
  const name = payload && typeof payload === 'object' && 'name' in payload && typeof payload.name === 'string' ? payload.name.trim() : '';
  if (name.length < 2 || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name)) return Response.json({ error: 'invalid_name' }, { status: 400 });
  try {
    const account = await createAccount(user, name);
    return Response.json({ account: { name: account.display_name, email: account.email } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Account registration unavailable', error instanceof Error ? error.name : 'UnknownError');
    return Response.json({ error: 'account_unavailable' }, { status: 503 });
  }
}
