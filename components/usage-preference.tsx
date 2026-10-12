'use client';
import Link from 'next/link';
import {useSyncExternalStore} from 'react';
import {useLanguage} from './language';
import {privacySignal,setUsageEnabled,subscribeUsage,usageEnabled} from '@/lib/usage';
export function UsagePreference(){
  const {locale}=useLanguage(),en=locale==='en';
  const enabled=useSyncExternalStore(subscribeUsage,usageEnabled,()=>false);
  const blocked=useSyncExternalStore(subscribeUsage,privacySignal,()=>false);
  return <div className="usage-preference"><label><input type="checkbox" checked={enabled} disabled={blocked} onChange={event=>setUsageEnabled(event.target.checked)}/>{en?'Share optional usage statistics':'Bagikan statistik penggunaan opsional'}</label><small>{blocked?(en?'Your browser privacy preference keeps statistics off.':'Preferensi privasi browser menonaktifkan statistik.'):(en?'Off by default. Counts and timing ranges only; no document text, filenames, email, or account IDs.':'Default nonaktif. Hanya jumlah dan rentang waktu; tanpa teks dokumen, nama file, email, atau ID akun.')} <Link href="/privacy#usage">{en?'Details':'Rincian'}</Link></small></div>;
}
