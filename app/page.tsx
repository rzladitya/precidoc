'use client';
import Link from 'next/link';
import { Braces, Check, LockKeyhole } from 'lucide-react';
import { LogoMark } from '@/components/brand';
import { MarketingHeader, MarketingFooter } from '@/components/marketing-shell';
import { DocumentMascot } from '@/components/document-mascot';
import { DocumentChecks } from '@/components/document-checks';
import { ProductDemo } from '@/components/product-demo';
import { Newsletter } from '@/components/newsletter';
import { useLanguage } from '@/components/language';

const faqs=[
  ['Dokumen apa yang bisa diproses?','PDF dengan teks yang dapat dipilih, DOCX, TXT, dan Markdown. Batasnya 15 MB per file, 200 halaman per PDF, dan 10 dokumen per tab. OCR untuk file scan belum tersedia.'],
  ['Apakah file dikirim ke server?','Tidak. File diproses di browser dan disimpan sementara di memori tab. Muat ulang atau menutup tab akan menghapus sesi, jadi unduh hasilnya terlebih dahulu.'],
  ['Apakah Precidoc menggunakan AI?','Pemrosesan saat ini menggunakan ekstraksi dan pemeriksaan berbasis aturan. LLM, OCR, embeddings, dan koneksi langsung ke knowledge base belum tersedia.'],
  ['Apakah hasil bisa langsung digunakan?','Hasilnya adalah paket persiapan. Periksa tabel, angka, dan urutan baca pada PDF, lalu sesuaikan paket dengan format yang dibutuhkan sistem kamu.'],
];

export default function Home() {
  const {t,locale}=useLanguage();
  return <div className="landing saas-landing">
    <MarketingHeader />
    <main>
      <section className="saas-hero container">
        <div className="hero-kicker hero-enter"><span>{(locale === 'en' ? 'DOCUMENT PREPARATION FOR AI · EARLY ACCESS' : 'PERSIAPAN DOKUMEN UNTUK AI · AKSES AWAL')}</span></div>
        <h1 className="hero-enter">{(locale === 'en' ? 'Better documents.' : 'Dokumen lebih siap.')}<br/><em>{(locale === 'en' ? 'Better AI outcomes.' : 'Hasil AI dimulai dari sini.')}</em></h1>
        <p className="hero-description hero-enter">{locale === 'en' ? 'Messy extraction and missing context make documents harder to use. Extract text from PDF, DOCX, or Markdown, fix what needs attention, and export reviewed chunks with their sources.' : 'Ekstraksi yang berantakan dan konteks yang hilang menyulitkan penggunaan dokumen. Baca teks dari PDF, DOCX, atau Markdown, perbaiki bagian yang perlu diperiksa, lalu ekspor chunk beserta sumbernya.'}</p>
        <div className="hero-actions hero-enter"><Link href="/sample" className="button primary">{locale==='en'?'Try the Sample':'Coba Contoh'}</Link><Link href="/register" className="button outline">{locale==='en'?'Create a free workspace':'Buat workspace gratis'}</Link></div>
        <div className="hero-assurance hero-enter"><span><LockKeyhole size={14}/>{t('Diproses di browser')}</span><span><Check size={14}/>{t('Tanpa API key')}</span></div>
        <p className="hero-current-method">{locale==='en'?'Real browser parsing and rule-based checks. No signup for the sample. LLM assistance is planned; it is not used today.':'Parsing nyata di browser dan pemeriksaan berbasis aturan. Contoh tanpa daftar. Bantuan LLM direncanakan dan belum digunakan.'}</p><div className="hero-product-note"><DocumentMascot state="idle"/><div><strong>{locale === 'en' ? 'Check the text before you use it.' : 'Periksa teks sebelum dipakai.'}</strong><span>{locale === 'en' ? 'Compare sections, edit the output, then export.' : 'Bandingkan bagian, edit hasilnya, lalu export.'}</span></div></div>
        <div id="produk" className="saas-demo-wrap hero-enter"><div className="demo-overline"><span>{t('KONTEN YANG RAPI. SUMBER YANG JELAS.')}</span><span>{t('Jelajahi setiap tahap')}</span></div><ProductDemo/></div>
      </section>
      <div className="saas-format-band container"><span>{t('FORMAT MASUK')}</span><div><span>{t('PDF digital')}</span><span>DOCX</span><span>TXT</span><span>Markdown</span></div><span className="format-out"><Braces size={16}/>{t('JSON & Markdown keluar')}</span></div>
      <DocumentChecks/>
      <section id="faq" className="faq-section container"><div><h2>{t('Pertanyaan umum')}</h2><p className="faq-intro">{t('Fitur yang tersedia saat ini, dan hal yang perlu kamu periksa.')}</p></div><div className="faq-list">{faqs.map(([question,answer])=><details key={question}><summary>{t(question)}</summary><p>{t(answer)}</p></details>)}</div></section>
      <section className="saas-closing container"><div className="closing-inner"><LogoMark/><h2>{t('Coba dengan dokumenmu.')}</h2><p>{t('Baca. Periksa. Rapikan. Lalu bawa hasilnya ke langkah berikutnya.')}</p><div className="hero-actions"><Link href="/register" className="button primary">{t('Buka workspace Precidoc')}</Link><Link href="/sample" className="button text-button">{t('Coba dengan contoh')}</Link></div></div></section>
      <Newsletter />
    </main>
    <MarketingFooter />
  </div>;
}
