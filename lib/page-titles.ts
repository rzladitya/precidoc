export const pageTitles = {
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
  pricing: ['Start with the Free Precidoc workspace. Compare usage limits and learn about the planned Pro package with optional LLM assistance.', 'Mulai dengan workspace Free Precidoc. Bandingkan batas penggunaan dan lihat rencana paket Pro dengan bantuan LLM opsional.'],
  blog: ['Practical guides to reviewing PDF extraction, splitting runbooks and keeping source references in document exports.', 'Panduan praktis untuk memeriksa ekstraksi PDF, membagi runbook, dan menyertakan referensi sumber saat export dokumen.'],
  pdfguide: ['Check text selection, reading order, table values and source references before using a PDF in your knowledge base.', 'Periksa teks yang dapat dipilih, urutan baca, nilai tabel, dan referensi sumber sebelum memakai PDF di knowledge base.'],
  chunkguide: ['Review runbook chunks so prerequisites, steps and checks stay understandable with their source references.', 'Periksa chunk runbook agar prasyarat, langkah, dan pemeriksaan tetap bisa dipahami bersama referensi sumbernya.'],
  exportguide: ['Keep document metadata, reviewed text and source references together when exporting JSON or Markdown.', 'Sertakan metadata dokumen, teks yang ditinjau, dan referensi sumber saat export JSON atau Markdown.'],
};
export const getPageDescription = (page: PageTitle, locale: 'en' | 'id') => specificDescriptions[page]?.[locale === 'en' ? 0 : 1] ?? pageDescriptions[locale];
const routes: Record<string, PageTitle> = {
  '/sample': 'sample', '/app': 'workspace', '/register': 'signup', '/auth/sign-in': 'signin', '/auth/sign-out': 'signout', '/auth/forgot-password': 'forgot', '/auth/reset-password': 'reset',
  '/pricing': 'pricing', '/blog': 'blog', '/blog/check-pdf-extraction': 'pdfguide', '/blog/chunk-runbooks-with-context': 'chunkguide', '/blog/export-with-source-references': 'exportguide',
  '/newsletter/unsubscribe': 'unsubscribe',
};
export const getPageTitleForPath = (path: string | null): PageTitle => routes[path ?? '/'] ?? 'home';
export const pageMetadata = (page: PageTitle) => ({ title: `${pageTitles[page][0]} | Precidoc`, description: getPageDescription(page, 'en') });
