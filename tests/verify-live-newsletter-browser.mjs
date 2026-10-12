import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright-core';
import { neon } from '@neondatabase/serverless';
import { attachHttpsRelay } from './helpers/https-relay.mjs';
assert.equal(process.env.PRECIDOC_LIVE_NEWSLETTER,'1','Live fixture writes require explicit activation.');
assert(process.env.DATABASE_URL,'Use the existing configured test database connection.');
const sql=neon(process.env.DATABASE_URL),email=`precidoc-qa-${randomUUID()}@example.invalid`;
const origin='https://precidoc.rainc.tech',out=path.resolve('outputs/precidoc-checklist-2026-10-12');fs.mkdirSync(out,{recursive:true});
const report={checks:[],noEmailsSent:true,fixtureDeleted:false};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
  const context=await browser.newContext({viewport:{width:390,height:900}});const failures=await attachHttpsRelay(context,origin);await attachHttpsRelay(context,'https://precidoc.rainc.web.id');
  const page=await context.newPage();await page.goto(origin+'/',{waitUntil:'networkidle'});await page.getByLabel('Email address',{exact:true}).fill(email);await page.getByRole('checkbox',{name:'Email me product updates about Precidoc.'}).check();await page.getByRole('button',{name:'Subscribe',exact:true}).click();await page.getByRole('heading',{name:'You’re on the list.',exact:true}).waitFor();
  const rows=await sql`SELECT unsubscribe_token, unsubscribed_at FROM precidoc_newsletter WHERE email=${email}`;assert.equal(rows.length,1);assert.equal(rows[0].unsubscribed_at,null);const token=rows[0].unsubscribe_token;assert.match(token,/^[a-f0-9]{64}$/);report.checks.push('Mobile subscription form saved explicit consent on live Neon');
  const legacy=await fetch('https://precidoc.rainc.web.id/newsletter/unsubscribe?token='+token,{redirect:'manual'});assert.equal(legacy.status,308);const target=new URL(legacy.headers.get('location'));assert.equal(target.origin,origin);assert.equal(target.searchParams.get('token'),token);await page.goto(target.href,{waitUntil:'networkidle'});assert.equal(new URL(page.url()).origin,origin);assert.equal((await sql`SELECT unsubscribed_at FROM precidoc_newsletter WHERE email=${email}`)[0].unsubscribed_at,null);report.checks.push('Legacy link redirects with token intact; visiting does not unsubscribe');
  await page.getByRole('button',{name:'Unsubscribe',exact:true}).click();await page.getByRole('heading',{name:'You’re unsubscribed.',exact:true}).waitFor();assert((await sql`SELECT unsubscribed_at FROM precidoc_newsletter WHERE email=${email}`)[0].unsubscribed_at);report.checks.push('Confirmation button unsubscribed the live fixture');assert.equal(failures.length,0);report.passed=true;
}catch(error){report.passed=false;report.error=error.message.split('\n')[0].replace(/https?:\/\/\S+/g,value=>{try{const url=new URL(value);return url.origin+url.pathname;}catch{return '[URL]';}});process.exitCode=1;}
finally{
  assert(email.startsWith('precidoc-qa-')&&email.endsWith('@example.invalid'));
  await sql`DELETE FROM precidoc_newsletter WHERE email=${email}`;report.fixtureDeleted=(await sql`SELECT email FROM precidoc_newsletter WHERE email=${email}`).length===0;
  fs.writeFileSync(path.join(out,'live-newsletter-results.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report));
}
