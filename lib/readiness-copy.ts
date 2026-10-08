import type {Locale} from './i18n';
export function readinessCopy(locale:Locale) {
  const en=locale==='en';
  return {
    components:en?{text:'Extracted text coverage',metadata:'Title, version and category',duplicates:'Distinct source sections',provenance:'Chunk source references',review:'User review'}:{text:'Cakupan teks ekstraksi',metadata:'Judul, versi, dan kategori',duplicates:'Keunikan bagian sumber',provenance:'Referensi sumber chunk',review:'Review pengguna'},
    status:en?{'blocked':'Fix blockers first','needs-review':'Review required','prepared':'Prepared for handoff','needs-improvement':'Complete preparation checks'}:{'blocked':'Perbaiki penghambat','needs-review':'Perlu review','prepared':'Siap diteruskan','needs-improvement':'Lengkapi persiapan'},
    unassessed:en?{'semantic-quality':'semantic quality','retrieval-accuracy':'retrieval accuracy',pii:'personal data',language:'language',ocr:'OCR','pdf-table-layout':'PDF table/layout fidelity'}:{'semantic-quality':'kualitas semantik','retrieval-accuracy':'akurasi retrieval',pii:'data pribadi',language:'bahasa',ocr:'OCR','pdf-table-layout':'ketepatan tabel/layout PDF'},
  };
}
