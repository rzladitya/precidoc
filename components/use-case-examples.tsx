'use client';
import Link from 'next/link';
import { useLanguage } from './language';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function UseCaseExamples() {
  const { locale } = useLanguage();
  const c = (en: string, id: string) => locale === 'en' ? en : id;
  const examples = [
    { id: 'rag', label: 'RAG', title: c('Keep the source with the chunk.', 'Sertakan sumber pada chunk.'),
      before: c('Restore the latest backup.\n\nWhere did this instruction come from?', 'Pulihkan backup terbaru.\n\nDari mana instruksi ini berasal?'),
      after: c('Title: Database recovery\nSection: Recovery procedure\n\n1. Verify the backup.\n2. Restore the approved snapshot.\n\nSource: section_03 · edited by reviewer', 'Judul: Pemulihan database\nBagian: Prosedur pemulihan\n\n1. Verifikasi backup.\n2. Pulihkan snapshot yang disetujui.\n\nSumber: section_03 · diedit peninjau'),
      note: c('Review the prerequisites with the procedure, then export referenced chunks for your retrieval pipeline. Precidoc does not create embeddings or measure retrieval accuracy.', 'Periksa prasyarat bersama prosedur, lalu ekspor chunk dengan referensi untuk pipeline retrieval kamu. Precidoc belum membuat embedding atau mengukur akurasi retrieval.'),
      tab: 'chunks' },
    { id: 'knowledge', label: c('Knowledge base', 'Basis pengetahuan'), title: c('Make the version clear before sharing.', 'Perjelas versi sebelum dibagikan.'),
      before: c('Leave policy.docx\nVersion: missing\nCategory: unspecified', 'Kebijakan cuti.docx\nVersi: belum diisi\nJenis: belum ditentukan'),
      after: c('Title: Leave policy\nVersion: v1.2 — confirmed against the source\nCategory: Policy\nSource: section_02\nReviewed by user: true', 'Judul: Kebijakan cuti\nVersi: v1.2 — dicocokkan dengan sumber\nJenis: Kebijakan\nSumber: section_02\nDitinjau pengguna: ya'),
      note: c('A registered Free workspace lets you fill in metadata and export JSON. Confirm values yourself; Precidoc does not invent missing metadata or connect directly to your knowledge base.', 'Workspace Free terdaftar mendukung pengisian metadata dan ekspor JSON. Konfirmasi nilai sendiri; Precidoc tidak mengarang metadata yang hilang atau terhubung langsung ke basis pengetahuan.'),
      tab: 'overview' },
    { id: 'extraction', label: c('Extraction review', 'Review ekstraksi'), title: c('Check the number against the original.', 'Cocokkan angka dengan dokumen asli.'),
      before: c('Replication lag 30Free disk20%', 'Lag replikasi 30Disk kosong20%'),
      after: c('| Parameter | Limit |\n| --- | --- |\n| Replication lag | 30 seconds |\n| Free disk | 20% |\n\nSource: page 1 · manually reviewed', '| Parameter | Batas |\n| --- | --- |\n| Lag replikasi | 30 detik |\n| Disk kosong | 20% |\n\nSumber: halaman 1 · ditinjau manual'),
      note: c('Open the PDF preview, compare the table and edit the extracted text. This example shows a manual correction; automatic PDF table reconstruction and OCR are unavailable.', 'Buka pratinjau PDF, bandingkan tabel, lalu edit teks ekstraksi. Contoh ini memperlihatkan koreksi manual; rekonstruksi tabel PDF otomatis dan OCR belum tersedia.'),
      tab: 'source' },
  ];
  return <section className="use-case-examples container" aria-labelledby="use-cases-heading">
    <header><span className="public-eyebrow">{c('FROM INPUT TO REVIEWED OUTPUT', 'DARI INPUT KE HASIL YANG DITINJAU')}</span><h2 id="use-cases-heading">{c('Three things to check before the next step.', 'Tiga hal yang diperiksa sebelum langkah berikutnya.')}</h2><p>{c('Illustrative before/after examples. Corrections and metadata are supplied by the reviewer, not an LLM.', 'Contoh sebelum/sesudah sebagai ilustrasi. Koreksi dan metadata diisi peninjau, bukan LLM.')}</p></header>
    <Tabs defaultValue="rag"><TabsList aria-label={c('Document use cases', 'Contoh penggunaan dokumen')}>{examples.map(example => <TabsTrigger key={example.id} value={example.id}>{example.label}</TabsTrigger>)}</TabsList>
      {examples.map(example => <TabsContent key={example.id} value={example.id}><h3>{example.title}</h3><div className="before-after"><figure><figcaption>{c('Before review', 'Sebelum review')}</figcaption><pre>{example.before}</pre></figure><figure><figcaption>{c('After manual review', 'Setelah review manual')}</figcaption><pre>{example.after}</pre></figure></div><p>{example.note}</p><Link className="button outline" href={`/sample?tab=${example.tab}`}>{c('Try this step in the sample', 'Coba langkah ini di workspace contoh')}</Link></TabsContent>)}
    </Tabs>
  </section>;
}
