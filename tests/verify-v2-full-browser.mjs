import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
const base=process.env.PRECIDOC_TEST_URL??'http://127.0.0.1:3000';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Full browser fixture is local-only.');
const fixture=path.resolve('app/v2-browser-fixture');
assert(!fs.existsSync(fixture),'Do not overwrite an existing route.');
fs.mkdirSync(fixture);
fs.writeFileSync(path.join(fixture,'page.tsx'),`import {notFound} from 'next/navigation';\nimport {Workspace} from '@/components/workspace';\nexport default function Fixture(){if(process.env.NODE_ENV!=='development')notFound();return <Workspace accountId="v2-browser-account" accountName="QA · simulated authentication"/>;}\n`);
const out=path.resolve('outputs/precidoc-v2-2026-10-12');fs.mkdirSync(out,{recursive:true});
let browser;
const results=[];
try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:950},acceptDownloads:true,reducedMotion:'reduce'});
    let identity='v2-browser-account',unavailable=false;const errors=[];
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/api/session',route=>route.fulfill({status:unavailable?503:200,contentType:'application/json',body:JSON.stringify(unavailable?{error:'session_unavailable'}:{userId:identity})}));
    await page.goto(base+'/v2-browser-fixture',{waitUntil:'networkidle'});
    await page.locator('input[type=file]').setInputFiles([{name:'runbook.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:fs.readFileSync('tests/fixtures/runbook.docx')},{name:'policy.md',mimeType:'text/markdown',buffer:Buffer.from('# Policy\n\nKeep the original document.\n\n## Retention\n\nExport before leaving.')}]);
    await page.locator('.document-item').nth(1).waitFor();assert.equal(await page.locator('.document-item').count(),2);
    await page.locator('.metadata-grid input[placeholder]').fill('v2.1');
    await page.getByRole('combobox').click();await page.getByRole('option',{name:'Policy',exact:true}).click();
    await page.getByRole('tab',{name:'Chunks',exact:true}).click();await page.getByRole('combobox').click();await page.getByRole('option').filter({hasText:/1[,\.]000/}).click();
    const merge=page.locator('.chunk-controls [role=checkbox]');await merge.click();await merge.click();
    await page.getByRole('tab',{name:'Export',exact:true}).click();await page.getByRole('button',{name:'JSON',exact:true}).click();
    assert.match(await page.locator('.output-preview pre').textContent(),/v2.1/);assert.match(await page.locator('.output-preview pre').textContent(),/Policy/);
    assert.equal(await page.getByRole('button',{name:'Export JSON',exact:true}).isEnabled(),false);await page.locator('#approve-document').click();
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON',exact:true}).click();const download=await pending;const destination=path.join(out,`full-export-${width}.json`);await download.saveAs(destination);
    const data=JSON.parse(fs.readFileSync(destination,'utf8'));assert.equal(data.document.version,'v2.1');assert.equal(data.document.category,'Policy');assert.equal(data.processing.llmUsed,false);
    await page.locator('.document-item').filter({hasText:'runbook.docx'}).click();
    await page.getByRole('button',{name:'Review this section',exact:true}).click();assert.match(await page.locator('.unit-navigation').textContent(),/Procedure/);
    await page.getByRole('tab',{name:'Overview',exact:true}).click();
    const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.equal(scan.violations.length,0,JSON.stringify(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,`full-workspace-${width}.png`),fullPage:true});
    unavailable=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(100);assert.equal(await page.locator('.document-item').count(),2);
    unavailable=false;identity='other-account';await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.getByRole('heading',{name:'Your session has ended'}).waitFor();assert.equal(await page.locator('.document-item').count(),0);assert(!await page.locator('body').textContent().then(value=>value.includes('policy.md')));
    assert.equal(errors.length,0,errors.join('\n'));results.push({width,auth:'simulated local session endpoint',realParsing:['DOCX','Markdown'],metadata:true,chunkSettings:true,jsonExport:true,sourceFindingLink:true,temporaryOutagePreservesData:true,crossAccountClearsData:true,accessibility:true});
    await context.close();
  }
  console.log(JSON.stringify({fullWorkspaceViews:results.length,authentication:'simulated; no production bypass or emails',passed:true}));
}finally{
  fs.writeFileSync(path.join(out,'full-browser-results.json'),JSON.stringify(results,null,2));
  await browser?.close();
  fs.rmSync(fixture,{recursive:true,force:true});
}
