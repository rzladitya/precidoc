import { getUser } from '@/app/auth';
import {smallJson} from '@/lib/request-body';
import { createAccount } from '@/db/accounts';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'sign_in_required' }, { status: 401 });
  const input=await smallJson(request,4096);
  if('error' in input)return Response.json({error:input.error},{status:input.status});
  const payload=input.payload;
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
