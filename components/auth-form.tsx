'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { AccountShell } from './account-shell';
import { useLanguage, usePageTitle } from './language';
import { authClient } from '@/lib/auth/client';

export function AuthForm({ initialSignup = false }: { initialSignup?: boolean }) {
  const { locale } = useLanguage();
  const text = (en: string, id: string) => locale === 'en' ? en : id;
  const [signup, setSignup] = useState(initialSignup);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  usePageTitle(verifying ? 'verify' : signup ? 'signup' : 'signin');
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  function destination() {
    const value = new URLSearchParams(window.location.search).get('returnTo') ?? '/register';
    try { const url = new URL(value, window.location.origin); return value.startsWith('/') && !value.startsWith('//') && url.origin === window.location.origin && !url.pathname.startsWith('/auth/') && !url.pathname.startsWith('/api/') ? url.pathname + url.search : '/register'; }
    catch { return '/register'; }
  }
  function errorCode(error: {code?: string; message?: string}, fallback: string) {
    return ['INVALID_EMAIL_OR_PASSWORD','USER_ALREADY_EXISTS','USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL','EMAIL_NOT_VERIFIED','TOO_MANY_REQUESTS'].includes(error.code ?? '') ? error.code! : fallback;
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage('');
    try {
      const result = signup ? await authClient.signUp.email({ email, password, name: name.trim(), callbackURL: window.location.origin + destination() }) : await authClient.signIn.email({ email, password });
      if (result.error) { if (result.error.code === 'EMAIL_NOT_VERIFIED') setVerifying(true); setMessage(errorCode(result.error, 'auth-failed')); return; }
      const session = await authClient.getSession();
      if (session.error) { setMessage('unavailable'); return; }
      if (!session.data?.user?.emailVerified) { setVerifying(true); setMessage('check-email'); setCooldown(30); return; }
      window.location.assign(destination());
    } catch { setMessage('unavailable'); }
    finally { setBusy(false); }
  }
  async function verify(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage('');
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp });
      if (result.error) { setMessage(errorCode(result.error, 'invalid-code')); return; }
      const session = await authClient.getSession();
      if (session.data?.user?.emailVerified) { window.location.assign(destination()); return; }
      setVerifying(false); setSignup(false); setOtp(''); setMessage('verified');
    } catch { setMessage('unavailable'); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (busy || cooldown) return; setBusy(true); setMessage('');
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
      setMessage(result.error ? errorCode(result.error, 'send-failed') : 'code-sent');
      if (!result.error) setCooldown(30);
    } catch { setMessage('send-failed'); }
    finally { setBusy(false); }
  }
  const messages: Record<string,string> = {
    'INVALID_EMAIL_OR_PASSWORD': text('Invalid email or password. Please try again.', 'Email atau kata sandi salah. Silakan coba lagi.'),
    'USER_ALREADY_EXISTS': text('This email is already registered. Sign in instead.', 'Email ini sudah terdaftar. Silakan masuk.'),
    'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL': text('This email is already registered. Sign in instead.', 'Email ini sudah terdaftar. Silakan masuk.'),
    'EMAIL_NOT_VERIFIED': text('Verify your email to continue.', 'Verifikasi email untuk melanjutkan.'),
    'TOO_MANY_REQUESTS': text('Too many attempts. Wait a moment before trying again.', 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.'),
    'auth-failed': text('Unable to continue. Check your details and try again.', 'Belum bisa melanjutkan. Periksa isian lalu coba lagi.'),
    'check-email': text('Enter the verification code sent to your email.', 'Masukkan kode verifikasi yang dikirim ke email kamu.'),
    'unavailable': text('Sign-in is temporarily unavailable. Please try again.', 'Login sementara belum tersedia. Silakan coba lagi.'),
    'invalid-code': text('Invalid code or the code has expired. Request a new code.', 'Kode salah atau sudah kedaluwarsa. Minta kode baru.'),
    'verified': text('Email verified. Sign in with your password.', 'Email terverifikasi. Masuk dengan kata sandi kamu.'),
    'send-failed': text('Could not send a new code. Please try again.', 'Kode baru belum berhasil dikirim. Silakan coba lagi.'),
    'code-sent': text('A new verification code has been sent.', 'Kode verifikasi baru sudah dikirim.'),
  };
  const notice = ['check-email','verified','code-sent'].includes(message);
  return <AccountShell>
    <div className="account-switch"><span>{signup ? text('Already have an account?', 'Sudah punya akun?') : text('New to Precidoc?', 'Baru di Precidoc?')}</span><button type="button" disabled={busy} onClick={() => { setSignup(!signup); setVerifying(false); setOtp(''); setMessage(''); }}>{signup ? text('Sign in', 'Masuk') : text('Create an account', 'Buat akun')}</button></div>
    <span className="account-eyebrow">PRECIDOC WORKSPACE</span>
    <h1>{verifying ? text('Verify your email', 'Verifikasi email') : signup ? text('Create your account', 'Buat akun kamu') : text('Welcome back', 'Selamat datang kembali')}</h1>
    <p>{verifying ? text('One more step to your document workspace.', 'Satu langkah lagi menuju workspace dokumen kamu.') : signup ? text('Give your AI better documents to work with.', 'Siapkan dokumen yang lebih baik untuk AI kamu.') : text('Continue preparing your documents for AI.', 'Lanjutkan persiapan dokumen kamu untuk AI.')}</p>
    {verifying ? <form onSubmit={verify}>
      <p>{text('Enter the verification code sent to', 'Masukkan kode verifikasi yang dikirim ke')} <strong>{email}</strong>.</p>
      <label>{text('Verification code', 'Kode verifikasi')}<input required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))} disabled={busy}/></label>
      <button className="button primary" type="submit" disabled={busy}>{busy ? text('Verifying…', 'Memverifikasi…') : text('Verify email', 'Verifikasi email')}</button>
      <button className="button outline" type="button" onClick={resend} disabled={busy || cooldown > 0}>{cooldown ? text(`Resend in ${cooldown}s`, `Kirim ulang dalam ${cooldown} detik`) : text('Resend code', 'Kirim ulang kode')}</button>
    </form> : <form onSubmit={submit}>
      {signup && <label>{text('Name', 'Nama')}<input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} autoComplete="name" disabled={busy}/></label>}
      <label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" disabled={busy}/></label>
      <label>{text('Password', 'Kata sandi')}<span className="password-field"><input required type={showPassword ? 'text' : 'password'} minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} disabled={busy}/><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? text('Hide password','Sembunyikan kata sandi') : text('Show password','Tampilkan kata sandi')} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>
      {signup ? <small className="account-identity-note">{text('Use at least 8 characters. We’ll email you a verification code.', 'Gunakan minimal 8 karakter. Kami akan mengirim kode verifikasi melalui email.')}</small> : <Link className="account-recovery-link" href="/auth/forgot-password">{text('Forgot your password?', 'Lupa kata sandi?')}</Link>}
      <button className="button primary" type="submit" disabled={busy}>{busy ? text('Please wait…', 'Tunggu sebentar…') : signup ? text('Create account', 'Buat akun') : text('Sign in', 'Masuk')}</button>
    </form>}
    {message && <p className={notice ? 'account-notice' : 'account-error'} role={notice ? 'status' : 'alert'}>{messages[message]}</p>}
    {verifying && <button className="button outline" onClick={() => { setVerifying(false); setOtp(''); setSignup(false); setMessage(''); }} disabled={busy}>{text('Back to sign in', 'Kembali ke login')}</button>}
    <p className="account-privacy">{text('Your documents stay in your browser. Export your work before closing the tab.', 'Dokumen tetap di browser kamu. Unduh hasil sebelum menutup tab.')}</p>
    <Link className="account-sample-link" href="/sample">{text('Try Precidoc without signing in', 'Coba Precidoc tanpa masuk')}</Link>
  </AccountShell>;
}
