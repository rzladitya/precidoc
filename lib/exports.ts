import { makePackage, type Chunk, type PreparedDocument } from './documents';
import { readinessCopy } from './readiness-copy';
import { translate, type Locale } from './i18n';

// Translate generated labels and checks, preserving document text and user metadata.
export function localizedPackage(doc: PreparedDocument, chunks: Chunk[], locale: Locale) {
  const result = makePackage(doc, chunks);
  return {
    ...result,
    document: {
      ...result.document,
      category: translate(doc.category, locale),
      sourceUnits: result.document.sourceUnits.map(unit => ({ ...unit, title: unit.page ? translate(`Halaman ${unit.page}`, locale) : unit.title })),
    },
    checks: result.checks.map(check => ({ ...check, title: translate(check.title, locale), detail: translate(check.detail, locale) })),
    chunks: chunks.map(chunk => ({ ...chunk, title: doc.format === 'PDF' && chunk.sources[0]?.page ? translate(`Halaman ${chunk.sources[0].page}`, locale) : chunk.title })),
  };
}

export function localizedMarkdown(doc: PreparedDocument, chunks: Chunk[], locale: Locale) {
  const en = locale === 'en';
  const label = en ? { version: 'Version', type: 'Type', reviewed: 'Reviewed by you', missing: 'Not provided', yes: 'Yes', no: 'No', source: 'Source', edited: 'Text edited by you' }
    : { version: 'Versi', type: 'Jenis', reviewed: 'Ditinjau pengguna', missing: 'Belum diisi', yes: 'Ya', no: 'Tidak', source: 'Sumber', edited: 'Teks telah diedit pengguna' };
  const prepared = localizedPackage(doc, chunks, locale);
  const report = prepared.readiness;
  const copy = readinessCopy(locale);
  const readiness = `## Knowledge Readiness Score\n\n${report.score}/100 · ${copy.status[report.status as keyof typeof copy.status]} · ${report.method}\n\n${report.components.map(component => `- ${copy.components[component.id as keyof typeof copy.components]}: ${component.score}/100 (${component.weight}%)`).join('\n')}\n\n${en ? 'Not assessed' : 'Belum dinilai'}: ${report.notAssessed.map(value => copy.unassessed[value as keyof typeof copy.unassessed]).join(', ')}. ${en ? 'Preparation checklist only; not a retrieval benchmark.' : 'Hanya checklist persiapan; bukan benchmark retrieval.'}\n\n`;
  return `# ${doc.title}\n\n- File: ${doc.name}\n- ${label.version}: ${doc.version || label.missing}\n- ${label.type}: ${prepared.document.category}\n- ${label.reviewed}: ${doc.approved ? label.yes : label.no}\n\n` + readiness + prepared.chunks.map((chunk, i) =>
    `## Chunk ${i + 1}: ${chunk.title}\n\n${chunk.text}\n\n${label.source}: ${chunk.sources.map(source => source.page ? `${translate(`halaman ${source.page}`, locale)} (${source.unitId})` : source.unitId).join(', ')}${chunk.edited ? ` · ${label.edited}` : ''}\n`
  ).join('\n');
}
