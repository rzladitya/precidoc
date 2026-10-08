import { redirect } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { Registration } from '@/components/registration';
import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { findAccount } from '@/db/accounts';
export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const user = await getChatGPTUser();
  if (!user) redirect('/register');
  let account;
  try { account = await findAccount(user.userId); }
  catch (error) {
    console.error('Account lookup unavailable', error instanceof Error ? error.name : 'UnknownError');
    return <Registration user={{ email: user.email, name: user.fullName ?? '' }} signInHref={chatGPTSignInPath('/register')} unavailable/>;
  }
  if (!account) redirect('/register');
  return <Workspace accountName={account.display_name} signOutHref={chatGPTSignOutPath('/')}/>;
}
