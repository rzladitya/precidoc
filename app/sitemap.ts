import type { MetadataRoute } from 'next';
import { posts } from '@/lib/blog';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/pricing', '/blog', ...posts.map(post => `/blog/${post.slug}`)].map(path => ({ url: `https://precidoc.rainc.web.id${path}`, lastModified: '2026-10-08' }));
}
