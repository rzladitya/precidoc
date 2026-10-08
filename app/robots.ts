import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/app', '/auth/', '/register', '/newsletter/'] }, sitemap: 'https://precidoc.rainc.web.id/sitemap.xml' };
}
