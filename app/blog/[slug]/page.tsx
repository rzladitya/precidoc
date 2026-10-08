import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogArticle } from '@/components/blog-content';
import { getPost, posts } from '@/lib/blog';
import { pageMetadata } from '@/lib/page-titles';
export function generateStaticParams() { return posts.map(post => ({ slug: post.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const metadata = pageMetadata(post.pageTitle);
  return { ...metadata, alternates: { canonical: `/blog/${post.slug}` }, openGraph: { ...metadata, type: 'article', url: `/blog/${post.slug}`, publishedTime: post.published, authors: ['Precidoc'] } };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  return <BlogArticle post={post} />;
}
