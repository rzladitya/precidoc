export type ProcessingCode = 'signature' | 'archive' | 'archive_limit' | 'active_content' | 'binary_text' | 'mime' | 'filename' | 'timeout' | 'cancelled';
const messages: Record<ProcessingCode, readonly [string, string]> = {
  signature: ['The file content does not match its extension. Export a new PDF or DOCX from the source application.', 'Isi file tidak sesuai ekstensi. Ekspor ulang PDF atau DOCX dari aplikasi asal.'],
  archive: ['This DOCX is incomplete, encrypted, or unsupported. Save a new .docx copy and try again.', 'DOCX tidak lengkap, terenkripsi, atau tidak didukung. Simpan salinan .docx baru lalu coba lagi.'],
  archive_limit: ['This DOCX expands beyond the safe processing limit. Split it or remove large embedded content.', 'DOCX ini melebihi batas aman setelah dibuka. Pisahkan dokumen atau hapus konten tertanam yang besar.'],
  active_content: ['Macro-enabled or executable content is not supported. Export a clean .docx or text-only PDF.', 'Konten makro atau executable tidak didukung. Ekspor .docx bersih atau PDF berisi teks.'],
  binary_text: ['This is not a supported text file. Save the document as UTF-8 TXT or Markdown.', 'File ini bukan teks yang didukung. Simpan dokumen sebagai TXT atau Markdown UTF-8.'],
  mime: ['The file type does not match its extension. Check the original file and export it again.', 'Tipe file tidak sesuai ekstensi. Periksa file asli lalu ekspor ulang.'],
  filename: ['Use a filename up to 240 characters without control characters.', 'Gunakan nama file hingga 240 karakter tanpa karakter kontrol.'],
  timeout: ['Processing exceeded 30 seconds. Split the document or save a simpler copy, then retry.', 'Pemrosesan melebihi 30 detik. Pisahkan dokumen atau simpan salinan yang lebih sederhana, lalu coba lagi.'],
  cancelled: ['Processing cancelled. Your existing documents are unchanged.', 'Pemrosesan dibatalkan. Dokumen yang sudah terbuka tetap tersedia.'],
};
export class ProcessingError extends Error {
  constructor(public code: ProcessingCode) { super(messages[code][0]); this.name = 'ProcessingError'; }
}
export function processingErrorText(error: unknown, locale: 'en' | 'id') {
  return error instanceof ProcessingError ? messages[error.code][locale === 'en' ? 0 : 1] : null;
}
export function assertProcessingActive(signal: AbortSignal) {
  if (signal.aborted) throw signal.reason instanceof ProcessingError ? signal.reason : new ProcessingError('cancelled');
}

