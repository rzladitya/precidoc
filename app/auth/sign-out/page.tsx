'use client';
import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { AccountShell } from '@/components/account-shell';
import { useLanguage, usePageTitle } from '@/components/language';
export default function SignOutPage() {
  const {locale} = useLanguage();
  const text=(en:string,id:string)=>locale==='en'?en:id;
  const [busy,setBusy]=useState(false), [error,setError]=useState(false);
  usePageTitle('signout');
  // Hard navigation clears volatile document state after the cross-tab sign-out signal.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  async function signOut(){if(busy)return;setBusy(true);setError(false);try{const result=await authClient.signOut();if(result.error){setError(true);return;}try{const channel=new BroadcastChannel('precidoc-session');channel.postMessage({type:'signed-out'});channel.close();}catch{}window.location.assign('/');}catch{setError(true);}finally{setBusy(false);}}
  return <AccountShell><span className="account-eyebrow">PRECIDOC WORKSPACE</span><h1>{text('Ready to sign out?','Siap keluar?')}</h1><p>{text('Export your document work before leaving. Uploaded files are kept only in your current tab.','Unduh hasil dokumen sebelum keluar. File yang diunggah hanya tersedia dalam tab saat ini.')}</p><button className="button primary" disabled={busy} onClick={signOut}>{busy?text('Signing out…','Keluar…'):text('Confirm sign out','Konfirmasi keluar')}</button><p><Link className="account-sample-link" href="/app">{text('Back to workspace','Kembali ke workspace')}</Link></p>{error&&<p className="account-error" role="alert">{text('Could not sign out. Please try again.','Belum berhasil keluar. Silakan coba lagi.')}</p>}</AccountShell>;
}
