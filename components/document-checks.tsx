'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from './language';
import { makeLocalizedSample } from '@/lib/sample';

export function DocumentChecks() {
  const { locale } = useLanguage();
  const en = locale === 'en';
  const sample = makeLocalizedSample(locale);
  const section = sample.units[2];
  const lines = section.original.split('\n');
  const steps = lines.filter(line => /^\d+\. /.test(line)).map(line => line.replace(/^\d+\. /, ''));
  const table = lines.filter(line => line.startsWith('|') && !line.includes('---'))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));
  const tableCount = sample.units.reduce((count, unit) => count + unit.tableCount, 0);
  const actions = en ? [
    { title: 'Compare the text with its source', text: 'Read the original beside the extracted text. Correct a section before it becomes part of your knowledge base.', link: 'Open source comparison', tab: 'source' },
    { title: 'See how the text is split', text: 'Inspect each chunk and its page or section reference. Adjust the size and merge repeated sections in your workspace.', link: 'Inspect the chunks', tab: 'chunks' },
    { title: 'Download the reviewed document', text: 'Confirm your review, then export JSON or Markdown with the document metadata and source references.', link: 'See the export', tab: 'export' },
  ] : [
    { title: 'Bandingkan teks dengan sumbernya', text: 'Baca dokumen asli di samping teks ekstraksi. Koreksi bagian yang perlu diperbaiki sebelum masuk ke knowledge base.', link: 'Buka perbandingan sumber', tab: 'source' },
    { title: 'Lihat pembagian teksnya', text: 'Periksa setiap chunk dan referensi halaman atau bagiannya. Atur ukuran dan gabungkan bagian berulang di workspace kamu.', link: 'Periksa chunk', tab: 'chunks' },
    { title: 'Unduh dokumen yang sudah diperiksa', text: 'Konfirmasi review, lalu export JSON atau Markdown beserta metadata dokumen dan referensi sumber.', link: 'Lihat hasil export', tab: 'export' },
  ];

  return <section id="fitur" className="document-checks container" aria-labelledby="document-checks-heading">
    <span id="cara-kerja" className="document-checks-anchor" aria-hidden="true" />
    <div className="document-checks-heading">
      <span>{en ? 'DOCUMENT REVIEW' : 'REVIEW DOKUMEN'}</span>
      <h2 id="document-checks-heading">{en ? 'Check the text against the source.' : 'Periksa teks dengan dokumen aslinya.'}</h2>
      <p>{en ? `This example contains ${sample.units.length} sections and ${tableCount} ${tableCount === 1 ? 'table' : 'tables'}. Open it in the sample workspace to compare the text with its source.` : `Contoh ini berisi ${sample.units.length} bagian dan ${tableCount} tabel. Buka di workspace contoh untuk membandingkan teks dengan sumbernya.`}</p>
    </div>
    <div className="document-checks-body">
      <figure className="review-document">
        <figcaption className="review-document-file">
          <span>{en ? 'EXAMPLE DOCUMENT' : 'DOKUMEN CONTOH'}</span>
          <strong>{sample.name}</strong>
        </figcaption>
        <div className="review-document-text">
          <div className="review-document-section"><span>{section.id}</span><span>{en ? 'Extracted text' : 'Teks ekstraksi'}</span></div>
          <h3>{section.title}</h3>
          <ol>{steps.map(step => <li key={step}>{step}</li>)}</ol>
          <table>
            <caption>{en ? 'Parameters from this section' : 'Parameter dari bagian ini'}</caption>
            <thead><tr>{table[0].map(cell => <th scope="col" key={cell}>{cell}</th>)}</tr></thead>
            <tbody>{table.slice(1).map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <dl className="review-document-checks">
          <div><dt>{en ? 'Version' : 'Versi'}</dt><dd className="review-value-warning">{sample.version || (en ? 'Not set' : 'Belum diisi')}</dd></div>
          <div><dt>{en ? 'Tables to review' : 'Tabel untuk review'}</dt><dd>{tableCount}</dd></div>
          <div><dt>{en ? 'Source sections' : 'Bagian sumber'}</dt><dd>{sample.units.length}</dd></div>
        </dl>
        <div className="review-document-foot"><span>{en ? 'From the built-in sample runbook' : 'Dari runbook contoh Precidoc'}</span><Link href="/sample?tab=source">{en ? 'Open sample' : 'Buka contoh'}<ArrowRight size={14} aria-hidden="true"/></Link></div>
      </figure>
      <div className="document-review-actions">{actions.map(action => <article key={action.tab}>
        <h3>{action.title}</h3>
        <p>{action.text}</p>
        <Link href={`/sample?tab=${action.tab}`}>{action.link}<ArrowRight size={15} aria-hidden="true"/></Link>
      </article>)}</div>
    </div>
  </section>;
}
