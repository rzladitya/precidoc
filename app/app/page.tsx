import { redirect } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { Registration } from '@/components/registration';
import { getUser, signInPath, signOutPath } from '@/app/auth';
import { findAccount } from '@/db/accounts';
export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const user = await getUser();
  if (!user) redirect('/register');
  let account;
  try { account = await findAccount(user.userId); }
  catch (error) {
    console.error('Account lookup unavailable', error instanceof Error ? error.name : 'UnknownError');
    return <Registration user={{ email: user.email, name: user.fullName ?? '' }} signInHref={signInPath('/register')} unavailable/>;
  }
  if (!account) redirect('/register');
  return <Workspace accountName={account.display_name} signOutHref={signOutPath()}/>;
}
