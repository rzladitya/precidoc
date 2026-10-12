import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { attachHttpsRelay } from './helpers/https-relay.mjs';

assert.equal(process.env.PRECIDOC_LIVE_AUTH,'1','Live email tests require explicit activation.');
const email=process.env.PRECIDOC_AUTH_EMAIL;
assert(email&&/^[^@]+@[^@]+\.[^@]+$/.test(email),'Set the owner-authorized test email.');
const origin='https://precidoc.rainc.tech';
const out=path.resolve('outputs/precidoc-checklist-2026-10-12');fs.mkdirSync(out,{recursive:true});
const input=path.resolve('.sites-runtime/live-auth-input.json');
const stateFile=path.resolve('.sites-runtime/live-auth-test-state.json');
const reportFile=path.join(out,'live-auth-results.json');
const resumeRecovery=process.env.PRECIDOC_AUTH_RESUME_RECOVERY==='1';
const earlier=fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile,'utf8')):null;
if(resumeRecovery)assert(earlier?.checks.includes('Registration accepted and verification email requested'),'Recovery resume is only for the test account created by this run.');
const report={startedAt:new Date().toISOString(),transport:'Browser with actual HTTPS relay; TLS verification on; no response mocks',checks:resumeRecovery?[...earlier.checks]:[],pending:null};
const save=()=>fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
let password=randomBytes(24).toString('base64url')+'aA9!';
const keepState=()=>fs.writeFileSync(stateFile,JSON.stringify({origin,email,password,createdByTest:true}),{mode:0o600});
async function takeInput(key){
  report.pending=key;save();console.log(`WAITING_FOR_${key.toUpperCase()}`);
  const deadline=Date.now()+60*60*1000;
  while(Date.now()<deadline){
    if(fs.existsSync(input)){const data=JSON.parse(fs.readFileSync(input,'utf8'));if(data[key]){const value=data[key];delete data[key];if(Object.keys(data).length)fs.writeFileSync(input,JSON.stringify(data),{mode:0o600});else fs.unlinkSync(input);report.pending=null;return value;}}
    await setTimeout(500);
  }
  throw new Error(`Owner input ${key} was not received.`);
}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
  const context=await browser.newContext({viewport:{width:1280,height:950},acceptDownloads:true});
  const relayFailures=await attachHttpsRelay(context,origin);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const finishWorkspace=async()=>{
    await page.waitForFunction(()=>location.pathname==='/app'||document.querySelector('h1')?.textContent==='Make it your workspace',null,{timeout:60000});
    const profile=page.getByRole('button',{name:'Create account and open workspace',exact:true});if(await profile.isVisible())await profile.click();
    await page.waitForURL('**/app',{timeout:60000});profileCreated=true;
  };
  const verify=async()=>{
    await page.getByLabel('Verification code',{exact:true}).fill(String(await takeInput('otp')));
    await page.getByRole('button',{name:'Verify email',exact:true}).click();
    await page.getByRole('heading',{name:'Verify your email',exact:true}).waitFor({state:'hidden',timeout:60000});
    report.checks.push('Verification OTP accepted in the actual browser form');save();
  };
  let profileCreated=false;
  const signIn=async()=>{
    await page.goto(origin+'/auth/sign-in?returnTo='+encodeURIComponent(profileCreated?'/app':'/register'),{waitUntil:'networkidle'});
    await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();
    await page.waitForFunction(()=>location.pathname==='/app'||document.querySelector('h1')?.textContent==='Make it your workspace'||document.querySelector('h1')?.textContent==='Verify your email',null,{timeout:60000});
    if(await page.getByRole('heading',{name:'Verify your email',exact:true}).isVisible())await verify();
    await finishWorkspace();
  };
  const logout=async()=>{await page.getByRole('link',{name:'Sign out',exact:true}).click();await page.getByRole('button',{name:'Confirm sign out',exact:true}).click();await page.waitForURL(origin+'/',{timeout:60000});};
  const recovery=async()=>{
    await page.goto(origin+'/auth/forgot-password',{waitUntil:'networkidle'});
    if(process.env.PRECIDOC_AUTH_REUSE_RECOVERY!=='1'){await page.getByLabel('Email',{exact:true}).fill(email);await page.getByRole('button',{name:'Send reset link'}).click();await page.getByRole('status').filter({hasText:'If an account exists'}).waitFor({timeout:60000});report.checks.push('Recovery email requested');save();}
    else assert(earlier?.checks.includes('Recovery email requested'),'Only reuse a request made by this test.');
    const resetURL=new URL(await takeInput('recoveryURL'));
    assert([origin,new URL(process.env.NEON_AUTH_BASE_URL).origin].includes(resetURL.origin),'Unexpected recovery link origin.');
    let target=resetURL;
    for(let redirects=0;target.origin!==origin&&redirects<5;redirects++){const response=await fetch(target.href,{redirect:'manual',signal:AbortSignal.timeout(15000)});assert([301,302,303,307,308].includes(response.status),'Expected a real recovery token exchange redirect.');target=new URL(response.headers.get('location'),target);assert(target.protocol==='https:'&&[origin,resetURL.origin].includes(target.origin),'Unexpected recovery redirect destination.');}
    assert.equal(target.origin,origin);await page.goto(target.href,{waitUntil:'networkidle'});
    password=randomBytes(24).toString('base64url')+'bB8!';
    await page.getByLabel('New password',{exact:true}).fill(password);await page.getByLabel('Confirm password',{exact:true}).fill(password);await page.getByRole('button',{name:'Update password',exact:true}).click();
    await page.getByRole('status').filter({hasText:'Password updated'}).waitFor({timeout:60000});keepState();report.checks.push('Recovery link and password reset accepted in the browser');save();
  };
  if(resumeRecovery){await recovery();await signIn();}
  else{
    assert(!fs.existsSync(stateFile),'Use a dedicated fresh mailbox; do not overwrite another run’s test credentials.');
    await page.goto(origin+'/register',{waitUntil:'networkidle'});await page.getByLabel('Name',{exact:true}).fill('Precidoc browser check');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Create account',exact:true}).click();
    await page.getByRole('heading',{name:'Verify your email',exact:true}).waitFor({timeout:60000});keepState();report.checks.push('Registration accepted and verification email requested');save();await verify();await finishWorkspace();
  }
  report.checks.push('Verified profile creation and authenticated Free workspace');save();
  await page.locator('input[type=file]').setInputFiles([{name:'runbook.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:fs.readFileSync('tests/fixtures/runbook.docx')},{name:'policy.md',mimeType:'text/markdown',buffer:Buffer.from('# Policy\n\nKeep source references.')}]);await page.locator('.document-item').nth(1).waitFor();
  await page.getByRole('tab',{name:'Export',exact:true}).click();await page.getByRole('button',{name:'JSON',exact:true}).click();await page.locator('#approve-document').click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON',exact:true}).click();const download=await pending;const dest=path.join(out,'live-account-export.json');await download.saveAs(dest);const data=JSON.parse(fs.readFileSync(dest,'utf8'));assert.equal(data.processing.llmUsed,false);assert.equal(data.processing.location,'browser-memory');report.checks.push('Real authenticated DOCX/Markdown processing and reviewed JSON download');save();
  await logout();await signIn();report.checks.push('Logout followed by successful password login');save();
  await logout();
  if(!resumeRecovery){await recovery();await signIn();report.checks.push('Login with recovered password');await logout();}
  const session=await page.evaluate(async()=>{const r=await fetch('/api/session');return r.status;});assert.equal(session,401);report.checks.push('Final logout and protected session');assert.equal(relayFailures.length,0);assert.equal(errors.length,0);report.passed=true;save();console.log(JSON.stringify({passed:true,checks:report.checks.length}));
}catch(error){report.passed=false;report.error=error.message.split('\n')[0].replace(/https?:\/\/\S+/g,value=>{try{const url=new URL(value);return url.origin+url.pathname;}catch{return '[URL]';}});save();console.error(report.error);process.exitCode=1;}
finally{await browser.close();}
