import { getAuth } from '@/lib/auth/server';

export type AuthUser = { userId: string; email: string; fullName: string | null; displayName: string };
export async function getUser(): Promise<AuthUser | null> {
  try {
    const { data: session, error } = await getAuth().getSession();
    if (error || !session?.user || !session.user.emailVerified) return null;
    const user = session.user;
    return { userId: user.id, email: user.email, fullName: user.name || null, displayName: user.name || user.email };
  } catch { return null; }
}
export function signInPath(returnTo = '/register') {
  return '/auth/sign-in?returnTo=' + encodeURIComponent(safeReturnTo(returnTo));
}
export function signOutPath() { return '/auth/sign-out'; }
export function safeReturnTo(value: string) {
  if (!value.startsWith('/') || value.startsWith('//')) return '/register';
  try {
    const url = new URL(value, 'https://app.local');
    if (url.origin !== 'https://app.local' || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/auth')) return '/register';
    return url.pathname + url.search + url.hash;
  } catch { return '/register'; }
}
