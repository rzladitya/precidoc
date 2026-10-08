import { getAccountDb } from './index';

export type PrecidocAccount = { user_id: string; email: string; display_name: string; created_at: string };
export async function findAccount(userId: string): Promise<PrecidocAccount | null> {
  return getAccountDb().prepare('SELECT user_id, email, display_name, created_at FROM precidoc_accounts WHERE user_id = ?').bind(userId).first<PrecidocAccount>();
}
export async function createAccount(user: { userId: string; email: string }, displayName: string) {
  await getAccountDb().prepare('INSERT INTO precidoc_accounts (user_id, email, display_name) VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING').bind(user.userId, user.email, displayName).run();
  const account = await findAccount(user.userId);
  if (!account) throw new Error('Account creation failed');
  return account;
}
