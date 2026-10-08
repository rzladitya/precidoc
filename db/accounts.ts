import { getAccountDb } from './index';

export type PrecidocAccount = { user_id: string; email: string; display_name: string; created_at: string };
export async function findAccount(userId: string): Promise<PrecidocAccount | null> {
  const sql = getAccountDb();
  const rows = await sql`SELECT user_id, email, display_name, created_at FROM precidoc_accounts WHERE user_id = ${userId}`;
  return (rows[0] as PrecidocAccount | undefined) ?? null;
}
export async function createAccount(user: { userId: string; email: string }, displayName: string) {
  const sql = getAccountDb();
  await sql`INSERT INTO precidoc_accounts (user_id, email, display_name) VALUES (${user.userId}, ${user.email}, ${displayName}) ON CONFLICT(user_id) DO NOTHING`;
  const account = await findAccount(user.userId);
  if (!account) throw new Error('Account creation failed');
  return account;
}
