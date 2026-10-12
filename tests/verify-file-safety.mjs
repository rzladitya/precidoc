import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {DOMParser} from 'linkedom';
const requireMammoth=createRequire(import.meta.resolve('mammoth'));
const JSZip=requireMammoth('jszip');
class Parser extends DOMParser{parseFromString(value,type){return super.parseFromString(type==='text/html'?`<html><head></head><body>${value}</body></html>`:value,type);}}
globalThis.DOMParser=Parser;
fs.mkdirSync('.sites-runtime',{recursive:true});
for(const name of ['file-safety','documents']){
  const source=fs.readFileSync(`lib/${name}.ts`,'utf8').replace("'./file-safety'","'./file-safety.mjs'");
  fs.writeFileSync(`.sites-runtime/${name}-safety.mjs`,ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'./file-safety.mjs'","'./file-safety-safety.mjs'"));
}
const {parseFile}=await import('../.sites-runtime/documents-safety.mjs');
const parse=file=>parseFile(file,()=>{});
await assert.rejects(parse(new File(['MZ this is not a PDF'],'fake.pdf')),error=>error.code==='signature');
await assert.rejects(parse(new File(['%PDF-1.7\ncontent'],'fake.txt')),error=>error.code==='signature');
await assert.rejects(parse(new File(['valid text'],'report.md',{type:'image/png'})),error=>error.code==='mime');
await assert.rejects(parse(new File([new Uint8Array([65,0,66])],'binary.txt')),error=>error.code==='binary_text');
await assert.rejects(parse(new File(['valid text'],'spoof\u202Etxt.md')),error=>error.code==='filename');
await assert.rejects(parse(new File(['valid text'],'a'.repeat(241)+'.md')),error=>error.code==='filename');
await assert.rejects(parse(new File(['PK not a zip'],'fake.docx')),error=>error.code==='signature');
const zip=()=>new JSZip().file('[Content_Types].xml','<Types/>').file('word/document.xml','<document/>');
const macro=await zip().file('word/vbaProject.bin','unsafe').generateAsync({type:'uint8array'});
await assert.rejects(parse(new File([macro],'macro.docx')),error=>error.code==='active_content');
const unrelated=await new JSZip().file('random.txt','hi').generateAsync({type:'uint8array'});
await assert.rejects(parse(new File([unrelated],'not-word.docx')),error=>error.code==='archive');
const large=await zip().file('word/document.xml','A'.repeat(2*1024*1024)).generateAsync({type:'uint8array',compression:'DEFLATE'});
await assert.rejects(parse(new File([large],'expansion.docx')),error=>error.code==='archive_limit');
// Forge both size headers to look small: actual streamed inflation must catch it.
const forged=large.slice();const view=new DataView(forged.buffer);let changed=false;
for(let i=0;i<forged.length-46;i++){
  if(view.getUint32(i,true)!==0x02014b50)continue;
  const length=view.getUint16(i+28,true),name=new TextDecoder().decode(forged.slice(i+46,i+46+length));
  if(name==='word/document.xml'){
    view.setUint32(i+24,1,true);const local=view.getUint32(i+42,true);view.setUint32(local+22,1,true);changed=true;break;
  }
}
assert(changed);await assert.rejects(parse(new File([forged],'forged-size.docx')),error=>error.code==='archive_limit');
const original=fs.readFileSync('tests/fixtures/runbook.docx');
const doc=await parse(new File([original],'real.docx'));
assert.equal(doc.units.length,2);assert(doc.units[1].text.includes('Replication lag'));assert(doc.processingMs>=0);assert(doc.processedAt);URL.revokeObjectURL(doc.objectUrl);
const controller=new AbortController();controller.abort();
await assert.rejects(parseFile(new File(['# Source'],'cancelled.md'),()=>{},{signal:controller.signal}),error=>error.code==='cancelled');
const delayed=new File(['text'],'slow.txt');delayed.arrayBuffer=()=>new Promise(resolve=>setTimeout(()=>resolve(new TextEncoder().encode('text').buffer),60));
await assert.rejects(parseFile(delayed,()=>{},{maxProcessingMs:5}),error=>error.code==='timeout');
await new Promise(resolve=>setTimeout(resolve,75));
console.log('Passed file security: real DOCX, wrong signatures/MIME, binary/spoofed text, invalid archives, macros, expanded limits, forged sizes with actual streamed inflation, processing timestamps, cancellation and timeout. No antivirus claim.');
