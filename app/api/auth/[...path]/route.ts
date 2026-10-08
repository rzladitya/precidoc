import { getAuth } from '@/lib/auth/server';
import type { NextRequest } from 'next/server';

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const handlers = getAuth().handler();
    const method = request.method as keyof typeof handlers;
    return await handlers[method](request, context);
  } catch {
    return Response.json({ error: 'authentication_unavailable' }, { status: 503 });
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH };
