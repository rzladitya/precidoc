/* eslint-disable @typescript-eslint/no-require-imports -- CJS harness transpiles the real TypeScript modules with mocked external delivery. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { generateKeyPairSync, sign } = require('node:crypto');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) { return originalResolve.call(this, request.startsWith('@/') ? path.resolve(request.slice(2)) : request, parent, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename);
const { deliverAuthEmail } = require('../lib/auth/email-webhook.ts');
const { renderAuthEmail } = require('../lib/auth/email-template.ts');
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const kid = 'local-test-key';
const jwk = { ...publicKey.export({ format: 'jwk' }), kid };
const originalFetch = global.fetch;
const originalBase = process.env.NEON_AUTH_BASE_URL;
const originalApiKey = process.env.RESEND_API_KEY;
process.env.NEON_AUTH_BASE_URL = 'https://ep-email-test.neonauth.neon.tech/neondb/auth';
process.env.RESEND_API_KEY = 'local-provider-fixture';
const accepted = [], receipts = new Map();
let providerStatus = 200, jwksStatus = 200, jwksCalls = 0;
global.fetch = async (url, options) => {
  if (String(url).endsWith('/.well-known/jwks.json')) { jwksCalls++; return Response.json({ keys: [jwk] }, { status: jwksStatus }); }
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(options.headers.Authorization, 'Bearer local-provider-fixture');
  assert.equal(options.redirect, 'error');
  const email = JSON.parse(options.body);
  if (providerStatus !== 200) return Response.json({ error: 'provider unavailable' }, { status: providerStatus });
  const id = options.headers['Idempotency-Key'];
  if (!receipts.has(id)) { receipts.set(id, 'local-receipt-' + receipts.size); accepted.push({ email, id }); }
  return Response.json({ id: receipts.get(id) });
};
const event = (type = 'send.otp', emailPurpose = 'email-verification') => {
  const issued = Date.now();
  return {
  event_id: crypto.randomUUID(), event_type: type, timestamp: new Date(issued).toISOString(),
  context: { endpoint_id: 'ep-email-test' }, user: { email: 'auth-email-check@example.invalid' },
  event_data: type === 'send.otp' ? { otp_type: emailPurpose, otp_code: '123456', expires_at: new Date(issued + 600000).toISOString() } : { link_type: emailPurpose, link_url: 'https://precidoc.rainc.web.id/auth/reset-password?token=local%26fixture', expires_at: new Date(issued + 1800000).toISOString() },
}; };
function request(payload, options = {}) {
  const timestamp = String(options.timestamp ?? Date.now());
  const raw = options.raw ?? JSON.stringify(payload);
  const header = Buffer.from(JSON.stringify({ alg: options.alg ?? 'EdDSA', kid })).toString('base64url');
  const signed = `${header}.${Buffer.from(`${timestamp}.${Buffer.from(raw).toString('base64url')}`).toString('base64url')}`;
  const signature = sign(null, Buffer.from(signed), privateKey).toString('base64url');
  return new Request('https://precidoc.rainc.web.id/api/webhooks/neon-auth', { method: 'POST', headers: { 'content-type': options.contentType ?? 'application/json', 'x-neon-signature': `${header}..${signature}`, 'x-neon-signature-kid': kid, 'x-neon-timestamp': timestamp, 'x-neon-event-id': options.headerId ?? payload.event_id, 'x-neon-event-type': payload.event_type }, body: options.tamper ? raw.replace('123456', '654321') : raw });
}
(async () => {
  assert.equal((await deliverAuthEmail(new Request('https://precidoc.rainc.web.id/api/webhooks/neon-auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }))).status, 401);
  assert.equal(jwksCalls, 0);
  const first = event();
  assert.equal((await deliverAuthEmail(request(first, { timestamp: Date.now() - 301000 }))).status, 401);
  assert.equal((await deliverAuthEmail(request(first, { timestamp: Date.now() + 301000 }))).status, 401);
  assert.equal((await deliverAuthEmail(request(first, { alg: 'none' }))).status, 401);
  assert.equal((await deliverAuthEmail(request(first, { raw: 'x'.repeat(16385) }))).status, 401);
  assert.equal((await deliverAuthEmail(request(first, { contentType: 'text/plain' }))).status, 401);
  assert.equal((await deliverAuthEmail(request(first, { tamper: true }))).status, 401);
  assert.equal(accepted.length, 0);
  const response = await deliverAuthEmail(request(first, { raw: JSON.stringify(first, null, 2) }));
  assert.equal(response.status, 200);assert.equal(response.headers.get('cache-control'), 'no-store');assert.deepEqual(await response.json(), { success: true });
  assert.equal(accepted.length, 1);assert.equal(jwksCalls, 1);
  const email = accepted[0].email;
  assert.equal(email.subject, 'Verify your email | Precidoc');assert.equal(email.from, 'Precidoc <noreply@rainc.web.id>');assert.deepEqual(email.to, ['auth-email-check@example.invalid']);
  assert(email.html.includes('/precidoc-logo.png'));assert(!email.html.includes('<svg'));assert(email.html.includes('123456'));assert(email.text.includes('Verification code: 123456'));assert(email.text.includes('10 minutes'));assert(!email.html.includes('Neon Auth'));
  assert.equal((await deliverAuthEmail(request(first))).status, 200);assert.equal(accepted.length, 1);assert.equal(accepted[0].id, `precidoc-auth/${first.event_id}`);
  assert.equal((await deliverAuthEmail(request(event(), { headerId: crypto.randomUUID() }))).status, 401);
  const wrongEndpoint = event();wrongEndpoint.context.endpoint_id = 'ep-other-branch';assert.equal((await deliverAuthEmail(request(wrongEndpoint))).status, 401);
  const expired = event();expired.event_data.expires_at = new Date(Date.now() - 1000).toISOString();assert.equal((await deliverAuthEmail(request(expired))).status, 401);
  const sms = event();sms.event_data.delivery_preference = 'sms';assert.equal((await deliverAuthEmail(request(sms))).status, 401);
  const unsafe = event('send.magic_link', 'forget-password');unsafe.event_data.link_url = 'https://unrelated.example/reset';assert.equal((await deliverAuthEmail(request(unsafe))).status, 401);
  unsafe.event_data.link_url = 'javascript:alert(1)';assert.equal((await deliverAuthEmail(request(unsafe))).status, 401);
  const reset = event('send.magic_link', 'forget-password');assert.equal((await deliverAuthEmail(request(reset))).status, 200);assert.equal(accepted[1].email.subject, 'Reset your password | Precidoc');assert(accepted[1].email.html.includes('Your password will stay the same.'));
  for (const purpose of ['email-verification', 'sign-in', 'forget-password']) {
    const rendered = renderAuthEmail({ kind: 'otp', purpose, code: '123456', issuedAt: new Date(0).toISOString(), expiresAt: new Date(60000).toISOString() });
    assert(rendered.text.includes('1 minute.'));assert(!rendered.text.includes('1 minutes'));assert(rendered.html.includes('max-width:560px'));assert(rendered.text.includes('admin@rainc.web.id'));
  }
  const escaped = renderAuthEmail({ kind: 'link', purpose: 'forget-password', url: 'https://precidoc.rainc.web.id/auth/reset-password?token=x&next=y', issuedAt: new Date(0).toISOString(), expiresAt: new Date(1800000).toISOString() });assert(escaped.html.includes('token=x&amp;next=y'));
  providerStatus = 429;assert.equal((await deliverAuthEmail(request(event()))).status, 503);
  process.env.NEON_AUTH_BASE_URL += '/unavailable';jwksStatus = 503;assert.equal((await deliverAuthEmail(request(event()))).status, 503);
  console.log('Passed auth email verification: signed raw bodies, tampering/stale/future signatures, payload/endpoint/expiry/unsafe-link rejection, branded OTP/link/plain-text templates, JWKS cache, retry idempotency and provider failure. Local signing keys and simulated delivery only; no emails sent.');
})().catch(error => { console.error(error);process.exitCode = 1; }).finally(() => {
  global.fetch = originalFetch;
  if (originalBase === undefined) delete process.env.NEON_AUTH_BASE_URL;else process.env.NEON_AUTH_BASE_URL = originalBase;
  if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY = originalApiKey;
});
