'use client';
import Link from 'next/link';
import { Braces, Check, FileText, Layers, LockKeyhole, ScanText, ShieldCheck } from 'lucide-react';
import { Brand, LogoMark } from '@/components/brand';
import { DocumentMascot } from '@/components/document-mascot';
import { ProductDemo } from '@/components/product-demo';
import { LanguageSwitch, useLanguage } from '@/components/language';

const features = [
  { icon: ScanText, number: '01', tab: 'source', label: 'EXTRACT', title: 'Baca strukturnya.', text: 'Ekstrak teks PDF digital, heading DOCX, dan tabel Word. Referensi halaman atau bagian mengikuti hasilnya.', tags: ['PDF · DOCX · TXT · MD', 'Referensi halaman & bagian'] },
  { icon: ShieldCheck, number: '02', tab: 'overview', label: 'ANALYZE', title: 'Ketahui apa yang perlu diperbaiki.', text: 'Lihat skor kesiapan, teks kosong, metadata, dan duplikasi. Setiap pemeriksaan menunjukkan batasan dan langkah berikutnya.', tags: ['Knowledge Readiness Score', 'Pemeriksaan yang transparan'] },
  { icon: Layers, number: '03', tab: 'chunks', label: 'OPTIMIZE', title: 'Rapikan konteksnya.', text: 'Periksa sumber, edit teks, lengkapi metadata, dan atur chunk. Gabungkan bagian identik dengan referensi tetap terhubung.', tags: ['Review manual', 'Metadata dokumen'] },
  { icon: Braces, number: '04', tab: 'export', label: 'EXPORT', title: 'Bawa hasil yang bisa ditelusuri.', text: 'Unduh JSON atau Markdown dengan skor, metadata, dan sumber. Kamu yang meninjau dan menyetujui sebelum export.', tags: ['Referensi sumber', 'JSON · Markdown'] },
];
const faqs=[
  ['Dokumen apa yang bisa diproses?','PDF dengan teks yang dapat dipilih, DOCX, TXT, dan Markdown. Batasnya 15 MB per file, 200 halaman per PDF, dan 10 dokumen per tab. OCR untuk file scan belum tersedia.'],
  ['Apakah file dikirim ke server?','Tidak. File diproses di browser dan disimpan sementara di memori tab. Muat ulang atau menutup tab akan menghapus sesi, jadi unduh hasilnya terlebih dahulu.'],
  ['Apakah Precidoc menggunakan AI?','Pemrosesan saat ini menggunakan ekstraksi dan pemeriksaan berbasis aturan. LLM, OCR, embeddings, dan koneksi langsung ke knowledge base belum tersedia.'],
  ['Apakah hasil bisa langsung digunakan?','Hasilnya adalah paket persiapan. Periksa tabel, angka, dan urutan baca pada PDF, lalu sesuaikan paket dengan format yang dibutuhkan sistem kamu.'],
];

