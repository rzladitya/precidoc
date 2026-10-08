'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Braces, Check, ChevronLeft, ChevronRight, Download, FileText, Layers, Pause, Play, RotateCcw, ScanText, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/brand';
import { useLanguage } from '@/components/language';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { buildChunks, findings, type PreparedDocument } from '@/lib/documents';
import { makeLocalizedSample } from '@/lib/sample';
import { localizedMarkdown, localizedPackage } from '@/lib/exports';
import { downloadFile } from '@/lib/download';

const phases = [
  { id: 'extract', icon: ScanText }, { id: 'review', icon: ShieldCheck },
  { id: 'chunks', icon: Layers }, { id: 'export', icon: Braces },
] as const;
type Phase = typeof phases[number]['id'];
const words = {
  en: {
    labels: ['Extract', 'Review', 'Chunks', 'Export'], sample: 'SAMPLE WALKTHROUGH', original: 'Original text',
    sections: 'Document sections', extracted: 'Extracted text, organised by section.', characters: 'characters',
    review: 'Check the text and document version.', version: 'Document version', editor: 'Edit extracted text',
    checks: 'Review checks', approved: 'I have compared the output with the source.',
    max: 'Maximum chunk size', merge: 'Merge identical sections', chunk: 'Chunk', source: 'Source',
    chunks: 'Chunks generated from the current text.', export: 'Download the reviewed document.',
    excerpt: 'JSON excerpt', downloadJson: 'Register for JSON', downloadMd: 'Download Markdown',
    notReviewed: 'Confirm your review to enable downloads.', blocked: 'Add a document title and fix empty sections before downloading.',
    paused: 'Paused', playing: 'Walkthrough playing', play: 'Play walkthrough', pause: 'Pause walkthrough', reset: 'Reset sample',
    previous: 'Previous chunk', next: 'Next chunk', opened: 'Try the sample',
    footnote: 'This is an editable sample. Changes update the chunks and downloaded files.',
    modified: 'Edited', downloaded: 'Downloaded', copy: 'Source references are included in both formats.',
    caption: ['Select a section to see its source text.', 'Edits clear the previous review approval.', 'Change the size to see the text split into smaller chunks.', 'Downloads contain the full document, metadata, and source references.'],
  },
  id: {
    labels: ['Ekstraksi', 'Tinjau', 'Chunk', 'Ekspor'], sample: 'ALUR DOKUMEN CONTOH', original: 'Teks awal',
    sections: 'Bagian dokumen', extracted: 'Teks ekstraksi dikelompokkan per bagian.', characters: 'karakter',
    review: 'Periksa teks dan versi dokumen.', version: 'Versi dokumen', editor: 'Edit teks ekstraksi',
    checks: 'Catatan pemeriksaan', approved: 'Saya sudah membandingkan hasil dengan sumber.',
    max: 'Ukuran maksimal chunk', merge: 'Gabungkan bagian identik', chunk: 'Chunk', source: 'Sumber',
    chunks: 'Chunk dibentuk dari teks yang sedang ditampilkan.', export: 'Unduh dokumen yang sudah diperiksa.',
    excerpt: 'Cuplikan JSON', downloadJson: 'Daftar untuk JSON', downloadMd: 'Unduh Markdown',
    notReviewed: 'Konfirmasi pemeriksaanmu untuk mengaktifkan unduhan.', blocked: 'Isi judul dokumen dan perbaiki bagian kosong sebelum mengunduh.',
    paused: 'Dijeda', playing: 'Alur sedang diputar', play: 'Putar alur', pause: 'Jeda alur', reset: 'Pulihkan contoh',
    previous: 'Chunk sebelumnya', next: 'Chunk selanjutnya', opened: 'Coba workspace contoh',
    footnote: 'Contoh ini bisa diedit. Perubahan langsung diterapkan pada chunk dan file yang diunduh.',
    modified: 'Diedit', downloaded: 'Berhasil diunduh', copy: 'Kedua format menyertakan referensi sumber.',
    caption: ['Pilih bagian untuk melihat teks sumbernya.', 'Perubahan membatalkan persetujuan pemeriksaan sebelumnya.', 'Ubah ukurannya untuk membagi teks menjadi chunk yang lebih kecil.', 'Unduhan berisi dokumen lengkap, metadata, dan referensi sumber.'],
  },
};

