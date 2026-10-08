import { AuthForm } from '@/components/auth-form';
import { pageMetadata } from '@/lib/page-titles';
export const metadata = pageMetadata('signin');
export default function SignInPage() { return <AuthForm/>; }
