'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/language';
import { MarketingHeader, MarketingFooter } from '@/components/marketing-shell';

export function Newsletter() {
  const { locale } = useLanguage();
  const en = locale === 'en';
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus('pending'); setError('');
    try {
      const response = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), locale, company, consent }) });
      if (!response.ok) { const body: unknown = await response.json(); const code = body && typeof body === 'object' && 'error' in body ? body.error : null; throw new Error(code === 'too_many_requests' ? 'rate' : code === 'invalid_subscription' ? 'invalid' : 'service'); }
      setStatus('success'); setEmail('');
    } catch (cause) { setStatus('error'); setError(cause instanceof Error ? cause.message : 'service'); }
  }
  return <section className="newsletter-section container" id="updates"><div><span className="public-eyebrow">PRECIDOC / UPDATES</span><h2>{en ? 'Know what ships next.' : 'Ikuti pembaruan Precidoc.'}</h2><p>{en ? 'New releases, document guides, and news about Pro. Sent when there is something to share.' : 'Rilis baru, panduan dokumen, dan kabar tentang Pro. Dikirim saat ada hal baru untuk dibagikan.'}</p></div><div>{status === 'success' ? <div className="newsletter-success" role="status"><Check size={24} aria-hidden="true" /><h3>{en ? 'You’re on the list.' : 'Kamu sudah terdaftar.'}</h3><p>{en ? 'We’ll email you when there is a Precidoc update.' : 'Kami akan mengirim email saat ada pembaruan Precidoc.'}</p><button type="button" className="public-text-link" onClick={() => { setStatus('idle'); setConsent(false); }}>{en ? 'Use another email' : 'Gunakan email lain'}</button></div> : <form onSubmit={submit}><label htmlFor="newsletter-email">{en ? 'Email address' : 'Alamat email'}</label><div className="newsletter-field"><input id="newsletter-email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} aria-describedby="newsletter-note newsletter-error" disabled={status === 'pending'} /><button className="button primary" type="submit" disabled={status === 'pending'}>{status === 'pending' ? (en ? 'Subscribing…' : 'Mendaftarkan…') : (en ? 'Subscribe' : 'Langganan')}<ArrowRight size={16} aria-hidden="true" /></button></div><label className="newsletter-consent"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} disabled={status === 'pending'} /><span>{en ? 'Email me product updates about Precidoc.' : 'Kirimkan pembaruan produk Precidoc ke email saya.'}</span></label><label className="newsletter-trap" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" value={company} onChange={event => setCompany(event.target.value)} /></label><p id="newsletter-note" className="newsletter-note">{en ? 'Unsubscribe using the link in any update email.' : 'Berhenti berlangganan melalui tautan pada email pembaruan.'}</p><p id="newsletter-error" className="newsletter-error" role="alert">{status === 'error' ? error === 'rate' ? (en ? 'Too many attempts. Please try again in 10 minutes.' : 'Terlalu banyak percobaan. Coba lagi dalam 10 menit.') : error === 'invalid' ? (en ? 'Check your email and agree to receive updates.' : 'Periksa email dan setujui penerimaan pembaruan.') : (en ? 'Could not save your subscription. Please try again.' : 'Langganan belum tersimpan. Silakan coba lagi.') : ''}</p></form>}</div></section>;
}

export function UnsubscribeContent() {
  const { locale } = useLanguage();
  const token = useSearchParams().get('token');
  const valid = !!token && /^[a-f0-9]{64}$/.test(token);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  async function unsubscribe() {
    setStatus('pending');
    try {
      const response = await fetch('/api/newsletter/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      setStatus(response.ok ? 'success' : 'error');
    } catch { setStatus('error'); }
  }
  return <div className="landing saas-landing public-page"><MarketingHeader /><main className="container public-main unsubscribe-main"><span className="public-eyebrow">PRECIDOC / UPDATES</span><h1>{status === 'success' ? (locale === 'en' ? 'You’re unsubscribed.' : 'Langganan dihentikan.') : (locale === 'en' ? 'Stop product update emails?' : 'Berhenti menerima email pembaruan?')}</h1><p>{status === 'success' ? (locale === 'en' ? 'You won’t receive further newsletter updates from Precidoc.' : 'Kamu tidak akan menerima newsletter Precidoc berikutnya.') : (locale === 'en' ? 'This only changes your newsletter subscription. You can continue using your Precidoc account.' : 'Ini hanya mengubah langganan newsletter. Kamu tetap bisa memakai akun Precidoc.')}</p>{status !== 'success' && valid && <button type="button" className="button primary" disabled={status === 'pending'} onClick={unsubscribe}>{locale === 'en' ? 'Unsubscribe' : 'Berhenti berlangganan'}</button>}{(!valid || status === 'error') && <p role="alert">{locale === 'en' ? 'This link could not be used. Open the unsubscribe link from your update email or contact admin@rainc.web.id.' : 'Tautan ini tidak bisa dipakai. Buka tautan berhenti berlangganan dari email pembaruan atau hubungi admin@rainc.web.id.'}</p>}<div role="status" className="sr-only">{status === 'success' ? (locale === 'en' ? 'Subscription stopped' : 'Langganan dihentikan') : ''}</div></main><MarketingFooter /></div>;
}
