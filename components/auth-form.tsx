"use client";
import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';

export function AuthForm() {
  const [signup, setSignup] = useState(false);
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
  return <main className="account-page"><section className="account-form-panel" style={{ maxWidth: 480, margin: '48px auto' }}>
    <h1>{verifying ? 'Verify your email' : signup ? 'Create your Precidoc login' : 'Sign in to Precidoc'}</h1>
    {verifying ? <form onSubmit={verify}>
      <p>Enter the verification code sent to {email}.</p>
      <label>Verification code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} disabled={busy}/></label>
      <button className="button primary" type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify email'}</button>
      <button className="button outline" type="button" onClick={resend} disabled={busy}>Resend code</button>
    </form> : <form onSubmit={submit}>
      {signup && <label>Name<input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} autoComplete="name" disabled={busy}/></label>}
      <label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" disabled={busy}/></label>
      <label>Password<input required type="password" minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} disabled={busy}/></label>
      <button className="button primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create login' : 'Sign in'}</button>
    </form>}
    {message && <p role="alert">{message}</p>}
    <button className="button outline" onClick={() => { setVerifying(false); setOtp(''); setSignup(verifying ? false : !signup); setMessage(''); }} disabled={busy}>{verifying ? 'Back to sign in' : signup ? 'Already have a login? Sign in' : 'Create a new login'}</button>
    <p><Link href="/sample">Try Precidoc without signing in</Link></p>
  </section></main>;
}
