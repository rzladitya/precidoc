import { redirect } from 'next/navigation';
import { getChatGPTUser, chatGPTSignInPath } from '@/app/chatgpt-auth';
import { findAccount } from '@/db/accounts';
import { Registration } from '@/components/registration';
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const user = await getChatGPTUser();
  let unavailable = false;
  let registered = false;
  if (user) {
    try { registered = !!(await findAccount(user.userId)); }
    catch (error) { unavailable = true; console.error('Account lookup unavailable', error instanceof Error ? error.name : 'UnknownError'); }
  }
  if (registered) redirect('/app');
  return <Registration user={user ? { email: user.email, name: user.fullName ?? '' } : null} signInHref={chatGPTSignInPath('/register')} unavailable={unavailable}/>;
}
