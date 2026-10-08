import { Suspense } from 'react';
import { UnsubscribeContent } from '@/components/newsletter';
import { pageMetadata } from '@/lib/page-titles';
export const metadata = { ...pageMetadata('unsubscribe'), robots: { index: false, follow: false } };
export default function UnsubscribePage() { return <Suspense fallback={<p>Loading…</p>}><UnsubscribeContent /></Suspense>; }
