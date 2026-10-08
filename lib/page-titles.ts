export const pageTitles = {
  home: ['Prepare Documents for AI', 'Siapkan Dokumen untuk AI'],
  signin: ['Sign In', 'Masuk'], signup: ['Create an Account', 'Buat Akun'], verify: ['Verify Your Email', 'Verifikasi Email'],
  sample: ['Sample Workspace', 'Workspace Contoh'], workspace: ['Document Workspace', 'Workspace Dokumen'],
  signout: ['Sign Out', 'Keluar'], forgot: ['Reset Your Password', 'Atur Ulang Kata Sandi'], reset: ['Set a New Password', 'Buat Kata Sandi Baru'], profile: ['Complete Your Account', 'Lengkapi Akun'],
} as const;
export type PageTitle = keyof typeof pageTitles;
export const pageDescriptions = {
  en: 'Prepare documents for AI with explainable readiness checks, source references, and reviewed JSON or Markdown exports.',
  id: 'Siapkan dokumen untuk AI dengan pemeriksaan kesiapan, referensi sumber, dan export JSON atau Markdown yang sudah ditinjau.',
};
export const pageMetadata = (page: PageTitle) => ({title: `${pageTitles[page][0]} | Precidoc`, description: pageDescriptions.en});
