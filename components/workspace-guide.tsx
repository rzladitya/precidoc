'use client';
import { useState, useSyncExternalStore } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from './language';

const preference = 'precidoc-guide-dismissed';
const subscribe = (listener: () => void) => { window.addEventListener('storage', listener);return () => window.removeEventListener('storage', listener); };
const dismissed = () => { try { return localStorage.getItem(preference) === 'yes'; } catch { return false; } };
export function WorkspaceGuide({ trial, hasDocument, busy, onSample, onTab }: { trial: boolean; hasDocument: boolean; busy: boolean; onSample: () => void; onTab: (tab: string) => void }) {
  const { locale } = useLanguage();const c = (en: string, id: string) => locale === 'en' ? en : id;
  const wasDismissed = useSyncExternalStore(subscribe, dismissed, () => true);
  const [choice, setOpen] = useState<boolean | null>(null), [step, setStep] = useState(0);
  const open = choice ?? !wasDismissed;
  const steps = [
    { title: c('Start with a document', 'Mulai dengan dokumen'), detail: c('Load the predefined sample or use a supported file. Parsing runs in this tab; nothing is saved to a cloud document library.', 'Muat dokumen contoh atau gunakan file yang didukung. Parsing berjalan di tab ini; dokumen belum disimpan dalam pustaka cloud.'), action: c('Load sample', 'Muat contoh'), tab: null },
    { title: c('Inspect the findings', 'Periksa temuan'), detail: c('Read each finding and follow its source reference. A readiness score does not check factual accuracy or guarantee AI results.', 'Baca setiap temuan dan telusuri sumbernya. Skor kesiapan tidak memeriksa akurasi fakta atau menjamin hasil AI.'), action: c('Open findings', 'Buka temuan'), tab: 'overview' },
    { title: c('Compare and edit', 'Bandingkan dan edit'), detail: c('Compare extracted text with the original. Correct table values and reading order where needed. Your edits clear previous approval.', 'Bandingkan teks dengan dokumen asli. Perbaiki angka pada tabel dan urutan baca jika diperlukan. Edit membatalkan persetujuan sebelumnya.'), action: c('Open text editor', 'Buka editor teks'), tab: 'source' },
    { title: c('Review, then download', 'Tinjau, lalu unduh'), detail: trial ? c('Inspect the Markdown preview and confirm your review before downloading. JSON and metadata controls belong to the registered Free workspace.', 'Periksa pratinjau Markdown dan konfirmasi review sebelum mengunduh. JSON dan pengaturan metadata tersedia pada workspace Free terdaftar.') : c('Inspect the Markdown or JSON preview and confirm your review. Download before refreshing, leaving this workspace, or signing out.', 'Periksa pratinjau Markdown atau JSON dan konfirmasi review. Unduh sebelum refresh, meninggalkan workspace, atau keluar akun.'), action: c('Preview export', 'Pratinjau ekspor'), tab: 'export' },
  ];
  function dismiss() { setOpen(false);try { localStorage.setItem(preference, 'yes'); } catch { /* The guide works without storage. */ } }
  if (!open) return <button className="workspace-guide-toggle" type="button" onClick={() => { setStep(0);setOpen(true); }}>{c('Show quick-start guide', 'Tampilkan panduan awal')}</button>;
  const current = steps[step];
  return <aside className="workspace-guide" aria-label={c('Quick-start guide', 'Panduan awal')}><div className="guide-top"><span>{c('QUICK START', 'PANDUAN AWAL')} · {step + 1}/4</span><button type="button" onClick={dismiss} aria-label={c('Hide guide', 'Sembunyikan panduan')}><X size={18} aria-hidden="true" /></button></div><h2>{current.title}</h2><p>{current.detail}</p><div className="guide-actions"><button className="button outline" disabled={busy || (current.tab !== null && !hasDocument)} type="button" onClick={() => current.tab === null ? hasDocument ? onTab('overview') : onSample() : onTab(current.tab)}>{current.tab===null&&hasDocument?c('Inspect this document','Periksa dokumen ini'):current.action}</button><div><button type="button" disabled={step === 0} onClick={() => setStep(value => value - 1)} aria-label={c('Previous guide step', 'Langkah panduan sebelumnya')}><ChevronLeft size={18} aria-hidden="true" /></button><button type="button" onClick={() => step === 3 ? dismiss() : setStep(value => value + 1)}>{step === 3 ? c('Done', 'Selesai') : c('Next', 'Lanjut')}<ChevronRight size={18} aria-hidden="true" /></button></div></div></aside>;
}
