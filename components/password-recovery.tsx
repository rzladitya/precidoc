'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AccountShell } from './account-shell';
import { useLanguage, usePageTitle } from './language';
import { authClient } from '@/lib/auth/client';
export function PasswordRecovery({ reset = false }: {reset?:boolean}) {
  const {locale} = useLanguage();
  const text = (en:string,id:string) => locale === 'en' ? en : id;
  const params = useSearchParams();
  const [email,setEmail] = useState(''), [password,setPassword] = useState(''), [confirm,setConfirm] = useState('');
  const [busy,setBusy] = useState(false), [done,setDone] = useState(false), [error,setError] = useState(false);
  const token = params.get('token');
  usePageTitle(reset ? 'reset' : 'forgot');
  async function submit(event:React.FormEvent) {
    event.preventDefault(); if (busy || (reset && (!token || password !== confirm))) return;
    setBusy(true); setError(false);
    try {
      const result = reset ? await authClient.resetPassword({newPassword:password,token:token!}) : await authClient.requestPasswordReset({email,redirectTo:window.location.origin+'/auth/reset-password'});
      if (result.error) setError(true); else setDone(true);
    } catch {setError(true);} finally {setBusy(false);}
  }
  return <AccountShell><span className="account-eyebrow">PRECIDOC WORKSPACE</span><h1>{reset ? text('Set a new password','Buat kata sandi baru') : text('Forgot your password?','Lupa kata sandi?')}</h1><p>{reset ? text('Use a password you haven’t used before.','Gunakan kata sandi yang belum pernah kamu pakai.') : text('We’ll send a link to help you regain access.','Kami akan mengirim tautan untuk memulihkan akses kamu.')}</p>
    {done ? <div className="account-notice" role="status">{reset ? text('Password updated. Sign in with your new password.','Kata sandi diperbarui. Masuk dengan kata sandi baru.') : text('If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.','Jika akun dengan email ini terdaftar, tautan reset sudah dikirim. Periksa inbox dan folder spam.')}</div>
    : reset && (!token || params.has('error')) ? <p className="account-error" role="alert">{text('This reset link is missing or invalid. Request a new link.','Tautan reset tidak ada atau tidak valid. Minta tautan baru.')} <Link href="/auth/forgot-password">{text('Request a link','Minta tautan')}</Link></p>
    : <form onSubmit={submit}>{reset ? <><label>{text('New password','Kata sandi baru')}<input required type="password" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label><label>{text('Confirm password','Konfirmasi kata sandi')}<input required type="password" autoComplete="new-password" minLength={8} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={busy}/></label>{confirm && password !== confirm && <small role="status">{text('Passwords must match.','Kata sandi harus sama.')}</small>}</> : <label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>}<button className="button primary" disabled={busy || (reset && password !== confirm)}>{busy ? text('Please wait…','Tunggu sebentar…') : reset ? text('Update password','Perbarui kata sandi') : text('Send reset link','Kirim tautan reset')}</button></form>}
    {error && <p className="account-error" role="alert">{text('Unable to continue. Try again, or request a fresh reset link.','Belum bisa melanjutkan. Coba lagi atau minta tautan reset baru.')}</p>}<Link className="account-sample-link" href="/auth/sign-in">{text('Back to sign in','Kembali ke login')}</Link></AccountShell>;
}
