/* eslint-disable @typescript-eslint/no-require-imports -- CJS harness loads TypeScript routes with an isolated SQL adapter. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
const database = new DatabaseSync(':memory:');
for (const match of fs.readFileSync('scripts/migrate-neon.mjs', 'utf8').matchAll(/await sql`([\s\S]+?)`;/g)) database.exec(match[1]);
let available = true;
const sql = async (parts, ...values) => {
  if (!available) throw new Error('Database unavailable');
  const query = parts.join('?');
  const statement = database.prepare(query);
  return /RETURNING|^SELECT/.test(query) ? statement.all(...values) : (statement.run(...values), []);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) { return originalResolve.call(this, request.startsWith('@/') ? path.resolve(request.slice(2)) : request, parent, ...args); };
const originalLoad = Module._load;
Module._load = function (request, parent, ...args) {
  if (request === './index' && parent.filename.endsWith('/db/newsletter.ts')) return { getAccountDb: () => sql };
  return originalLoad.call(this, request, parent, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
const subscribe = require('../app/api/newsletter/route.ts').POST;
const unsubscribe = require('../app/api/newsletter/unsubscribe/route.ts').POST;
function request(body, options = {}) {
  const headers = { 'content-type': options.type ?? 'application/json', 'cf-connecting-ip': options.ip ?? '192.0.2.1' };
  if (options.origin !== null) headers.origin = options.origin ?? 'https://precidoc.test';
  return new Request('https://precidoc.test/api/newsletter', { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
const input = { email: 'Subscriber@Example.invalid', locale: 'en', consent: true, company: '' };
(async () => {
  assert.equal((await subscribe(request(input, { origin: 'https://other.test' }))).status, 403);
  assert.equal((await subscribe(request(input, { origin: null }))).status, 403);
  assert.equal((await subscribe(request(input, { type: 'text/plain' }))).status, 415);
  assert.equal((await subscribe(request('x'.repeat(2049)))).status, 413);
  assert.equal((await subscribe(request('{bad'))).status, 400);
  assert.equal((await subscribe(request({ ...input, email: 'bad' }))).status, 400);
  assert.equal((await subscribe(request({ ...input, consent: false }))).status, 400);
  assert.equal((await subscribe(request({ ...input, company: 'bot' }))).status, 200);
  assert.equal(database.prepare('SELECT COUNT(*) AS n FROM precidoc_newsletter').get().n, 0);
  const first = await subscribe(request(input));
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { ok: true });
  const row = database.prepare('SELECT * FROM precidoc_newsletter').get();
  assert.equal(row.email, input.email.toLowerCase());
  assert.match(row.unsubscribe_token, /^[a-f0-9]{64}$/);
  assert.equal((await subscribe(request({ ...input, locale: 'id' }))).status, 200);
  assert.equal(database.prepare('SELECT COUNT(*) AS n FROM precidoc_newsletter').get().n, 1);
  assert.equal(database.prepare('SELECT locale FROM precidoc_newsletter').get().locale, 'id');
  assert.equal(database.prepare('SELECT unsubscribe_token FROM precidoc_newsletter').get().unsubscribe_token, row.unsubscribe_token);
  assert.equal((await unsubscribe(request({ token: row.unsubscribe_token }, { origin: 'https://other.test' }))).status, 403);
  assert.equal((await unsubscribe(request({ token: 'bad' }))).status, 400);
  assert.equal((await unsubscribe(request({ token: '0'.repeat(64) }))).status, 404);
  assert.equal((await unsubscribe(request({ token: row.unsubscribe_token }))).status, 200);
  assert.equal((await unsubscribe(request({ token: row.unsubscribe_token }))).status, 200);
  assert(database.prepare('SELECT unsubscribed_at FROM precidoc_newsletter').get().unsubscribed_at);
  assert.equal((await subscribe(request(input))).status, 200);
  assert.equal(database.prepare('SELECT unsubscribed_at FROM precidoc_newsletter').get().unsubscribed_at, null);
  for (let i = 0; i < 6; i++) assert.equal((await subscribe(request({ ...input, email: `burst${i}@example.invalid` }, { ip: '192.0.2.9' }))).status, i < 5 ? 200 : 429);
  assert.equal(database.prepare("SELECT COUNT(*) AS n FROM precidoc_newsletter WHERE email LIKE 'burst%'").get().n, 5);
  available = false;
  assert.equal((await subscribe(request(input))).status, 503);
  assert.equal((await unsubscribe(request({ token: row.unsubscribe_token }))).status, 503);
  database.close();
  console.log('Passed newsletter: consent/validation/origin/body limit, honeypot, normalized and duplicate subscription, stable token, unsubscribe/re-subscribe lifecycle, rate limit and database failure. SQL templates exercised with a local SQLite adapter; this does not validate live Neon.');
})().catch(error => { console.error(error); process.exitCode = 1; });
