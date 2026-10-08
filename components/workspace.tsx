'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Upload, Layers, Braces, Check, TriangleAlert, Info, LoaderCircle, Download, Trash2, ChevronLeft, ChevronRight, LockKeyhole, BookOpen } from 'lucide-react';
import { Brand } from '@/components/brand';
import { LanguageSwitch, useLanguage } from '@/components/language';
import { makeLocalizedSample } from '@/lib/sample';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { buildChunks, findings, parseFile, type PreparedDocument } from '@/lib/documents';
import { localizedMarkdown, localizedPackage } from '@/lib/exports';
import { downloadFile } from '@/lib/download';
import { FULL_POLICY, TRIAL_POLICY } from '@/lib/workspace-policy';
type ModelContext = {
    registerTool: (tool: {
        name: string;
        title: string;
        description: string;
        inputSchema: Record<string, unknown>;
        annotations: {
            readOnlyHint: boolean;
            untrustedContentHint: boolean;
        };
        execute: (input: unknown) => unknown;
    }, { signal }: {
        signal: AbortSignal;
    }) => unknown;
};
export function Workspace({ trial = false, accountName, signOutHref }: { trial?: boolean; accountName?: string; signOutHref?: string }) {
    const { t, locale, ready } = useLanguage();
    const policy = trial ? TRIAL_POLICY : FULL_POLICY;
    const trialLimit = 'Trial hanya mendukung satu dokumen. Hapus dokumen saat ini atau daftar untuk menambahkan lebih banyak.';
    const exampleInitialized = useRef(false);
    const [docs, setDocs] = useState<PreparedDocument[]>([]);
    const [selected, setSelected] = useState('');
    const [tab, setTab] = useState('overview');
    const [unitIndex, setUnitIndex] = useState(0);
    const [chunkSize, setChunkSize] = useState(trial ? String(TRIAL_POLICY.chunkSize) : '2000');
    const [deduplicate, setDeduplicate] = useState(true);
    const [loading, setLoading] = useState('');
    const [error, setError] = useState<string[]>([]);
    const [dragging, setDragging] = useState(false);
    const [showPdf, setShowPdf] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const docsRef = useRef(docs);
    docsRef.current = docs;
    const current = docs.find(d => d.id === selected) ?? docs[0];
    const chunks = useMemo(() => current ? buildChunks(current, trial ? TRIAL_POLICY.chunkSize : Number(chunkSize), trial ? true : deduplicate) : [], [current, chunkSize, deduplicate, trial]);
    const checks = useMemo(() => current ? findings(current) : [], [current]);
    const source = current?.units[unitIndex];
    const blocker = checks.some(c => c.severity === 'blocker');
    const selectDocument = (id: string) => { setSelected(id); setUnitIndex(0); setTab('overview'); setShowPdf(false); };
    const loadExample = useCallback(() => {
        const example = makeLocalizedSample(locale);
        const existing = docsRef.current.some(d => d.id === example.id);
        if (!existing && trial && docsRef.current.length === 1 && docsRef.current[0].sample) {
            docsRef.current = [example]; setDocs([example]);
            setSelected(example.id); setUnitIndex(0); setTab('overview'); setError([]); setShowPdf(false);
            return example.id;
        }
        if (!existing && docsRef.current.length >= policy.maxDocuments) {
            setError([trial ? trialLimit : 'Tambahkan maksimal 5 file sekaligus dan maksimal 10 dokumen per tab.']);
            return '';
        }
        if (!existing) { const next = [...docsRef.current, example]; docsRef.current = next; setDocs(next); }
        setSelected(example.id); setUnitIndex(0); setTab('overview'); setError([]); setShowPdf(false);
        return example.id;
    }, [locale, policy.maxDocuments, trial]);
    useEffect(() => {
        if (!ready || exampleInitialized.current) return;
        exampleInitialized.current = true;
        const parameters = new URLSearchParams(window.location.search);
        if (trial || parameters.get('example') === '1') {
            loadExample();
            const requestedTab = parameters.get('tab');
            if (requestedTab && ['overview', 'source', 'chunks', 'export'].includes(requestedTab)) setTab(requestedTab);
        }
    }, [ready, loadExample, trial]);
    useEffect(() => () => { docsRef.current.forEach(d => d.objectUrl && URL.revokeObjectURL(d.objectUrl)); }, []);
    const acceptFiles = async (files: FileList | File[]) => {
        if (loading)
            return;
        setError([]);
        const list = Array.from(files);
        if (!list.length)
            return;
        const replacesSample = trial && docsRef.current.length === 1 && !!docsRef.current[0].sample;
        if (list.length > policy.maxBatch || (!replacesSample && docsRef.current.length + list.length > policy.maxDocuments)) {
            setError([trial ? trialLimit : 'Tambahkan maksimal 5 file sekaligus dan maksimal 10 dokumen per tab.']);
            if (fileInput.current) fileInput.current.value = '';
            return;
        }
        const failures: string[] = [];
        let added = 0;
        for (const file of list) {
            try {
                setLoading(`Membaca ${file.name}`);
                const parsed = await parseFile(file, setLoading, policy);
                if (docsRef.current.some(d => d.hash === parsed.hash)) {
                    if (parsed.objectUrl)
                        URL.revokeObjectURL(parsed.objectUrl);
                    toast.info(t(`${file.name} sudah ada di workspace.`));
                    continue;
                }
                const next = replacesSample ? [parsed] : [...docsRef.current, parsed];
                docsRef.current = next;
                setDocs(next);
                selectDocument(parsed.id);
                added++;
            }
            catch (e) {
                const message = e instanceof Error ? e.message : '';
                const known = /gunakan PDF|file kosong|ukuran maksimal|Maksimal \d+|Dokumen terlalu panjang|PDF dilindungi password|encoding UTF-8/.test(message);
                const detail = known ? message : 'File tidak dapat dibaca. Periksa file asli atau coba simpan ulang dalam format yang didukung.';
                failures.push(detail.startsWith(file.name+':')?detail:`${file.name}: ${detail}`);
            }
        }
        setLoading('');
        if (failures.length)
            setError(failures);
        if (added)
            toast.success(t(`${added} dokumen selesai diekstrak.`));
        if (fileInput.current)
            fileInput.current.value = '';
    };
    const patchDocument = (patch: Partial<PreparedDocument>) => { if (!current)
        return; setDocs(prev => prev.map(d => d.id === current.id ? { ...d, ...patch, approved: 'approved' in patch ? patch.approved! : false } : d)); };
    const editUnit = (text: string) => { if (!current || !source)
        return; patchDocument({ units: current.units.map(u => u.id === source.id ? { ...u, text } : u) }); };
    const removeDocument = (id: string) => { const target = docsRef.current.find(d => d.id === id); if (target?.objectUrl)
        URL.revokeObjectURL(target.objectUrl); const next = docsRef.current.filter(d => d.id !== id); docsRef.current = next; setDocs(next); selectDocument(next[0]?.id ?? ''); toast.info(t('Dokumen dikeluarkan dari tab ini. File aslinya tetap ada.')); };
    const exportResult = (format: 'json' | 'md') => { if ((trial && format === 'json') || !current || !current.approved || blocker || !chunks.length)
        return; const name = (current.title || current.name).replace(/[^\p{L}\p{N}._-]+/gu, '-').slice(0, 80) || 'precidoc'; downloadFile(format === 'json' ? JSON.stringify(localizedPackage(current, chunks, locale), null, 2) : localizedMarkdown(current, chunks, locale), `${name}-prepared.${format}`, format === 'json' ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8'); toast.success(t(`Hasil ${format.toUpperCase()} berhasil diunduh.`)); };
    useEffect(() => {
        const context = (document as Document & {
            modelContext?: ModelContext;
        }).modelContext;
        if (!context?.registerTool)
            return;
        const lifecycle = new AbortController();
        const tools = [{ name: 'get_document_workspace', title: 'Read document workspace', description: 'Read documents currently open in this tab and their review state; does not upload or export anything.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute(input: unknown) { if (!input || typeof input !== 'object' || Object.keys(input).length)
                    throw new Error('Expected an empty object.'); return { documents: docsRef.current.map(d => ({ id: d.id, name: d.name, sourceUnits: d.units.length, reviewed: d.approved, findings: findings(d).map(f => ({ title: f.title, severity: f.severity })) })) }; } }, { name: 'load_example_document', title: 'Open example runbook', description: 'Open the built-in example document in the workspace, using the same action as the example button. Does not process user files.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, async execute(input: unknown) { if (!input || typeof input !== 'object' || Object.keys(input).length)
                    throw new Error('Expected an empty object.'); const id = loadExample(); await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); return { id, opened: !!id }; } }];
        for (const tool of tools) {
            try {
                void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => { });
            }
            catch { }
        }
        return () => lifecycle.abort();
    }, [loadExample]);
    return <div className={`workspace ${trial ? "trial-workspace" : "full-workspace"}`}><Toaster position="bottom-right" theme="light"/><header className="workspace-header"><div className="workspace-header-left"><Link href="/" aria-label={t("Beranda Precidoc")}><Brand /></Link><span className="workspace-label">{t("Document workspace")}</span></div><div className="workspace-nav-actions"><LanguageSwitch/>{trial ? <Link className="button primary trial-register-nav" href="/register">{t("Buka workspace")}</Link> : <>{accountName && <span className="workspace-account-name" title={accountName}>{accountName}</span>}{signOutHref && <a className="signout-link" href={signOutHref} target="_top">{t("Keluar")}</a>}</>}<Link className="button outline about-link" href="/">{t("Tentang Precidoc")}</Link></div></header><main className="workspace-main">{trial && <div className="trial-banner"><div><strong>{t("Workspace contoh")}</strong><p>{t("1 dokumen · maksimal 5 MB · PDF hingga 20 halaman. Coba ekstraksi, edit teks, dan ekspor Markdown.")}</p></div><Link className="button primary" href="/register">{t("Buka workspace untuk daftar")}</Link></div>}<div className="workspace-title"><div><h1>{trial ? t("Coba dengan satu dokumen.") : t("Siapkan dokumenmu.")}</h1><p>{t("Periksa sumber, rapikan konteks, dan bawa hasilnya ke knowledge base.")}</p></div><div className="workspace-title-actions"><button className="button outline" onClick={loadExample} disabled={!!loading || (trial && !!current && !current.sample)}>{t("Coba contoh")}</button>{docs.length > 0 && <button className="button jade" onClick={() => fileInput.current?.click()} disabled={!!loading || (trial && !!current && !current.sample)}><Upload size={16}/>{trial ? t("Gunakan dokumen sendiri") : t("Tambah dokumen")}</button>}</div></div>
 <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,.md" multiple={!trial} hidden aria-label={t("Upload dokumen")} onChange={e => e.target.files && void acceptFiles(e.target.files)}/>
 {error.length > 0 && <div className="error-banner" role="alert"><TriangleAlert size={19}/><span>{error.map(t).join(' ')}</span></div>}{loading && <div className="processing" role="status"><LoaderCircle size={20} className="spin"/><span>{t(loading)}</span></div>}
 {!docs.length ? <div className="workspace-empty"><div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void acceptFiles(e.dataTransfer.files); }}><div className="upload-icon"><Upload size={28}/></div><h2>{t("Dokumen pertama kamu dimulai di sini.")}</h2><p>{t("Tarik file ke area ini, atau pilih dari perangkatmu. Sumber tetap mengikuti hasil ekstraksi.")}</p><button className="button jade" onClick={() => fileInput.current?.click()} disabled={!!loading}>{t("Pilih dokumen")}</button><small>{trial ? t("PDF digital · DOCX · TXT · MD — maksimal 5 MB/file") : t("PDF digital \u00B7 DOCX \u00B7 TXT \u00B7 MD \u2014 maksimal 15 MB/file")}</small></div><div className="intro-panel"><div className="eyebrow">{t("LIHAT ALURNYA TERLEBIH DAHULU")}</div><h2>{t("Satu runbook.")}<br /><em>{t("Dari sumber ke chunk.")}</em></h2><ul><li><Check size={16}/>{t("Struktur bagian dan tabel")}</li><li><Check size={16}/>{t("Metadata dan catatan pemeriksaan")}</li><li><Check size={16}/>{t("Export dengan referensi sumber")}</li></ul><button className="button primary" onClick={loadExample} disabled={!!loading}>{t("Buka contoh runbook")}</button></div></div> : <div className="workbench"><aside className="document-list" aria-label={t("Dokumen dalam tab ini")}><div className="document-list-heading"><span>{t("DOKUMEN")}</span><span>{docs.length}/{policy.maxDocuments}</span></div>{docs.map(doc => <div key={doc.id} className="document-list-row"><button className={`document-item ${current?.id === doc.id ? 'active' : ''}`} onClick={() => selectDocument(doc.id)}><FileText size={20}/><div className="document-item-text"><strong>{doc.name}</strong><small>{doc.format}{t(" \u00B7 ")}{doc.units.length} {doc.format === t("PDF") ? t("halaman") : t("bagian")}</small><span className={`badge ${doc.approved ? 'green' : 'neutral'}`}>{doc.approved ? t("Ditinjau") : t("Belum ditinjau")}</span></div></button></div>)}</aside>
 {current && <section className="document-details"><div className="document-detail-head"><div><h2>{current.title || current.name}</h2><p>{current.name}{t(" \u00B7 ")}{current.sample ? t("Contoh dokumen") : `${(current.bytes / 1024).toFixed(1)} KB`}{t(" \u00B7 ")}{current.units.length}{t(" sumber")}</p></div><div className="detail-actions"><span className={`badge ${blocker ? 'amber' : current.approved ? 'green' : 'neutral'}`}>{blocker ? t("Perlu perbaikan") : current.approved ? t("Ditinjau pengguna") : t("Belum ditinjau")}</span><button className="remove-button" aria-label={t("Keluarkan dokumen dari tab")} onClick={() => removeDocument(current.id)} disabled={!!loading}><Trash2 size={17}/></button></div></div>
 <Tabs value={tab} onValueChange={setTab} className="document-tabs"><TabsList variant="line" aria-label={t("Tahap persiapan dokumen")}><TabsTrigger value="overview">{t("Ringkasan")}</TabsTrigger><TabsTrigger value="source">{t("Sumber & hasil")}</TabsTrigger><TabsTrigger value="chunks">{t("Chunks")}</TabsTrigger><TabsTrigger value="export">{t("Export")}</TabsTrigger></TabsList>
 <TabsContent value="overview"><div className="stats-strip"><div><small>{t("Sumber")}</small><strong>{current.units.length}</strong></div><div><small>{t("Chunks")}</small><strong>{chunks.length}</strong></div><div><small>{t("Tabel terdeteksi")}</small><strong>{current.format === t("PDF") ? t("\u2014") : current.units.reduce((n, u) => n + u.tableCount, 0)}</strong></div><div><small>{t("Catatan")}</small><strong>{checks.length}</strong></div></div><div className="metadata-grid"><label><span className="field-label">{t("Judul dokumen")}</span><input className="field-input" value={current.title} onChange={e => patchDocument({ title: e.target.value })}/></label><label><span className="field-label">{t("Versi dokumen")}</span><input className="field-input" placeholder={t("Contoh: v1.2 atau 2026-10")} disabled={trial} value={current.version} onChange={e => patchDocument({ version: e.target.value })}/></label><div><label className="field-label" id="category-label">{t("Jenis dokumen")}</label><Select value={current.category} disabled={trial} onValueChange={value => patchDocument({ category: value })}><SelectTrigger aria-labelledby="category-label" className="w-full min-h-11 text-sm"><SelectValue /></SelectTrigger><SelectContent>{["Belum ditentukan", "Runbook", "SOP", "Kebijakan", "Manual teknis", "Laporan", "Lainnya"].map(v => <SelectItem key={v} value={v}>{t(v)}</SelectItem>)}</SelectContent></Select></div><div><span className="field-label">{t("Metode pemrosesan")}</span><div className="field-input">{t("Ekstraksi & aturan \u00B7 tanpa LLM")}</div></div></div>{trial && <p className="trial-settings-note">{t("Daftar untuk mengatur metadata, ukuran chunk, deduplikasi, dan ekspor JSON.")} <Link href="/register">{t("Buka workspace")}</Link></p>}<div className="checks-header"><h3>{t("Catatan pemeriksaan")}</h3><span className="badge neutral">{checks.length}{t(" catatan")}</span></div>{!checks.length ? <div className="clean-result"><Check size={18}/><span>{t("Tidak ada catatan dari pemeriksaan aturan. Tetap verifikasi isi terhadap sumber.")}</span></div> : checks.map(f => <div key={f.id} className={`issue ${f.severity === 'info' ? 'info' : ''}`}><Info size={18}/><div><strong>{t(f.title)}</strong><p>{t(f.detail)}</p>{f.unitId && <button className="button text-button" onClick={() => { setUnitIndex(current.units.findIndex(u => u.id === f.unitId)); setTab('source'); }}>{t("Periksa bagian ini")}</button>}</div></div>)}<p className="format-help">{t("Pemeriksaan ini tidak mengukur akurasi retrieval dan tidak menjamin semua kesalahan ekstraksi terdeteksi.")}</p></TabsContent>
 <TabsContent value="source">{source && <><div className="unit-navigation"><span>{source.page?t(`Halaman ${source.page}`):source.title}{t(" \u00B7 ")}{unitIndex + 1}{t("/")}{current.units.length}</span><div className="unit-buttons"><button className="button outline" aria-label={t("Sumber sebelumnya")} disabled={unitIndex === 0} onClick={() => setUnitIndex(i => i - 1)}><ChevronLeft size={16}/></button><button className="button outline" aria-label={t("Sumber selanjutnya")} disabled={unitIndex === current.units.length - 1} onClick={() => setUnitIndex(i => i + 1)}><ChevronRight size={16}/></button></div></div><div className="source-editor-grid"><div className="source-panel"><div className="panel-title"><span>{showPdf ? t("FILE PDF ASLI") : t("TEKS EKSTRAKSI AWAL")}</span>{current.format === t("PDF") && <button className="button text-button" onClick={() => setShowPdf(p => !p)}>{showPdf ? t("Lihat teks") : t("Lihat PDF asli")}</button>}</div>{showPdf && current.objectUrl ? <iframe title={t("File PDF asli")} className="source-pdf" src={`${current.objectUrl}#page=${source.page ?? 1}`}/> : <pre className="source-text">{source.original || t("Tidak ada teks yang berhasil diekstrak dari sumber ini.")}</pre>}</div><div className="editor-panel"><div className="panel-title"><span>{t("HASIL YANG AKAN DIGUNAKAN")}</span><button className="button text-button" disabled={source.text === source.original} onClick={() => editUnit(source.original)}>{t("Pulihkan teks awal")}</button></div><textarea className="editor-text" aria-label={t("Edit hasil ekstraksi")} value={source.text} onChange={e => editUnit(e.target.value)}/></div></div><div className="edit-note">{t("Perubahan teks membatalkan persetujuan sebelumnya. Referensi tetap mengarah ke ")}{source.page ? t(`halaman ${source.page}`) : source.id}{t("; hasil edit ditandai pada export.")}</div>{current.objectUrl && <a className="button outline mt-4" href={current.objectUrl} download={current.name}><Download size={15}/>{t("Unduh file asli")}</a>}</>}</TabsContent>
 <TabsContent value="chunks">{trial && <p className="trial-settings-note">{t("Trial memakai chunk maksimal 1.000 karakter. Daftar untuk menyesuaikan pengaturannya.")} <Link href="/register">{t("Buka workspace")}</Link></p>}<div className="chunk-controls"><div><label id="chunk-size-label">{t("Ukuran maksimal")}</label><Select value={chunkSize} disabled={trial} onValueChange={value => { setChunkSize(value); setDocs(prev => prev.map(d => ({ ...d, approved: false }))); }}><SelectTrigger aria-labelledby="chunk-size-label" className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1000">{t("1.000 karakter")}</SelectItem><SelectItem value="2000">{t("2.000 karakter")}</SelectItem><SelectItem value="4000">{t("4.000 karakter")}</SelectItem></SelectContent></Select></div><label><Checkbox checked={deduplicate} disabled={trial} onCheckedChange={value => { setDeduplicate(value === true); setDocs(prev => prev.map(d => ({ ...d, approved: false }))); }}/>{t("Gabungkan bagian identik")}</label></div><p className="format-help">{t("Chunk mengikuti sumber halaman atau bagian. Jumlah token adalah estimasi karakter \u00F7 4; pemisahan belum memakai reasoning AI.")}</p>{chunks.length ? <div className="chunk-list">{chunks.map((chunk, i) => <article key={chunk.id} className="chunk-card"><div className="chunk-card-head"><strong>{String(i + 1).padStart(2, t("0"))}{t(" \u00B7 ")}{chunk.title}</strong><span>{t("~")}{chunk.estimatedTokens}{t(" token")}</span></div><p>{chunk.text}</p><footer>{chunk.sources.map(s => <button className="chunk-source-link" key={s.unitId} onClick={() => { setUnitIndex(current.units.findIndex(unit => unit.id === s.unitId)); setTab("source"); }}>{s.page ? t(`Halaman ${s.page}`) : s.unitId}</button>)}{chunk.edited && <span>{t("\u00B7 Teks diedit pengguna")}</span>}</footer></article>)}</div> : <div className="no-content"><strong>{t("Belum ada chunk yang bisa digunakan.")}</strong><p>{t("Periksa bagian kosong atau tambahkan teks yang telah diverifikasi pada tab Sumber & hasil.")}</p></div>}</TabsContent>
 <TabsContent value="export"><div className="export-panel"><div className="upload-icon"><Braces size={26}/></div><h3>{t("Bawa pengetahuan yang sudah kamu periksa.")}</h3><p>{t("Paket export berisi ")}{chunks.length}{t(" chunk, metadata dokumen, catatan pemeriksaan, dan referensi sumber. Hasil ini bisa diteruskan ke alur KB kamu.")}</p>{blocker && <div className="issue"><TriangleAlert size={18}/><div><strong>{t("Ada catatan yang perlu diperbaiki.")}</strong><p>{t("Periksa catatan pada tab Ringkasan. Lengkapi judul atau teks sumber yang kosong sebelum mengekspor.")}</p></div></div>}<div className="export-review"><Checkbox id="approve-document" checked={current.approved} disabled={blocker || !chunks.length} onCheckedChange={value => patchDocument({ approved: value === true })}/><label htmlFor="approve-document">{t("Saya sudah memeriksa hasil terhadap sumber.")}<small>{t("Persetujuan ini menandai review kamu, bukan sertifikasi kualitas dokumen.")}</small></label></div><div className="export-buttons">{!trial && <button className="button jade" onClick={() => exportResult('json')} disabled={!current.approved || blocker || !chunks.length}><Download size={16}/>{t("Export JSON")}</button>}<button className="button outline" onClick={() => exportResult('md')} disabled={!current.approved || blocker || !chunks.length}><Download size={16}/>{t("Export Markdown")}</button></div>{trial && <div className="trial-upsell"><h3>{t("Buka fitur workspace lengkap")}</h3><p>{t("Daftar untuk menambahkan hingga 10 dokumen, mengatur chunk dan deduplikasi, serta mengunduh JSON.")}</p><Link className="button primary" href="/register">{t("Buka workspace untuk daftar")}</Link></div>}<p className="format-help">{t("Export tidak mengirim file ke vector database atau menerbitkan dokumen ke knowledge base. Tidak ada embeddings yang dibuat pada versi ini.")}</p></div></TabsContent>
 </Tabs></section>}</div>}
 <div className="workspace-info"><LockKeyhole size={15}/><span>{t("File diproses di browser dan hanya tersedia selama tab ini terbuka. Unduh hasil sebelum memuat ulang halaman. OCR, Claude, dan integrasi KB belum aktif.")}</span></div></main></div>;
}
