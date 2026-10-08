"use client";
import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';

export function AuthForm() {
  const [signup, setSignup] = useState(false);
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
      if (result.error) { setMessage(result.error.message ?? 'Sign-in failed. Please try again.'); return; }
      const session = await authClient.getSession();
      if (session.error || !session.data?.user?.emailVerified) {
        setMessage('Verify your email using the message from Neon, then sign in.'); return;
      }
      window.location.assign(destination());
    } catch { setMessage('Sign-in is temporarily unavailable. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="account-page"><section className="account-form-panel" style={{ maxWidth: 480, margin: '48px auto' }}>
    <h1>{signup ? 'Create your Precidoc login' : 'Sign in to Precidoc'}</h1>
    <form onSubmit={submit}>
      {signup && <label>Name<input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} autoComplete="name" disabled={busy}/></label>}
      <label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" disabled={busy}/></label>
      <label>Password<input required type="password" minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} disabled={busy}/></label>
      <button className="button primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create login' : 'Sign in'}</button>
    </form>
    {message && <p role="alert">{message}</p>}
    <button className="button outline" onClick={() => { setSignup(!signup); setMessage(''); }} disabled={busy}>{signup ? 'Already have a login? Sign in' : 'Create a new login'}</button>
    <p><Link href="/sample">Try Precidoc without signing in</Link></p>
  </section></main>;
}
