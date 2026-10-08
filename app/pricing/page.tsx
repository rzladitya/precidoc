import { PricingContent } from '@/components/pricing-content';
import { pageMetadata } from '@/lib/page-titles';

export const metadata = { ...pageMetadata('pricing'), alternates: { canonical: '/pricing' }, openGraph: { ...pageMetadata('pricing'), url: '/pricing', type: 'website' } };
export default function PricingPage() { return <PricingContent />; }
