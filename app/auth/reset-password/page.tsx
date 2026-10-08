import { Suspense } from 'react';
import { PasswordRecovery } from '@/components/password-recovery';
import { pageMetadata } from '@/lib/page-titles';
export const metadata = pageMetadata('reset');
export default function ResetPasswordPage(){return <Suspense fallback={<p role="status">Loading…</p>}><PasswordRecovery reset/></Suspense>;}
