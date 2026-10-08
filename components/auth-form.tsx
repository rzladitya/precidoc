"use client";
import { useState } from 'react';
import { AccountShell } from './account-shell';
import { useLanguage } from './language';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';

export function AuthForm({ initialSignup = false }: { initialSignup?: boolean }) {
  const { locale } = useLanguage();
  const en = locale === 'en';
  const text = (english: string, indonesian: string) => en ? english : indonesian;
  const [signup, setSignup] = useState(initialSignup);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  function destination() {
    const value = new URLSearchParams(window.location.search).get('returnTo') ?? '/register';
    const url = new URL(value, window.location.origin);
    return value.startsWith('/') && !value.startsWith('//') && url.origin === window.location.origin && !url.pathname.startsWith('/auth/') && !url.pathname.startsWith('/api/') ? url.pathname + url.search : '/register';
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage('');
    try {
      const result = signup ? await authClient.signUp.email({ email, password, name, callbackURL: window.location.origin + destination() }) : await authClient.signIn.email({ email, password });
      if (result.error) { if (result.error.code === 'EMAIL_NOT_VERIFIED') setVerifying(true); setMessage(result.error.message ?? 'Sign-in failed. Please try again.'); return; }
      const session = await authClient.getSession();
      if (session.error || !session.data?.user?.emailVerified) {
        setVerifying(true); setMessage('Enter the verification code sent to your email.'); return;
      }
      window.location.assign(destination());
    } catch { setMessage('Sign-in is temporarily unavailable. Please try again.'); }
    finally { setBusy(false); }
  }
  async function verify(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage('');
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp });
      if (result.error) { setMessage(result.error.message ?? 'Invalid or expired verification code.'); return; }
      const session = await authClient.getSession();
      if (session.data?.user?.emailVerified) { window.location.assign(destination()); return; }
      setVerifying(false); setSignup(false); setOtp(''); setMessage('Email verified. Sign in with your password.');
    } catch { setMessage('Verification is temporarily unavailable. Please try again.'); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (busy) return; setBusy(true); setMessage('');
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
      setMessage(result.error ? result.error.message ?? 'Could not send a new code.' : 'A new verification code has been sent.');
    } catch { setMessage('Could not send a new code. Please try again.'); }
    finally { setBusy(false); }
  }
  return <AccountShell>
    <div className="account-switch"><span>{signup ? text('Already have an account?', 'Sudah punya akun?') : text('New to Precidoc?', 'Baru di Precidoc?')}</span><button type="button" disabled={busy} onClick={() => { setSignup(!signup); setVerifying(false); setOtp(''); setMessage(''); }}>{signup ? text('Sign in', 'Masuk') : text('Create an account', 'Buat akun')}</button></div>
    <span className="account-eyebrow">PRECIDOC WORKSPACE</span>
    <h1>{verifying ? text('Verify your email', 'Verifikasi email') : signup ? text('Create your account', 'Buat akun kamu') : text('Welcome back', 'Selamat datang kembali')}</h1>
    <p>{verifying ? text('One more step to your document workspace.', 'Satu langkah lagi menuju workspace dokumen kamu.') : signup ? text('Turn your documents into knowledge worth using.', 'Siapkan dokumen menjadi pengetahuan yang berguna.') : text('Continue preparing your documents for AI.', 'Lanjutkan persiapan dokumen kamu untuk AI.')}</p>
    {verifying ? <form onSubmit={verify}>
      <p>{text('Enter the verification code sent to', 'Masukkan kode verifikasi yang dikirim ke')} {email}.</p>
      <label>{text('Verification code', 'Kode verifikasi')}<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} disabled={busy}/></label>
      <button className="button primary" type="submit" disabled={busy}>{busy ? text('Verifying…', 'Memverifikasi…') : text('Verify email', 'Verifikasi email')}</button>
      <button className="button outline" type="button" onClick={resend} disabled={busy}>{text('Resend code', 'Kirim ulang kode')}</button>
    </form> : <form onSubmit={submit}>
      {signup && <label>{text('Name', 'Nama')}<input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} autoComplete="name" disabled={busy}/></label>}
      <label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" disabled={busy}/></label>
      <label>{text('Password', 'Kata sandi')}<input required type="password" minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} disabled={busy}/></label>
      {signup && <small className="account-identity-note">{text('Use at least 8 characters. We’ll email you a verification code.', 'Gunakan minimal 8 karakter. Kami akan mengirim kode verifikasi melalui email.')}</small>}
      <button className="button primary" type="submit" disabled={busy}>{busy ? text('Please wait…', 'Tunggu sebentar…') : signup ? text('Create login', 'Buat akun') : text('Sign in', 'Masuk')}</button>
    </form>}
    {message && <p className="account-error" role="alert">{message}</p>}
    {verifying && <button className="button outline" onClick={() => { setVerifying(false); setOtp(''); setSignup(false); setMessage(''); }} disabled={busy}>{text('Back to sign in', 'Kembali ke login')}</button>}
    <p className="account-privacy">{text('Your documents stay in your browser. Export your work before closing the tab.', 'Dokumen tetap di browser kamu. Unduh hasil sebelum menutup tab.')}</p>
    <Link className="account-sample-link" href="/sample">{text('Try Precidoc without signing in', 'Coba Precidoc tanpa masuk')}</Link>
  </AccountShell>;
}
