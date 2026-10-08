'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { MarketingHeader, MarketingFooter } from '@/components/marketing-shell';
import { DocumentMascot } from '@/components/document-mascot';
import { useLanguage } from '@/components/language';
import { FULL_POLICY, TRIAL_POLICY } from '@/lib/workspace-policy';

export function PricingContent() {
  const { locale } = useLanguage();
  const en = locale === 'en';
  const features = en ? ['Digital PDF, DOCX, TXT and Markdown', 'Source comparison and text editing', 'Readiness checks and configurable chunks', 'Reviewed JSON and Markdown exports'] : ['PDF digital, DOCX, TXT, dan Markdown', 'Perbandingan sumber dan edit teks', 'Pemeriksaan kesiapan dan pengaturan chunk', 'Export JSON dan Markdown setelah review'];
  const rows = [
    [en ? 'Documents per tab' : 'Dokumen per tab', TRIAL_POLICY.maxDocuments, FULL_POLICY.maxDocuments],
    [en ? 'Size per file' : 'Ukuran per file', `${TRIAL_POLICY.maxBytes / 1024 / 1024} MB`, `${FULL_POLICY.maxBytes / 1024 / 1024} MB`],
    [en ? 'Pages per PDF' : 'Halaman per PDF', TRIAL_POLICY.maxPages, FULL_POLICY.maxPages],
  ];
  const faqs = en ? [
    ['What is included in Free?', 'The current preparation workflow: extract text, inspect sources, edit content, set metadata, review chunks and export. The account workspace has the limits shown above.'],
    ['Will my documents be saved?', 'Files stay in browser memory for this tab. Refreshing or closing the tab clears the document session. Download your export before leaving.'],
    ['Does Free use an LLM?', 'The current workspace uses text extraction and rule-based checks. You do not need an AI API key. Optional LLM assistance is planned for Pro.'],
    ['Can I subscribe to Pro now?', 'Pro is not available yet. Features and pricing have not been announced, and there is no paid checkout. Contact us to discuss your workflow.'],
    ['Can I process a scanned PDF?', 'OCR is not available in the current workspace. Use a PDF with selectable text, or convert your scan with an OCR tool first and check the resulting text.'],
  ] : [
    ['Apa yang termasuk paket Free?', 'Alur persiapan saat ini: ekstraksi teks, periksa sumber, edit konten, isi metadata, review chunk, dan export. Workspace akun mengikuti batas yang ditampilkan di atas.'],
    ['Apakah dokumen akan tersimpan?', 'File berada di memori browser pada tab ini. Refresh atau menutup tab akan menghapus sesi dokumen. Unduh hasil export sebelum keluar.'],
    ['Apakah Free memakai LLM?', 'Workspace saat ini memakai ekstraksi teks dan pemeriksaan berbasis aturan. Kamu tidak memerlukan API key AI. Bantuan LLM opsional direncanakan untuk Pro.'],
    ['Apakah Pro sudah bisa dibeli?', 'Pro belum tersedia. Fitur dan harga belum diumumkan, dan belum ada checkout berbayar. Hubungi kami untuk membahas alur kerjamu.'],
    ['Apakah PDF hasil scan bisa diproses?', 'OCR belum tersedia di workspace saat ini. Gunakan PDF dengan teks yang bisa dipilih, atau konversi scan dengan alat OCR terlebih dahulu lalu periksa hasilnya.'],
  ];
  return <div className="landing saas-landing public-page"><MarketingHeader /><main className="container public-main">
    <header className="public-intro"><span className="public-eyebrow">{en ? 'PRICING' : 'PAKET & HARGA'}</span><h1>{en ? 'Start free.' : 'Mulai gratis.'}<br /><span>{en ? 'Bring your first document.' : 'Bawa dokumen pertamamu.'}</span></h1><p>{en ? 'Extract the text, check it against the source, and take a reviewed export into your next step.' : 'Ekstrak teks, periksa dengan sumbernya, lalu bawa hasil export yang sudah ditinjau ke langkah berikutnya.'}</p></header>
    <section className="pricing-plans" aria-label={en ? 'Plans' : 'Paket'}>
      <article className="pricing-free"><div className="plan-heading"><span>{en ? 'Your document workspace' : 'Workspace dokumenmu'}</span><span>{en ? 'Available today' : 'Tersedia sekarang'}</span></div><h2 className="plan-price">Free</h2><p className="plan-description">{en ? 'A workspace for preparing and reviewing your own documents.' : 'Workspace untuk menyiapkan dan memeriksa dokumenmu sendiri.'}</p><Link href="/register" className="button primary plan-cta">{en ? 'Create a free account' : 'Buat akun gratis'}<ArrowRight size={17} aria-hidden="true" /></Link><small className="plan-note">{en ? 'No card required. No AI API key needed.' : 'Tanpa kartu pembayaran. Tanpa API key AI.'}</small><ul className="plan-features">{features.map(feature => <li key={feature}><Check size={17} aria-hidden="true" />{feature}</li>)}</ul><div className="plan-limits"><span><strong>{FULL_POLICY.maxBytes / 1024 / 1024} MB</strong>per file</span><span><strong>{FULL_POLICY.maxPages}</strong>{en ? 'pages / PDF' : 'halaman / PDF'}</span><span><strong>{FULL_POLICY.maxDocuments}</strong>{en ? 'documents / tab' : 'dokumen / tab'}</span></div></article>
      <article className="pricing-pro"><div className="plan-heading"><h2>Pro</h2><span>{en ? 'Coming soon' : 'Segera hadir'}</span></div><h3>{en ? 'An LLM engine for your next review.' : 'LLM engine untuk review berikutnya.'}</h3><p>{en ? 'We plan to add optional assistance using Claude from Anthropic, starting with content classification and metadata suggestions.' : 'Kami merencanakan bantuan opsional dengan Claude dari Anthropic, dimulai dari klasifikasi konten dan saran metadata.'}</p><div className="pro-engine"><span className="engine-monogram" aria-hidden="true">C</span><div><strong>Claude · Anthropic</strong><span>{en ? 'Planned LLM integration' : 'Rencana integrasi LLM'}</span></div></div><p className="pro-status">{en ? 'The current workspace does not call an LLM. Pro features and pricing will be announced when the package is ready.' : 'Workspace saat ini belum memanggil LLM. Fitur dan harga Pro akan diumumkan setelah paketnya siap.'}</p><a className="button outline" href="mailto:admin@rainc.web.id?subject=Precidoc%20Pro">{en ? 'Discuss Pro for your workflow' : 'Diskusikan Pro untuk kebutuhanmu'}<ArrowRight size={16} aria-hidden="true" /></a><div className="pro-document-note"><DocumentMascot state="review" /><span>{en ? 'Your source text stays at the centre of the review.' : 'Teks sumber tetap menjadi acuan saat review.'}</span></div></article>
    </section>
    <section className="pricing-comparison"><div><span className="public-eyebrow">{en ? 'TRY IT FIRST' : 'COBA TERLEBIH DAHULU'}</span><h2>{en ? 'A sample, or your own workspace.' : 'Contoh, atau workspace milikmu.'}</h2><p>{en ? 'Try the preparation flow without signing in. Create a free account when you need room for more documents.' : 'Coba alur persiapan tanpa login. Buat akun gratis saat kamu memerlukan ruang untuk lebih banyak dokumen.'}</p><Link href="/sample" className="public-text-link">{en ? 'Open the sample workspace' : 'Buka workspace contoh'}<ArrowRight size={16} aria-hidden="true" /></Link></div><table><caption className="sr-only">{en ? 'Sample and free account limits' : 'Batas contoh dan akun gratis'}</caption><thead><tr><th scope="col">{en ? 'Usage' : 'Penggunaan'}</th><th scope="col">{en ? 'Without account' : 'Tanpa akun'}</th><th scope="col">{en ? 'Free account' : 'Akun gratis'}</th></tr></thead><tbody>{rows.map(([label, trial, full]) => <tr key={label}><th scope="row">{label}</th><td>{trial}</td><td>{full}</td></tr>)}</tbody></table></section>
    <section className="pricing-faq"><div><h2>{en ? 'Before you start.' : 'Sebelum mulai.'}</h2><p>{en ? 'A few details about the current workspace.' : 'Beberapa hal tentang workspace saat ini.'}</p></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
  </main><MarketingFooter /></div>;
}
