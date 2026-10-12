import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
const base = process.env.PRECIDOC_TEST_URL ?? 'http://127.0.0.1:3000';
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname), 'Failure injections are local-only.');
const out = path.resolve(process.env.PRECIDOC_TEST_OUTPUT ?? 'outputs/precidoc-checklist-2026-10-12');fs.mkdirSync(out,{recursive:true});
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results = [];
try {
  const context = await browser.newContext({viewport:{width:390,height:900},acceptDownloads:true,reducedMotion:'reduce'});
  const page = await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const requests=[];page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push({url:r.url(),body:r.postData()??''});});
  const sample = async()=>{await page.goto(base+'/sample',{waitUntil:'networkidle'});await page.locator('.document-item').waitFor();};
  await sample();
  await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Open findings',exact:true}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Open text editor',exact:true}).click();
  assert(await page.getByRole('textbox',{name:'Edit extracted text'}).isVisible());
  await page.getByRole('button',{name:'Next',exact:true}).click();await page.getByRole('button',{name:'Preview export',exact:true}).click();
  assert(await page.locator('.output-preview').isVisible());await page.getByRole('button',{name:'Done',exact:true}).click();
  assert(await page.getByRole('button',{name:'Show quick-start guide'}).isVisible());results.push('Guided input/findings/edit/export navigation and dismiss/reopen preference');
  for(const [name,input,pattern] of [
    ['corrupt.pdf',{name:'corrupt.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7\nnot a valid PDF')},/Could not read this file/i],
    ['encrypted.pdf',path.resolve('tests/fixtures/encrypted.pdf'),/password/i],
    ['oversized.md',{name:'oversized.md',mimeType:'text/markdown',buffer:Buffer.alloc(5*1024*1024+1,65)},/5 MB/i],
  ]) {
    await sample();await page.locator('input[type=file]').setInputFiles(input);await page.getByRole('button',{name:'Retry failed files'}).waitFor();assert.match(await page.locator('.error-banner').textContent(),pattern,name);assert.match(await page.locator('.document-detail-head').textContent(),/Database-Recovery/);results.push(`${name}: actionable rejection preserves existing sample`);
  }
  await sample();await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/scan.pdf'));await page.locator('.document-detail-head').filter({hasText:'scan.pdf'}).waitFor();
  assert.match(await page.locator('.readiness-report').textContent(),/Fix.*empty sources/i);await page.getByRole('tab',{name:'Export',exact:true}).click();assert(await page.locator('#approve-document').isDisabled());assert(!await page.getByRole('button',{name:'Export Markdown',exact:true}).isEnabled());results.push('Actual image-only PDF produces empty-source blocker; no OCR or false approval');
  await sample();await page.evaluate(()=>{const original=File.prototype.arrayBuffer;File.prototype.arrayBuffer=function(){return this.name==='cancel.md'?new Promise(resolve=>setTimeout(()=>original.call(this).then(resolve),1500)):original.call(this);};});
  await page.locator('input[type=file]').setInputFiles({name:'cancel.md',mimeType:'text/markdown',buffer:Buffer.from('# Cancel test\n\nLocal file read.')});await page.getByRole('button',{name:'Cancel processing'}).click();await page.waitForTimeout(1800);assert.match(await page.locator('.document-detail-head').textContent(),/Database-Recovery/);assert.equal(await page.locator('.processing').count(),0);results.push('In-flight cancellation does not commit a late parser result');
  await sample();await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/runbook.docx'));await page.locator('.document-detail-head').filter({hasText:'runbook.docx'}).waitFor();await page.getByRole('button',{name:'Review this section',exact:true}).click();assert.match(await page.locator('.unit-navigation').textContent(),/Procedure/);results.push('Real DOCX parsing and finding-to-section navigation in anonymous one-file mode');
  await sample();const marker='PRIVATE_CONTENT_PROBE_42',filename='PRIVATE_FILENAME_PROBE_42.md';
  await page.locator('input[type=file]').setInputFiles({name:filename,mimeType:'text/markdown',buffer:Buffer.from('# Private source\n\n'+marker)});await page.locator('.document-detail-head').filter({hasText:filename}).waitFor();
  assert(requests.every(r=>!r.url.includes(marker)&&!r.url.includes(filename)&&!r.body.includes(marker)&&!r.body.includes(filename)));
  assert(requests.every(r=>new URL(r.url).origin===new URL(base).origin));
  assert.equal(requests.filter(r=>r.url.includes('/api/usage')).length,0);
  const storage=await page.evaluate(()=>Object.entries(localStorage));assert(storage.every(([,value])=>!value.includes(marker)&&!value.includes(filename)));
  results.push('Document text and filename absent from all HTTP requests and localStorage; no third-party requests; statistics default off');
  page.on('dialog',d=>d.accept());await page.reload({waitUntil:'networkidle'});await page.locator('.document-item').waitFor();assert(!await page.locator('body').textContent().then(t=>t.includes(marker)));results.push('Reload discards user file and edits instead of restoring sensitive data');
  await page.goto(base+'/product',{waitUntil:'networkidle'});
  for(const name of ['RAG','Knowledge base','Extraction review']){await page.getByRole('tab',{name,exact:true}).click();assert(await page.locator('.before-after').isVisible());}
  await page.getByRole('button',{name:'Bahasa Indonesia',exact:true}).click();assert(await page.getByRole('tab',{name:'Review ekstraksi',exact:true}).isVisible());assert.match(await page.locator('.before-after').textContent(),/ditinjau manual/);results.push('Three illustrative before/after examples and complete EN/ID controls');
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.equal(scan.violations.length,0,JSON.stringify(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:path.join(out,'examples-id-mobile.png'),fullPage:true});assert.equal(errors.length,0,errors.join('\n'));
  console.log(JSON.stringify({passed:true,checks:results.length}));
}finally{fs.writeFileSync(path.join(out,'checklist-browser-results.json'),JSON.stringify({date:new Date().toISOString(),checks:results},null,2));await browser.close();}
