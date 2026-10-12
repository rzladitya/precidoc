export const pageTitles = {
  notfound:['Page Not Found','Halaman Tidak Ditemukan'], error:['Page Unavailable','Halaman Belum Tersedia'],
  product: ['Product & Capabilities', 'Produk & Kemampuan'], privacy: ['Privacy Policy', 'Kebijakan Privasi'], terms: ['Terms of Use', 'Ketentuan Penggunaan'], support: ['Support & FAQ', 'Bantuan & FAQ'], changelog: ['Product Changelog', 'Pembaruan Produk'],
  home: ['Prepare Documents for AI', 'Siapkan Dokumen untuk AI'],
  signin: ['Sign In', 'Masuk'], signup: ['Create an Account', 'Buat Akun'], verify: ['Verify Your Email', 'Verifikasi Email'],
  sample: ['Sample Workspace', 'Workspace Contoh'], workspace: ['Document Workspace', 'Workspace Dokumen'],
  signout: ['Sign Out', 'Keluar'], forgot: ['Reset Your Password', 'Atur Ulang Kata Sandi'], reset: ['Set a New Password', 'Buat Kata Sandi Baru'], profile: ['Complete Your Account', 'Lengkapi Akun'],
  pricing: ['Plans & Pricing', 'Paket & Harga'], blog: ['Document Preparation Guides', 'Panduan Persiapan Dokumen'],
  pdfguide: ['Check a PDF Before It Enters Your Knowledge Base', 'Periksa PDF Sebelum Masuk Knowledge Base'],
  chunkguide: ['Split a Runbook Without Losing the Steps', 'Membagi Runbook Tanpa Memisahkan Langkah Penting'],
  exportguide: ['What to Keep in a Document Export', 'Yang Perlu Disertakan Saat Export Dokumen'],
  unsubscribe: ['Newsletter Preferences', 'Pengaturan Newsletter'],
} as const;
export type PageTitle = keyof typeof pageTitles;
export const pageDescriptions = {
  en: 'Prepare documents for AI with explainable readiness checks, source references, and reviewed JSON or Markdown exports.',
  id: 'Siapkan dokumen untuk AI dengan pemeriksaan kesiapan, referensi sumber, dan export JSON atau Markdown yang sudah ditinjau.',
};
const specificDescriptions: Partial<Record<PageTitle, readonly [string, string]>> = {
  product: ['Review locally extracted document text, inspect source references and prepare reviewed chunks. Compare the anonymous demo and registered Free workspace.', 'Periksa teks yang dibaca secara lokal, telusuri referensi sumber, dan siapkan chunk yang ditinjau. Bandingkan demo anonim dan workspace Free terdaftar.'],
  privacy: ['How Precidoc handles local documents, account data, optional statistics and email subscriptions, including retention and deletion requests.', 'Cara Precidoc menangani dokumen lokal, data akun, statistik opsional, dan langganan email, termasuk penyimpanan sementara serta permintaan penghapusan.'],
  terms: ['Terms for using Precidoc, reviewing document output and managing temporary workspace data. Free plan limits and planned features.', 'Ketentuan penggunaan Precidoc, pemeriksaan hasil dokumen, dan pengelolaan data workspace sementara. Batas paket Free dan fitur yang direncanakan.'],
  support: ['Get help with supported files, extraction errors, review approval, exports, registration and email verification in Precidoc.', 'Bantuan untuk format file, error ekstraksi, persetujuan review, ekspor, pendaftaran, dan verifikasi email Precidoc.'],
  changelog: ['Released Precidoc changes and current limitations. Planned capabilities are identified separately from available features.', 'Pembaruan Precidoc yang tersedia dan batas saat ini. Kemampuan yang direncanakan dibedakan dari fitur yang sudah tersedia.'],
  pricing: ['Start with the Free Precidoc workspace. Compare usage limits and learn about the planned Pro package with optional LLM assistance.', 'Mulai dengan workspace Free Precidoc. Bandingkan batas penggunaan dan lihat rencana paket Pro dengan bantuan LLM opsional.'],
  blog: ['Practical guides to reviewing PDF extraction, splitting runbooks and keeping source references in document exports.', 'Panduan praktis untuk memeriksa ekstraksi PDF, membagi runbook, dan menyertakan referensi sumber saat export dokumen.'],
  pdfguide: ['Check text selection, reading order, table values and source references before using a PDF in your knowledge base.', 'Periksa teks yang dapat dipilih, urutan baca, nilai tabel, dan referensi sumber sebelum memakai PDF di knowledge base.'],
  chunkguide: ['Review runbook chunks so prerequisites, steps and checks stay understandable with their source references.', 'Periksa chunk runbook agar prasyarat, langkah, dan pemeriksaan tetap bisa dipahami bersama referensi sumbernya.'],
  exportguide: ['Keep document metadata, reviewed text and source references together when exporting JSON or Markdown.', 'Sertakan metadata dokumen, teks yang ditinjau, dan referensi sumber saat export JSON atau Markdown.'],
};
export const getPageDescription = (page: PageTitle, locale: 'en' | 'id') => specificDescriptions[page]?.[locale === 'en' ? 0 : 1] ?? pageDescriptions[locale];
const routes: Record<string, PageTitle> = {
  '/product':'product','/privacy':'privacy','/terms':'terms','/support':'support','/changelog':'changelog',
  '/sample': 'sample', '/app': 'workspace', '/register': 'signup', '/auth/sign-in': 'signin', '/auth/sign-out': 'signout', '/auth/forgot-password': 'forgot', '/auth/reset-password': 'reset',
  '/pricing': 'pricing', '/blog': 'blog', '/blog/check-pdf-extraction': 'pdfguide', '/blog/chunk-runbooks-with-context': 'chunkguide', '/blog/export-with-source-references': 'exportguide',
  '/newsletter/unsubscribe': 'unsubscribe',
};
export const getPageTitleForPath = (path: string | null): PageTitle => routes[path ?? '/'] ?? 'home';
const privatePages = new Set<PageTitle>(['signin','signup','verify','workspace','signout','forgot','reset','profile','unsubscribe','notfound','error']);
export const pageMetadata = (page: PageTitle) => {
  const path = page === 'home' ? '/' : Object.entries(routes).find(([, title]) => title === page)?.[0];
  const title = `${pageTitles[page][0]} | Precidoc`;
  const description = getPageDescription(page, 'en');
  return {
    title, description,
    ...(path ? { alternates: { canonical: path }, openGraph: { title, description, url: path, type: 'website' as const, siteName: 'Precidoc' } } : {}),
    ...(privatePages.has(page) ? { robots: { index: false, follow: false } } : {}),
  };
};
