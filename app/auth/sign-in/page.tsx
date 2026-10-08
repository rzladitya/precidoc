import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Sign In | Precidoc' };
import { AuthForm } from '@/components/auth-form';
export default function SignInPage() { return <AuthForm/>; }
