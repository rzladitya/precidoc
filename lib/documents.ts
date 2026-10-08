export type SourceUnit={id:string,title:string,original:string,text:string,page?:number,tableCount:number};
export type PreparedDocument={id:string,name:string,format:string,bytes:number,hash:string,title:string,version:string,category:string,units:SourceUnit[],notes:string[],approved:boolean,objectUrl?:string,sample?:boolean};
export type Finding={id:string,title:string,detail:string,severity:'warning'|'info'|'blocker',unitId?:string};
export type Chunk={id:string,title:string,text:string,estimatedTokens:number,sources:{unitId:string,page?:number}[],edited:boolean};
export const MAX_BYTES=15*1024*1024;
export const MAX_CHARACTERS=750000;
export function normalize(text:string){return text.replace(/\r\n?/g,'\n').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim()}
export function tokenEstimate(text:string){return Math.ceil(text.length/4)}
export function splitText(text:string,maxChars:number){
  if(!Number.isFinite(maxChars)||maxChars<200)throw new Error('Ukuran chunk tidak valid.');
  const pieces:string[]=[];let rest=text.trim();
  while(rest.length>maxChars){let cut=rest.lastIndexOf('\n',maxChars);if(cut<maxChars*.5)cut=rest.lastIndexOf(' ',maxChars);if(cut<maxChars*.5)cut=maxChars;pieces.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim()}
  if(rest)pieces.push(rest);return pieces;
}
export function buildChunks(doc:PreparedDocument,maxChars=2000,deduplicate=true):Chunk[]{
  const chunks:Chunk[]=[];const seen=new Map<string,number[]>();
  for(const unit of doc.units){const body=normalize(unit.text);if(!body)continue;
    const key=normalize(`${unit.title}\n${body}`);
    if(deduplicate&&seen.has(key)){for(const index of seen.get(key)!){chunks[index].sources.push({unitId:unit.id,page:unit.page});chunks[index].edited ||= unit.text!==unit.original}continue}
    const indices:number[]=[];
    splitText(body,maxChars).forEach((part,i)=>{indices.push(chunks.length);chunks.push({id:`${doc.id}_${unit.id}_${i+1}`,title:unit.title,text:part,estimatedTokens:tokenEstimate(part),sources:[{unitId:unit.id,page:unit.page}],edited:unit.text!==unit.original})});
    seen.set(key,indices);
  }
  return chunks;
}
export function findings(doc:PreparedDocument):Finding[]{
  const out:Finding[]=[];
  if(!doc.title.trim())out.push({id:'title',title:'Judul dokumen kosong',detail:'Isi judul sebelum menyetujui dan mengekspor hasil.',severity:'blocker'});
  if(!doc.version.trim())out.push({id:'version',title:'Versi dokumen belum diisi',detail:'Tambahkan versi yang tercantum pada dokumen, atau tentukan versi bersama pemilik dokumen.',severity:'warning'});
  for(const unit of doc.units){if(!unit.text.trim())out.push({id:`empty-${unit.id}`,title:unit.page?`Halaman ${unit.page} tidak memiliki teks`:`${unit.title} kosong`,detail:doc.format==='PDF'?'Halaman bisa berupa scan, gambar, atau kosong. Periksa sumber; OCR otomatis belum tersedia.':'Periksa apakah ada isi yang belum berhasil diekstrak.',severity:'blocker',unitId:unit.id});
    if(/\uFFFD/.test(unit.text))out.push({id:`encoding-${unit.id}`,title:`Karakter tidak terbaca pada ${unit.title}`,detail:'Periksa simbol, angka, dan kata yang mengandung karakter pengganti (�).',severity:'warning',unitId:unit.id});}
  const texts=doc.units.map(u=>normalize(u.text)).filter(Boolean);const duplicates=texts.length-new Set(texts).size;
  if(duplicates)out.push({id:'duplicates',title:`${duplicates} bagian dengan teks identik`,detail:'Periksa apakah pengulangan memang diperlukan. Penggabungan chunk mempertahankan semua referensi sumber.',severity:'warning'});
  if(doc.format==='PDF')out.push({id:'pdf-layout',title:'Urutan baca dan tabel PDF perlu diperiksa',detail:'Ekstraksi teks belum memulihkan tabel dan layout multi-kolom secara andal. Bandingkan dengan file asli.',severity:'info'});
  if(doc.units.some(u=>u.tableCount>0))out.push({id:'tables',title:'Periksa tabel hasil ekstraksi',detail:'Verifikasi header, angka, satuan, dan hubungan baris dengan dokumen asli.',severity:'info'});
  doc.notes.forEach((note,i)=>out.push({id:`note-${i}`,title:'Catatan ekstraksi',detail:note,severity:'info'}));return out;
}
function markdownTable(table:Element){const rows=Array.from(table.querySelectorAll('tr')).map(row=>Array.from(row.querySelectorAll('th,td')).map(c=>(c.textContent??'').trim().replace(/\|/g,'\\|').replace(/\n/g,' ')));if(!rows.length)return '';const width=Math.max(...rows.map(r=>r.length));const fill=(r:string[])=>Array.from({length:width},(_,i)=>r[i]??'');return [fill(rows[0]),Array(width).fill('---'),...rows.slice(1).map(fill)].map(r=>`| ${r.join(' | ')} |`).join('\n')}
function textUnits(text:string){const lines=text.replace(/\r\n?/g,'\n').split('\n');const units:SourceUnit[]=[];let title='Dokumen';let current:string[]=[];
  const flush=()=>{const body=normalize(current.join('\n'));if(body)units.push({id:`section_${String(units.length+1).padStart(2,'0')}`,title,original:body,text:body,tableCount:body.includes('| ---')?1:0});current=[]};
  for(const line of lines){if(/^#{1,6}\s/.test(line)){flush();title=line.replace(/^#{1,6}\s+/,'').trim()}current.push(line)}flush();
  if(!units.length)units.push({id:'section_01',title:'Dokumen',original:'',text:'',tableCount:0});return units;
}
export type ParseLimits = {maxBytes?:number;maxPages?:number;maxCharacters?:number};
export async function parseFile(file:File,onProgress:(message:string)=>void,limits:ParseLimits={}):Promise<PreparedDocument>{
  const maxBytes=limits.maxBytes??MAX_BYTES;const maxPages=limits.maxPages??200;const maxCharacters=limits.maxCharacters??MAX_CHARACTERS;
  const ext=file.name.split('.').pop()?.toLowerCase();if(!['pdf','docx','txt','md'].includes(ext??''))throw new Error(`${file.name}: gunakan PDF, DOCX, TXT, atau MD.`);
  if(!file.size)throw new Error(`${file.name}: file kosong.`);if(file.size>maxBytes)throw new Error(`${file.name}: ukuran maksimal ${maxBytes/(1024*1024)} MB.`);
  const buffer=await file.arrayBuffer();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const notes:string[]=[];let units:SourceUnit[]=[];
  if(ext==='pdf'){
    const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
    const loading=pdfjs.getDocument({data:new Uint8Array(buffer),useSystemFonts:true,cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/'});
    try{const pdf=await loading.promise;if(pdf.numPages>maxPages)throw new Error(`Maksimal ${maxPages} halaman per PDF. Pisahkan dokumen terlebih dahulu.`);
      let extractedSize=0;
      for(let n=1;n<=pdf.numPages;n++){onProgress(`Membaca ${file.name} · halaman ${n}/${pdf.numPages}`);const page=await pdf.getPage(n);const content=await page.getTextContent();let original='';
        for(const item of content.items){if('str'in item){original+=item.str+(item.hasEOL?'\n':' ');}}
        original=normalize(original);extractedSize+=original.length;if(extractedSize>maxCharacters)throw new Error('Dokumen terlalu panjang. Pisahkan menjadi beberapa file.');
        units.push({id:`page_${n}`,title:`Halaman ${n}`,page:n,original,text:original,tableCount:0});page.cleanup();
      }
    }catch(error){if(error instanceof Error&&error.name==='PasswordException')throw new Error('PDF dilindungi password. Gunakan salinan PDF yang sudah dibuka.');throw error}finally{await loading.destroy()}
  }else if(ext==='docx'){
    const {default:mammoth}=await import('mammoth/mammoth.browser.js');
    onProgress(`Membaca struktur ${file.name}`);const result=await mammoth.convertToHtml({arrayBuffer:buffer},{convertImage:mammoth.images.imgElement(async()=>({src:''}))});
    const html=new DOMParser().parseFromString(result.value,'text/html');let title='Dokumen';let parts:string[]=[];let tables=0;
    const flush=()=>{const text=normalize(parts.join('\n\n'));if(text)units.push({id:`section_${String(units.length+1).padStart(2,'0')}`,title,original:text,text,tableCount:tables});parts=[];tables=0};
    for(const element of Array.from(html.body.children)){
      if(/^H[1-6]$/.test(element.tagName)){flush();title=(element.textContent??'').trim();parts.push(`${'#'.repeat(Number(element.tagName[1]))} ${title}`)}
      else if(element.tagName==='TABLE'){parts.push(markdownTable(element));tables++}
      else if(element.tagName==='UL'||element.tagName==='OL'){parts.push(Array.from(element.children).map((item,i)=>`${element.tagName==='OL'?`${i+1}.`:'-'} ${item.textContent??''}`).join('\n'))}
      else{parts.push(element.textContent??'')}
    }flush();if(!units.length)units=[{id:'section_01',title,original:'',text:'',tableCount:0}];
    const images=html.querySelectorAll('img').length;if(images)notes.push(`${images} gambar tidak diekstrak sebagai pengetahuan. Periksa file asli.`);
    if(result.messages.length)notes.push('Konversi DOCX melaporkan beberapa elemen atau style yang tidak didukung. Periksa hasil terhadap sumber.');
  }else{let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(buffer)}catch{throw new Error('Teks tidak menggunakan encoding UTF-8. Simpan ulang sebagai UTF-8, lalu coba kembali.')}units=textUnits(text)}
  if(units.reduce((sum,u)=>sum+u.text.length,0)>maxCharacters)throw new Error('Dokumen terlalu panjang. Pisahkan menjadi beberapa file.');
  return{id:crypto.randomUUID(),name:file.name,format:ext!.toUpperCase(),bytes:file.size,hash,title:file.name.replace(/\.[^.]+$/,''),version:'',category:'Belum ditentukan',units,notes,approved:false,objectUrl:URL.createObjectURL(file)};
}
export function makeSample():PreparedDocument{
  const text='# Runbook — Database Recovery\n\nDokumen ini menjadi panduan pemulihan layanan database untuk tim operasi. Semua tindakan harus dicatat pada incident record.\n\n## Prasyarat\n\n- Konfirmasi maintenance window dengan pemilik layanan.\n- Pastikan backup terakhir sudah diverifikasi.\n- Periksa akses operator yang melakukan pemulihan.\n\n## Prosedur pemulihan\n\n1. Periksa status replikasi sebelum menjalankan pemulihan.\n2. Verifikasi replication lag dan ketersediaan disk.\n3. Jalankan prosedur restore sesuai playbook yang disetujui.\n\n| Parameter | Batas |\n| --- | --- |\n| Replication lag | 30 detik |\n| Free disk | 20% |\n\nCatat hasil verifikasi dan waktu pelaksanaan pada incident record.';
  return{id:'sample_runbook',name:'Database-Recovery.md',format:'MD',bytes:new TextEncoder().encode(text).length,hash:'sample-document',title:'Runbook — Database Recovery',version:'',category:'Runbook',units:textUnits(text),notes:[],approved:false,sample:true};
}
// Versioned, deterministic preparation checks; this is not a retrieval benchmark.
export function knowledgeReadiness(doc: PreparedDocument, chunks: Chunk[]) {
  const count = doc.units.length;
  const populated = doc.units.filter(unit => unit.text.trim()).length;
  const normalized = doc.units.map(unit => normalize(unit.text)).filter(Boolean);
  const duplicates = normalized.length - new Set(normalized).size;
  const metadataFields = [doc.title.trim(), doc.version.trim(), !['Belum ditentukan', 'Unspecified', 'Not specified', ''].includes(doc.category)];
  const sourceIds = new Set(doc.units.map(unit => unit.id));
  const components = [
    { id: 'text', score: count ? Math.round(populated / count * 100) : 0, weight: 30 },
    { id: 'metadata', score: Math.round(metadataFields.filter(Boolean).length / 3 * 100), weight: 20 },
    { id: 'duplicates', score: normalized.length ? Math.round((1 - duplicates / normalized.length) * 100) : 0, weight: 15 },
    { id: 'provenance', score: chunks.length ? Math.round(chunks.filter(chunk => chunk.sources.length > 0 && chunk.sources.every(source => sourceIds.has(source.unitId))).length / chunks.length * 100) : 0, weight: 20 },
    { id: 'review', score: doc.approved ? 100 : 0, weight: 15 },
  ];
  const score = Math.round(components.reduce((sum, component) => sum + component.score * component.weight / 100, 0));
  const blocked = findings(doc).some(check => check.severity === 'blocker') || !chunks.length;
  return {
    method: 'preparation-rules-v1', score, status: blocked ? 'blocked' : !doc.approved ? 'needs-review' : score >= 80 ? 'prepared' : 'needs-improvement', components,
    metrics: { sourceUnits: count, populatedUnits: populated, emptyUnits: count - populated, duplicateUnits: duplicates, chunks: chunks.length, characters: normalized.reduce((sum, text) => sum + text.length, 0), detectedTables: doc.format === 'PDF' ? null : doc.units.reduce((sum, unit) => sum + unit.tableCount, 0), pdfPagesWithoutExtractedText: doc.format === 'PDF' ? count - populated : null },
    notAssessed: ['semantic-quality', 'retrieval-accuracy', 'pii', 'language', 'ocr', 'pdf-table-layout'],
  };
}
export function makePackage(doc:PreparedDocument,chunks:Chunk[]){return{schemaVersion:'1.1',document:{id:doc.id,filename:doc.name,format:doc.format,sha256:doc.sample?null:doc.hash,title:doc.title,version:doc.version||null,category:doc.category,reviewedByUser:doc.approved,sourceUnits:doc.units.map(u=>({id:u.id,title:u.title,page:u.page??null,edited:u.text!==u.original}))},processing:{method:'rules-and-structure',ocrPerformed:false,llmUsed:false,tokenCountMethod:'characters_divided_by_4_estimate'},readiness:knowledgeReadiness(doc,chunks),checks:findings(doc),chunks,exportedAt:new Date().toISOString()}}
export function markdownExport(doc:PreparedDocument,chunks:Chunk[]){return`# ${doc.title}\n\n- File: ${doc.name}\n- Versi: ${doc.version||'Belum diisi'}\n- Jenis: ${doc.category}\n- Ditinjau pengguna: ${doc.approved?'Ya':'Tidak'}\n\n`+chunks.map((chunk,i)=>`## Chunk ${i+1}: ${chunk.title}\n\n${chunk.text}\n\nSumber: ${chunk.sources.map(s=>s.page?`halaman ${s.page} (${s.unitId})`:s.unitId).join(', ')}${chunk.edited?' · Teks telah diedit pengguna':''}\n`).join('\n')}