export function ProductDemo() {
  const { locale, t } = useLanguage();
  const copy = words[locale];
  const [sample, setSample] = useState<PreparedDocument>(() => makeLocalizedSample(locale));
  const [phase, setPhase] = useState<Phase>('extract');
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [unitIndex, setUnitIndex] = useState(2);
  const [chunkIndex, setChunkIndex] = useState(2);
  const [size, setSize] = useState('1000');
  const [merge, setMerge] = useState(true);
  const [notice, setNotice] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const chunks = useMemo(() => buildChunks(sample, Number(size), merge), [sample, size, merge]);
  const checks = useMemo(() => findings(sample), [sample]);
  const blocked = checks.some(check => check.severity === 'blocker') || !chunks.length;
  const focusedChunk = chunks[Math.min(chunkIndex, chunks.length - 1)];
  const focusedUnit = phase === 'chunks' && focusedChunk
    ? sample.units.find(unit => unit.id === focusedChunk.sources[0].unitId) ?? sample.units[unitIndex]
    : sample.units[unitIndex];
  const prepared = useMemo(() => localizedPackage(sample, chunks, locale), [sample, chunks, locale]);
  const excerpt = JSON.stringify({ document: { title: sample.title, version: sample.version || null, reviewedByUser: sample.approved }, chunks: prepared.chunks.slice(0, 1) }, null, 2);
  const phaseIndex = phases.findIndex(item => item.id === phase);
  const active = playing && visible && !reducedMotion;

  useEffect(() => { setChunkIndex(index => Math.min(index, Math.max(0, chunks.length - 1))); }, [chunks.length]);

  useEffect(() => { setSample(makeLocalizedSample(locale)); setNotice(''); setUnitIndex(2); setChunkIndex(2); }, [locale]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReducedMotion(preference.matches); if (preference.matches) setPlaying(false); };
    update(); preference.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && !document.hidden), { threshold: 0.15 });
    if (root.current) observer.observe(root.current);
    const onVisibility = () => {
      const rect = root.current?.getBoundingClientRect();
      setVisible(!document.hidden && !!rect && rect.bottom > 0 && rect.top < window.innerHeight);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { observer.disconnect(); preference.removeEventListener('change', update); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      if (phaseIndex === phases.length - 1) setPlaying(false);
      else setPhase(phases[phaseIndex + 1].id);
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [active, phaseIndex]);
  useEffect(() => {
    if (!active || (phase !== 'extract' && phase !== 'chunks')) return;
    const timer = window.setInterval(() => {
      if (phase === 'extract') setUnitIndex(index => (index + 1) % sample.units.length);
      else if (chunks.length) setChunkIndex(index => (index + 1) % chunks.length);
    }, 1900);
    return () => window.clearInterval(timer);
  }, [active, phase, sample.units.length, chunks.length]);

  const pause = () => setPlaying(false);
  const patch = (value: Partial<PreparedDocument>) => { pause(); setNotice(''); setSample(previous => ({ ...previous, ...value, approved: value.approved ?? false })); };
  const select = (value: string) => { pause(); setNotice(''); setPhase(value as Phase); };
  const reset = () => { pause(); setSample(makeLocalizedSample(locale)); setSize('1000'); setMerge(true); setUnitIndex(2); setChunkIndex(2); setPhase('extract'); setNotice(''); };
  const exportSample = () => {
    pause(); if (!sample.approved || blocked) return;
    downloadFile(localizedMarkdown(sample, chunks, locale), 'Precidoc-sample.md', 'text/markdown;charset=utf-8');
    setNotice(`${copy.downloaded}: Markdown`);
  };
  const approval = <label className="live-approval"><Checkbox aria-label={copy.approved} checked={sample.approved} disabled={blocked} onCheckedChange={value => patch({ approved: value === true })}/><span>{copy.approved}</span></label>;

  return <div className="product-demo live-demo" ref={root} data-playing={active}>
    <div className="demo-topbar"><Brand compact/><span className="demo-top-label">Database-Recovery.md</span><span className="demo-preview-label">{copy.sample}</span></div>
    <Tabs value={phase} onValueChange={select} className="demo-tabs">
      <div className="demo-toolbar"><TabsList className="demo-phase-list" aria-label={t('Tahapan demo produk')} onFocusCapture={pause}>
        {phases.map((item, index) => <TabsTrigger value={item.id} key={item.id}><span className="demo-phase-number">0{index + 1}</span><item.icon size={16}/><span>{copy.labels[index]}</span></TabsTrigger>)}
      </TabsList><button className="demo-play-control" disabled={reducedMotion} aria-label={playing ? copy.pause : copy.play} title={playing ? copy.pause : copy.play} onClick={() => { if (!playing && phase === 'export') setPhase('extract'); setPlaying(value => !value); }}>{playing && !reducedMotion ? <Pause size={16}/> : <Play size={16}/>}</button><button className="demo-play-control live-reset" aria-label={copy.reset} title={copy.reset} onClick={reset}><RotateCcw size={16}/></button></div>
      <div className="live-body">
        <div className="live-source">
          <div className="live-panel-heading"><FileText size={16}/><span>{copy.original}</span><code>{focusedUnit.id}</code></div>
          <div className="live-section-picker" aria-label={copy.sections}>{sample.units.map((unit, index) => <button key={unit.id} aria-pressed={focusedUnit.id === unit.id} onClick={() => { pause(); setUnitIndex(index); if (phase === 'chunks') setChunkIndex(Math.max(0, chunks.findIndex(chunk => chunk.sources.some(source => source.unitId === unit.id)))); }}><span>0{index + 1}</span>{unit.title}</button>)}</div>
          <pre className="live-original" key={focusedUnit.id}>{focusedUnit.original}</pre>
          <div className="live-source-footer"><span>{focusedUnit.original.length} {copy.characters}</span><span>{sample.name}</span></div>
        </div>
        <div className="live-output">
          <TabsContent value="extract" className="live-content">
            <div className="live-heading"><span className="demo-symbol"><ScanText size={20}/></span><div><h3>{sample.units.length} {copy.sections.toLowerCase()}</h3><p>{copy.extracted}</p></div></div>
            <div className="live-extraction-list">{sample.units.map((unit, index) => <button key={unit.id} className={focusedUnit.id === unit.id ? 'is-focused' : ''} onClick={() => { pause(); setUnitIndex(index); }}><span className="live-order">0{index + 1}</span><span><strong>{unit.title}</strong><small>{unit.id} · {unit.text.length} {copy.characters}</small></span><Check size={16}/></button>)}</div>
            <div className="live-source-reference"><FileText size={16}/><code>{focusedUnit.id}</code><span>{copy.source}</span></div>
          </TabsContent>
          <TabsContent value="review" className="live-content">
            <div className="live-heading"><span className="demo-symbol"><ShieldCheck size={20}/></span><h3>{copy.review}</h3></div>
            <label className="live-field"><span>{copy.version}</span><input disabled value={sample.version} placeholder="v1.0" onFocus={pause} onChange={event => patch({ version: event.target.value })}/></label>
            <label className="live-field"><span>{copy.editor}<code>{focusedUnit.id}</code></span><textarea value={focusedUnit.text} onFocus={pause} onChange={event => patch({ units: sample.units.map(unit => unit.id === focusedUnit.id ? { ...unit, text: event.target.value } : unit) })}/></label>
            <div className="live-checks" aria-label={copy.checks}>{checks.map(check => <div key={check.id} data-severity={check.severity}><InfoMark warning={check.severity !== 'info'}/><span>{t(check.title)}</span></div>)}</div>
            {approval}
          </TabsContent>
          <TabsContent value="chunks" className="live-content">
            <div className="live-heading"><span className="demo-symbol"><Layers size={20}/></span><div><h3>{chunks.length} {copy.labels[2].toLowerCase()}</h3><p>{copy.chunks}</p></div></div>
            <div className="live-chunk-controls"><label id="demo-chunk-size">{copy.max}</label><Select value={size} disabled onValueChange={value => { pause(); setSize(value); setChunkIndex(0); setSample(previous => ({ ...previous, approved: false })); setNotice(''); }}><SelectTrigger aria-labelledby="demo-chunk-size" onFocus={pause}><SelectValue/></SelectTrigger><SelectContent>{['200', '400', '1000', '2000'].map(value => <SelectItem key={value} value={value}>{Number(value).toLocaleString(locale === 'en' ? 'en-US' : 'id-ID')} {copy.characters}</SelectItem>)}</SelectContent></Select></div>
            <label className="live-deduplicate"><Checkbox checked={merge} disabled onCheckedChange={value => { pause(); setMerge(value === true); setSample(previous => ({ ...previous, approved: false })); setNotice(''); }}/><span>{copy.merge}</span></label>
            {focusedChunk ? <article className="live-chunk" key={focusedChunk.id}><div><strong>{copy.chunk} {Math.min(chunkIndex, chunks.length - 1) + 1} / {chunks.length}</strong><span>{focusedChunk.edited && copy.modified}</span></div><pre>{focusedChunk.text}</pre><footer><span>{copy.source}</span>{focusedChunk.sources.map(source => <button key={source.unitId} onClick={() => { pause(); setUnitIndex(sample.units.findIndex(unit => unit.id === source.unitId)); setPhase('review'); }}>{source.unitId}</button>)}</footer></article> : <p className="live-empty">{t('Belum ada chunk yang bisa digunakan.')}</p>}
            <div className="live-chunk-navigation"><button aria-label={copy.previous} disabled={!chunks.length || chunkIndex <= 0} onClick={() => { pause(); setChunkIndex(index => Math.max(0, index - 1)); }}><ChevronLeft size={16}/></button><span>{Math.min(chunkIndex + 1, chunks.length)} / {chunks.length}</span><button aria-label={copy.next} disabled={!chunks.length || chunkIndex >= chunks.length - 1} onClick={() => { pause(); setChunkIndex(index => Math.min(chunks.length - 1, index + 1)); }}><ChevronRight size={16}/></button></div>
          </TabsContent>
          <TabsContent value="export" className="live-content">
            <div className="live-heading"><span className="demo-symbol"><Braces size={20}/></span><h3>{copy.export}</h3></div>
            <div className="live-export-summary"><span>{chunks.length} {copy.labels[2].toLowerCase()}</span><span>{sample.units.length} {copy.sections.toLowerCase()}</span></div>
            <pre className="live-json" aria-label={copy.excerpt}><code>{excerpt}</code></pre>
            {approval}
            <div className="live-downloads"><Link className="button primary" href="/register">{copy.downloadJson}</Link><button className="button outline" disabled={!sample.approved || blocked} onClick={() => exportSample()}><Download size={15}/>{copy.downloadMd}</button></div>
            <p className="live-export-help">{blocked ? copy.blocked : sample.approved ? copy.copy : copy.notReviewed}</p>
          </TabsContent>
        </div>
      </div>
      <div className="demo-caption"><div><strong>{copy.labels[phaseIndex]}</strong><p>{copy.caption[phaseIndex]}</p></div><div className="live-playback-state"><span>{active ? copy.playing : copy.paused}</span><span className="demo-step-indicator" aria-hidden="true">{phases.map(item => <i className={item.id === phase ? 'active' : ''} key={item.id}/>)}</span></div></div>
    </Tabs>
    <div className="live-demo-footer"><p>{copy.footnote}</p><Link href="/sample" className="button outline">{copy.opened}</Link></div>
    <div className="live-notice" role="status" aria-live="polite">{notice}</div>
  </div>;
}

function InfoMark({ warning }: { warning: boolean }) { return warning ? <span className="live-check-mark">!</span> : <Check size={14}/>; }
