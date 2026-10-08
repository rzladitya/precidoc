"use client";
import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
export default function SignOutPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function signOut() {
    setBusy(true); setError('');
    try {
      const result = await authClient.signOut();
      if (result.error) { setError('Could not sign out. Please try again.'); return; }
      window.location.assign('/');
    } catch { setError('Could not sign out. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="account-form-panel" style={{ maxWidth: 480, margin: '48px auto' }}><h1>Sign out of PreciDoc</h1><button className="button primary" disabled={busy} onClick={signOut}>{busy ? 'Signing out…' : 'Confirm sign out'}</button>{error && <p role="alert">{error}</p>}</main>;
}
