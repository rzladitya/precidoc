'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Brand } from '@/components/brand';
import { LanguageSwitch, useLanguage } from '@/components/language';

export function MarketingHeader() {
  const { locale } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  const links = [
    { href: '/#fitur', label: locale === 'en' ? 'Product' : 'Produk' },
    { href: '/pricing', label: locale === 'en' ? 'Pricing' : 'Harga' },
    { href: '/blog', label: 'Blog' },
  ];
  return <header className="marketing-nav public-nav container">
    <Link href="/" aria-label={locale === 'en' ? 'Precidoc home' : 'Beranda Precidoc'} onClick={() => setOpen(false)}><Brand /></Link>
    <nav id="public-navigation" className={open ? 'is-open' : ''} aria-label={locale === 'en' ? 'Main navigation' : 'Navigasi utama'}>
      {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href || (link.href === '/blog' && pathname?.startsWith('/blog/')) ? 'page' : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}
      <div className="mobile-nav-account"><Link href="/auth/sign-in" onClick={() => setOpen(false)}>{locale === 'en' ? 'Sign in' : 'Masuk'}</Link><Link href="/register" className="button primary" onClick={() => setOpen(false)}>{locale === 'en' ? 'Start free' : 'Mulai gratis'}</Link></div>
    </nav>
    <div className="nav-actions"><LanguageSwitch /><Link href="/auth/sign-in" className="nav-sign-in">{locale === 'en' ? 'Sign in' : 'Masuk'}</Link><Link href="/register" className="button nav-workspace">{locale === 'en' ? 'Start free' : 'Mulai gratis'}</Link></div>
    <button ref={toggle} type="button" className="mobile-nav-toggle" aria-label={open ? (locale === 'en' ? 'Close navigation' : 'Tutup navigasi') : (locale === 'en' ? 'Open navigation' : 'Buka navigasi')} aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(value => !value)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
  </header>;
}

export function MarketingFooter() {
  const { locale } = useLanguage();
  return <footer className="public-footer container"><Link href="/" aria-label={locale === 'en' ? 'Precidoc home' : 'Beranda Precidoc'}><Brand /></Link><nav aria-label={locale === 'en' ? 'Footer navigation' : 'Navigasi footer'}><Link href="/pricing">{locale === 'en' ? 'Pricing' : 'Harga'}</Link><Link href="/blog">Blog</Link><Link href="/sample">{locale === 'en' ? 'Try a sample' : 'Coba contoh'}</Link><Link href="/#faq">FAQ</Link></nav><span>© {new Date().getFullYear()} Rainc</span></footer>;
}