// Check ZIP central-directory lengths before Mammoth inflates any content.
// This is a resource/format check, not an antivirus scan.
function validateDocx(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 22 || view.getUint32(0, true) !== 0x04034b50) throw new ProcessingError('signature');
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break; }
  }
  if (end < 0) throw new ProcessingError('archive');
  const count = view.getUint16(end + 10, true), size = view.getUint32(end + 12, true), start = view.getUint32(end + 16, true);
  if (view.getUint32(end + 4, true) !== 0 || count !== view.getUint16(end + 8, true) || count === 65535 || start + size !== end) throw new ProcessingError('archive');
  if (count > 2000) throw new ProcessingError('archive_limit');
  let offset = start, inflated = 0;
  const names = new Set<string>();
  const entries: {start: number; end: number; size: number; method: number}[] = [];
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw new ProcessingError('archive');
    const flags = view.getUint16(offset + 8, true), method = view.getUint16(offset + 10, true);
    const packed = view.getUint32(offset + 20, true), unpacked = view.getUint32(offset + 24, true);
    const length = view.getUint16(offset + 28, true), extra = view.getUint16(offset + 30, true), comment = view.getUint16(offset + 32, true);
    const local = view.getUint32(offset + 42, true);
    if (offset + 46 + length + extra + comment > end || local + 30 > start || (flags & 1) || ![0, 8].includes(method)) throw new ProcessingError('archive');
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + length));
    if (names.has(name) || name.startsWith('/') || name.includes('\\') || name.split('/').includes('..')) throw new ProcessingError('archive');
    names.add(name);
    if (/vbaProject|\.(exe|dll|js|vbs|ps1)$/i.test(name)) throw new ProcessingError('active_content');
    if (view.getUint32(local, true) !== 0x04034b50 || view.getUint16(local + 8, true) !== method || view.getUint16(local + 6, true) !== flags) throw new ProcessingError('archive');
    const localNameLength = view.getUint16(local + 26, true), localExtra = view.getUint16(local + 28, true);
    if (local + 30 + localNameLength + localExtra + packed > start || new TextDecoder().decode(bytes.subarray(local + 30, local + 30 + localNameLength)) !== name) throw new ProcessingError('archive');
    // Reject inconsistent declared sizes instead of trusting one header.
    if (!(flags & 8) && (view.getUint32(local + 18, true) !== packed || view.getUint32(local + 22, true) !== unpacked)) throw new ProcessingError('archive');
    const dataStart = local + 30 + localNameLength + localExtra;
    entries.push({start: dataStart, end: dataStart + packed, size: unpacked, method});
    inflated += unpacked;
    if (inflated > 64 * 1024 * 1024 || unpacked > 32 * 1024 * 1024 || (/\.xml$/i.test(name) && unpacked > 8 * 1024 * 1024) || (unpacked > 1024 * 1024 && unpacked / Math.max(packed, 1) > 100)) throw new ProcessingError('archive_limit');
    offset += 46 + length + extra + comment;
  }
  if (offset !== end || !names.has('[Content_Types].xml') || !names.has('word/document.xml')) throw new ProcessingError('archive');
  return entries;
}
export async function validateDocumentBytes(file: File, buffer: ArrayBuffer, signal: AbortSignal) {
  if (file.name.length > 240 || /[\u0000-\u001f\u007f\u202a-\u202e]/.test(file.name)) throw new ProcessingError('filename');
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const types: Record<string, string[]> = { pdf: ['application/pdf'], docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'], txt: ['text/plain'], md: ['text/plain', 'text/markdown', 'text/x-markdown'] };
  if (file.type && file.type !== 'application/octet-stream' && !types[ext]?.includes(file.type.split(';')[0].toLowerCase())) throw new ProcessingError('mime');
  const bytes = new Uint8Array(buffer);
  if (ext === 'pdf' && !/^%PDF-\d\.\d/.test(new TextDecoder().decode(bytes.subarray(0, 8)))) throw new ProcessingError('signature');
  if (ext === 'docx') {
    const entries = validateDocx(bytes);
    for (const entry of entries) {
      assertProcessingActive(signal);
      if (entry.method === 0) { if (entry.end - entry.start !== entry.size) throw new ProcessingError('archive'); continue; }
      // Enforce actual inflated lengths as well as declared lengths. A forged
      // central directory must not bypass the bounds before the parser runs.
      let reader: ReadableStreamDefaultReader<Uint8Array>;
      try { reader = new Blob([buffer.slice(entry.start, entry.end)]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(); }
      catch { throw new ProcessingError('archive'); }
      let size = 0;
      const cancel = () => { void reader.cancel().catch(() => {}); };
      signal.addEventListener('abort', cancel, {once: true});
      try {
        while (true) {
          assertProcessingActive(signal);
          const result = await reader.read();
          if (result.done) break;
          size += result.value.byteLength;
          if (size > entry.size || size > 32 * 1024 * 1024) throw new ProcessingError('archive_limit');
        }
        if (size !== entry.size) throw new ProcessingError('archive');
      } catch (error) { cancel(); throw error instanceof ProcessingError ? error : new ProcessingError('archive'); }
      finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
    }
  }
  if (ext === 'txt' || ext === 'md') {
    if (bytes.some(byte => byte < 32 && ![9, 10, 13].includes(byte))) throw new ProcessingError('binary_text');
    const prefix = new TextDecoder().decode(bytes.subarray(0, 8));
    if (prefix.startsWith('%PDF-') || prefix.startsWith('MZ') || (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4)) throw new ProcessingError('signature');
  }
}