export default function Home() {
  const {t,locale}=useLanguage();
  return <div className="landing saas-landing">
    <header className="marketing-nav container">
      <Link href="/" aria-label={t('Beranda Precidoc')}><Brand /></Link>
      <nav aria-label={locale==='en'?'Main navigation':'Navigasi utama'}><a href="#produk">{t('Produk')}</a><a href="#fitur">{t('Fitur')}</a><a href="#cara-kerja">{t('Cara kerja')}</a><a href="#faq">FAQ</a></nav>
      <div className="nav-actions"><LanguageSwitch/><Link href="/register" className="button nav-workspace">{t('Buka workspace')}</Link></div>
    </header>
    <main>
      <section className="saas-hero container">
        <div className="hero-kicker hero-enter"><span>{(locale === 'en' ? 'DOCUMENT PREPARATION FOR ENTERPRISE AI / RAG' : 'PERSIAPAN DOKUMEN UNTUK AI / RAG ENTERPRISE')}</span></div>
        <h1 className="hero-enter">{(locale === 'en' ? 'Better documents.' : 'Dokumen lebih siap.')}<br/><em>{(locale === 'en' ? 'Better context for AI.' : 'Konteks lebih baik untuk AI.')}</em></h1>
        <p className="hero-description hero-enter">{locale === 'en' ? 'Find what needs attention, refine the content, and export traceable knowledge. One preparation workspace between your documents and your AI knowledge base.' : 'Temukan bagian yang perlu diperiksa, rapikan konten, lalu export pengetahuan dengan sumber yang jelas. Satu workspace persiapan antara dokumen dan knowledge base AI kamu.'}</p>
        <div className="hero-actions hero-enter"><Link href="/register" className="button primary">{locale === 'en' ? 'Create your workspace' : 'Buat workspace kamu'}</Link><Link href="/sample" className="button outline">{t('Lihat contoh runbook')}</Link></div>
        <div className="hero-assurance hero-enter"><span><LockKeyhole size={14}/>{t('Diproses di browser')}</span><span><Check size={14}/>{t('Tanpa API key')}</span></div>
        <div className="hero-product-note"><DocumentMascot state="idle"/><div><strong>{locale === 'en' ? 'Every document deserves a check.' : 'Setiap dokumen layak diperiksa.'}</strong><span>{locale === 'en' ? 'Text coverage · metadata · duplication · source references' : 'Cakupan teks · metadata · duplikasi · referensi sumber'}</span></div></div>
        <div id="produk" className="saas-demo-wrap hero-enter"><div className="demo-overline"><span>{t('KONTEN YANG RAPI. SUMBER YANG JELAS.')}</span><span>{t('Jelajahi setiap tahap')}</span></div><ProductDemo/></div>
      </section>
      <div className="saas-format-band container"><span>{t('FORMAT MASUK')}</span><div><span>{t('PDF digital')}</span><span>DOCX</span><span>TXT</span><span>Markdown</span></div><span className="format-out"><Braces size={16}/>{t('JSON & Markdown keluar')}</span></div>
      <section id="fitur" className="saas-features container">
        <div className="saas-section-heading"><div><h2>{t('Ekstraksi, review,')}<br/><em>{t('dan export.')}</em></h2></div><p>{t('Satu workspace untuk memeriksa struktur, memperbaiki teks, dan menyiapkan chunk dengan referensi sumber.')}</p></div>
        <div className="readiness-report"><h3>Upload → Analyze → Optimize → Export</h3><p>{locale === 'en' ? 'The preparation layer between enterprise documents and AI knowledge bases. Analyze text coverage, metadata, duplication, source references, and review with an explainable Knowledge Readiness Score. Optimize text and chunks, then export a preparation report with JSON or Markdown.' : 'Lapisan persiapan antara dokumen enterprise dan knowledge base AI. Analisis cakupan teks, metadata, duplikasi, referensi sumber, dan review dengan Knowledge Readiness Score yang transparan. Rapikan teks dan chunk, lalu export laporan persiapan bersama JSON atau Markdown.'}</p><Link href="/sample" className="button outline">{locale === 'en' ? 'Analyze the sample' : 'Analisis contoh'}</Link></div><div className="saas-feature-grid">{features.map(f=><article className="saas-feature" key={f.number}><div className="saas-feature-head"><span className="feature-symbol"><f.icon size={23}/></span><span>{f.number} / {locale==='en'?f.label:['EKSTRAKSI','ANALISIS','RAPIKAN','EXPORT'][Number(f.number)-1]}</span></div><h3>{t(f.title)}</h3><p>{t(f.text)}</p><div className="feature-tags">{f.tags.map(tag=><span key={tag}>{t(tag)}</span>)}</div><Link className="feature-try" href={`/sample?tab=${f.tab}`}>{t('Coba fitur ini')}</Link></article>)}</div>
      </section>
      <section className="source-story container">
        <div className="source-story-copy"><h2>{t('Referensi sumber')}<br/><em>{t('di setiap chunk.')}</em></h2><p>{t('Telusuri konten ke bagian asalnya. Lihat teks yang telah diedit. Periksa kembali sebelum dipakai dalam knowledge base.')}</p><Link href="/sample" className="button outline">{t('Periksa contoh')}</Link></div>
        <div className="provenance-card"><div className="provenance-top"><Layers size={19}/><strong>{t('Prosedur pemulihan')}</strong><span>CHUNK 03</span></div><p>{t('Periksa status replikasi. Verifikasi lag dan kapasitas disk. Jalankan restore sesuai playbook.')}</p><div className="provenance-link"><span className="provenance-rail" aria-hidden="true"/><div><small>{t('TERHUBUNG KE SUMBER')}</small><strong><FileText size={16}/>Database-Recovery.md</strong><span>section_03 · {t('Prosedur pemulihan')}</span></div><ShieldCheck size={24}/></div><div className="provenance-foot"><span><Check size={14}/>{t('Referensi sumber')}</span><span><Check size={14}/>{t('Penanda perubahan teks')}</span></div></div>
      </section>
      <section id="cara-kerja" className="saas-workflow container"><div className="saas-section-heading"><div><h2>{t('Tambahkan file.')}<br/><em>{t('Periksa hasilnya.')}</em></h2></div><Link href="/register" className="button outline">{t('Buka workspace')}</Link></div>
        <ol className="saas-workflow-list">{features.map((feature,index)=><li key={feature.number}><span>{feature.number}</span><h3>{locale === 'en' ? ['Upload','Analyze','Optimize','Export'][index] : ['Unggah','Analisis','Rapikan','Export'][index]}</h3><p>{t(feature.text)}</p><small>{t(feature.tags[0])}</small></li>)}</ol>
      </section>
      <section id="faq" className="faq-section container"><div><h2>{t('Pertanyaan umum')}</h2><p className="faq-intro">{t('Fitur yang tersedia saat ini, dan hal yang perlu kamu periksa.')}</p></div><div className="faq-list">{faqs.map(([question,answer])=><details key={question}><summary>{t(question)}</summary><p>{t(answer)}</p></details>)}</div></section>
      <section className="saas-closing container"><div className="closing-inner"><LogoMark/><h2>{t('Coba dengan dokumenmu.')}</h2><p>{t('Baca. Periksa. Rapikan. Lalu bawa hasilnya ke langkah berikutnya.')}</p><div className="hero-actions"><Link href="/register" className="button primary">{t('Buka workspace Precidoc')}</Link><Link href="/sample" className="button text-button">{t('Coba dengan contoh')}</Link></div></div></section>
    </main>
    <footer className="footer container"><Brand/><span>© {new Date().getFullYear()} Rainc</span></footer>
  </div>;
}
