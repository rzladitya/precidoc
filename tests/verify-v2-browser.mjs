import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
const base=process.env.PRECIDOC_TEST_URL??'http://127.0.0.1:3000';
const out=path.resolve('outputs/precidoc-v2-2026-10-12');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results={views:[],flows:[],errors:[]};
try{
  const routes=['/','/product','/pricing','/blog','/support','/privacy','/terms','/changelog','/sample','/register','/auth/sign-in','/auth/forgot-password'];
  for(const locale of ['en','id'])for(const width of [1440,390,320]){
    const context=await browser.newContext({viewport:{width,height:900},locale:locale==='en'?'en-GB':'id-ID',timezoneId:'Asia/Jakarta',reducedMotion:'reduce'});
    await context.addInitScript(lang=>localStorage.setItem('precidoc-language',lang),locale);
    const page=await context.newPage();page.on('pageerror',error=>results.errors.push(error.message));
    for(const route of routes){
      const response=await page.goto(base+route,{waitUntil:'networkidle'});assert.equal(response.status(),200,route);
      if(route==='/sample')await page.locator('.document-item').waitFor();
      assert.match(await page.title(),/Precidoc/);
      const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
      assert(geometry.scroll<=geometry.width+1,`${route} ${locale} ${width} overflow: ${geometry.scroll}`);
      const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      const violations=scan.violations.map(v=>({id:v.id,impact:v.impact,selectors:v.nodes.flatMap(n=>n.target)}));
      results.views.push({route,locale,width,title:await page.title(),violations,overflow:false});
      assert.equal(violations.length,0,JSON.stringify({route,locale,width,violations}));
      if(width===390&&['/','/product','/pricing','/sample','/privacy','/register'].includes(route))await page.screenshot({path:path.join(out,`${route==='/'?'home':route.slice(1).replaceAll('/','-')}-${locale}-${width}.png`),fullPage:true});
    }
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',error=>results.errors.push(error.message));
  const usage=[];await page.route('**/api/usage',async route=>{usage.push(route.request().postDataJSON());await route.fulfill({status:204});});
  await page.goto(base+'/sample',{waitUntil:'networkidle'});await page.locator('.document-item').waitFor();
  assert.equal(usage.length,0);assert.equal(await page.locator('.document-item').count(),1);
  assert.match(await page.locator('.session-history').textContent(),/Parsed/);
  assert.equal(await page.locator('input[type=file]').getAttribute('multiple'),null);
  await page.locator('input[type=file]').setInputFiles({name:'wrong.pdf',mimeType:'application/pdf',buffer:Buffer.from('MZ not a PDF')});
  await page.getByRole('button',{name:'Retry failed files'}).waitFor();assert.match(await page.locator('.error-banner').textContent(),/does not match/);
  await page.getByRole('button',{name:'Retry failed files'}).click();await page.getByRole('button',{name:'Retry failed files'}).waitFor();
  assert.match(await page.locator('.document-detail-head').textContent(),/Database-Recovery/);
  await page.evaluate(()=>{const original=File.prototype.arrayBuffer;let failed=false;File.prototype.arrayBuffer=function(){if(this.name==='retry.md'&&!failed){failed=true;return Promise.reject(new Error('simulated local read failure'));}return original.call(this);};});
  await page.locator('input[type=file]').setInputFiles({name:'retry.md',mimeType:'text/markdown',buffer:Buffer.from('# Test runbook\n\nRead the original.\n\n## Procedure\n\nCheck the service owner.')});
  await page.getByRole('button',{name:'Retry failed files'}).waitFor();await page.getByRole('button',{name:'Retry failed files'}).click();
  await page.locator('.document-detail-head').filter({hasText:'retry.md'}).waitFor();
  assert.equal(await page.locator('.document-item').count(),1);
  await page.getByRole('tab',{name:'Source & output'}).click();const editor=page.getByRole('textbox',{name:'Edit extracted text'});
  const edited=(await editor.inputValue())+'\nReviewed test content <script>window.__unsafe=true</script>';
  await editor.fill(edited);assert.equal(await page.evaluate(()=>window.__unsafe),undefined);
  await editor.fill('x'.repeat(100001));assert.match(await page.locator('.error-banner').textContent(),/character limit/);assert.equal(await editor.inputValue(),edited);
  await page.getByRole('tab',{name:'Export',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Export Markdown',exact:true}).isEnabled(),false);
  assert.match(await page.locator('.output-preview').textContent(),/Reviewed test content/);
  await page.locator('#approve-document').click();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Export Markdown',exact:true}).click();
  const download=await downloaded;await download.saveAs(path.join(out,'sample-prepared.md'));assert.match(fs.readFileSync(path.join(out,'sample-prepared.md'),'utf8'),/Reviewed test content/);
  await page.getByRole('tab',{name:'Source & output'}).click();await editor.fill(edited+'\nAnother edit');await page.getByRole('tab',{name:'Export',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Export Markdown',exact:true}).isEnabled(),false);
  await page.getByRole('button',{name:'Remove document from this tab'}).click();
  await page.locator('input[type=file]').setInputFiles(path.resolve('tests/fixtures/digital.pdf'));await page.locator('.document-detail-head').filter({hasText:'digital.pdf'}).waitFor();
  await page.getByRole('tab',{name:'Source & output'}).click();await page.getByRole('button',{name:'View original PDF'}).click();await page.locator('.safe-pdf-preview canvas:not([hidden])').waitFor();
  assert.equal(await page.locator('iframe,object,embed').count(),0);await page.screenshot({path:path.join(out,'safe-pdf-preview.png'),fullPage:true});
  page.on('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Clear tab',exact:true}).click();assert.equal(await page.locator('.document-item').count(),0);assert.match(await page.locator('.session-history').textContent(),/\(0\)/);
  results.flows.push('real sample parsing','default-off statistics','signature rejection and retry','transient read retry','one-document isolation','safe text rendering','edit limits','approval gating and invalidation','real Markdown download','safe canvas PDF preview','clear tab and activity');
  await page.goto(base+'/',{waitUntil:'networkidle'});await page.getByRole('checkbox',{name:'Share optional usage statistics'}).check();await page.goto(base+'/sample');await page.locator('.document-item').waitFor();assert(usage.some(event=>event.event==='sample_started'));assert(usage.every(event=>Object.keys(event).every(key=>['event','duration','consent'].includes(key))));
  results.flows.push('explicit opt-in aggregate payload');await context.close();
  const privateContext=await browser.newContext();await privateContext.addInitScript(()=>{localStorage.setItem('precidoc-usage-consent','yes');Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true});});const privatePage=await privateContext.newPage();await privatePage.goto(base+'/',{waitUntil:'networkidle'});assert(await privatePage.getByLabel('Share optional usage statistics').isDisabled());results.flows.push('Global Privacy Control respected');await privateContext.close();
  assert.equal(results.errors.length,0,results.errors.join('\n'));
  console.log(JSON.stringify({views:results.views.length,flows:results.flows.length,errors:results.errors.length,output:out}));
}finally{fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));await browser.close();}
