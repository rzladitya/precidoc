import { BlogIndex } from '@/components/blog-content';
import { pageMetadata } from '@/lib/page-titles';
export const metadata = { ...pageMetadata('blog'), alternates: { canonical: '/blog' }, openGraph: { ...pageMetadata('blog'), url: '/blog', type: 'website' } };
export default function BlogPage() { return <BlogIndex />; }
