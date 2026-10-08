import { Suspense } from 'react';
import { PasswordRecovery } from '@/components/password-recovery';
import { pageMetadata } from '@/lib/page-titles';
export const metadata = pageMetadata('forgot');
export default function ForgotPasswordPage(){return <Suspense fallback={<p role="status">Loading…</p>}><PasswordRecovery/></Suspense>;}
