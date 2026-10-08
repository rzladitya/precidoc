'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Check, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/brand';
import { LanguageSwitch, useLanguage } from '@/components/language';

const wording = {
  en: {
    title: 'Create your Precidoc account', intro: 'Register to use the full document workspace.',
    identity: 'Continue with your ChatGPT account, then confirm your name for Precidoc.', continue: 'Continue with ChatGPT',
    name: 'Your name', email: 'Email from your ChatGPT account', submit: 'Create account and open workspace', saving: 'Creating account…',
    sample: 'Try the sample first', already: 'Your Precidoc account will use this verified ChatGPT identity.',
    features: ['Up to 10 documents per tab', 'Files up to 15 MB and PDFs up to 200 pages', 'Chunk size and deduplication controls', 'JSON and Markdown export'],
    note: 'Document processing still happens in your browser. Your account does not save uploaded documents.',
    retry: 'Try again', unavailable: 'Your account is temporarily unavailable. Try again shortly.',
    invalid: 'Enter a name between 2 and 80 characters.', signin: 'Your session has ended. Continue with ChatGPT to register.',
    error: 'We could not create your account. Your details are still here; please try again.',
  },
  id: {
    title: 'Buat akun Precidoc', intro: 'Daftar untuk menggunakan workspace dokumen lengkap.',
    identity: 'Lanjutkan dengan akun ChatGPT, lalu lengkapi nama akun Precidoc kamu.', continue: 'Lanjutkan dengan ChatGPT',
    name: 'Nama kamu', email: 'Email dari akun ChatGPT', submit: 'Buat akun dan buka workspace', saving: 'Membuat akun…',
    sample: 'Coba contoh terlebih dahulu', already: 'Akun Precidoc kamu akan memakai identitas ChatGPT yang sudah terverifikasi ini.',
    features: ['Hingga 10 dokumen per tab', 'File hingga 15 MB dan PDF hingga 200 halaman', 'Pengaturan ukuran chunk dan deduplikasi', 'Ekspor JSON dan Markdown'],
    note: 'Dokumen tetap diproses di browser. Akun kamu tidak menyimpan dokumen yang diunggah.',
    retry: 'Coba lagi', unavailable: 'Akun sementara belum bisa diakses. Coba lagi sebentar.',
    invalid: 'Isi nama dengan panjang 2 sampai 80 karakter.', signin: 'Sesi kamu berakhir. Lanjutkan dengan ChatGPT untuk mendaftar.',
    error: 'Akun belum berhasil dibuat. Isian kamu tetap tersedia; silakan coba lagi.',
  },
};

export function Registration({ user, signInHref, unavailable = false }: { user: { email: string; name: string } | null; signInHref: string; unavailable?: boolean }) {
  const { locale, t } = useLanguage();
  const copy = wording[locale];
  const [name, setName] = useState(user?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [signInRequired, setSignInRequired] = useState(false);
  async function register(event: React.FormEvent) {
    event.preventDefault();
    if (busy || unavailable) return;
    if (name.trim().length < 2 || name.trim().length > 80) { setError('invalid_name'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/account', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (response.ok) { window.location.assign('/app'); return; }
      const detail = await response.json().catch(() => ({}));
      if (response.status === 401) setSignInRequired(true);
      const code = detail && typeof detail === 'object' && 'error' in detail && typeof detail.error === 'string' ? detail.error : 'failed';
      setError(code);
    } catch { setError('failed'); }
    finally { setBusy(false); }
  }
  const errorMessage = error === 'invalid_name' ? copy.invalid : error === 'sign_in_required' ? copy.signin : error === 'account_unavailable' ? copy.unavailable : copy.error;
  return <div className="account-page">
    <header className="workspace-header"><Link href="/" aria-label={t('Beranda Precidoc')}><Brand/></Link><LanguageSwitch/></header>
    <main className="account-layout">
      <section className="account-form-panel"><span className="account-symbol"><ShieldCheck size={24}/></span><h1>{copy.title}</h1><p>{copy.intro}</p>
        {unavailable ? <div className="account-error" role="alert"><p>{copy.unavailable}</p><button className="button outline" onClick={() => window.location.reload()}>{copy.retry}</button></div>
          : !user || signInRequired ? <div className="account-signin"><p>{signInRequired ? copy.signin : copy.identity}</p><a className="button primary" href={signInHref} target="_top">{copy.continue}</a></div>
          : <form onSubmit={register}><label><span>{copy.name}</span><input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={event => setName(event.target.value)} disabled={busy}/></label><label><span>{copy.email}</span><input type="email" value={user.email} readOnly aria-readonly="true"/></label><p className="account-identity-note">{copy.already}</p>{error && <div className="account-error" role="alert">{errorMessage}</div>}<button className="button primary" type="submit" disabled={busy}>{busy && <LoaderCircle size={17} className="spin"/>}{busy ? copy.saving : copy.submit}</button></form>}
        <Link className="account-sample-link" href="/sample">{copy.sample}</Link>
      </section>
      <aside className="account-benefits"><h2>{t('Document workspace')}</h2><ul>{copy.features.map(feature => <li key={feature}><Check size={17}/><span>{feature}</span></li>)}</ul><p>{copy.note}</p></aside>
    </main>
  </div>;
}
