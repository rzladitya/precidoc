/* eslint-disable @typescript-eslint/no-require-imports -- Transpile the real proxy and simulate only the Auth service. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const { NextRequest, NextResponse } = require('next/server');
const originalLoad = Module._load;
let authCalls = 0, authUnavailable = false;
Module._load = function (request, ...args) {
  if (request === '@/lib/auth/server') return { getAuth: () => ({ middleware: () => async () => {
    authCalls++;
    if (authUnavailable) throw new Error('Simulated unavailable Auth service');
    return NextResponse.next();
  } }) };
  return originalLoad.call(this, request, ...args);
};
const originalTs = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, filename);
const proxy = require('../proxy.ts').default;
const request = (host, path, method = 'GET') => new NextRequest(`https://${host}${path}`, { method, headers: { host }, ...(method === 'POST' ? { body: '{}' } : {}) });
(async () => {
  for (const path of ['/', '/sample', '/auth/reset-password?token=local%26fixture&next=%2Fapp', '/newsletter/unsubscribe?token=x%2By%3Dz', '/pricing?tag=a&tag=b']) {
    const response = await proxy(request('precidoc.rainc.web.id', path));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), `https://precidoc.rainc.tech${path}`);
  }
  const post = request('precidoc.rainc.web.id', '/api/webhooks/neon-auth', 'POST');
  assert.equal((await proxy(post)).status, 308);assert.equal(post.bodyUsed, false);
  for (const host of ['precidoc.rainc.tech', 'precidocXraincXwebXid', 'localhost']) {
    assert.equal((await proxy(request(host, '/'))).headers.get('x-middleware-next'), '1');
  }
  assert.equal(authCalls, 0);
  assert.equal((await proxy(request('precidoc.rainc.tech', '/app'))).headers.get('x-middleware-next'), '1');
  assert.equal(authCalls, 1);
  authUnavailable = true;
  const failed = await proxy(request('precidoc.rainc.tech', '/app/private'));
  assert.equal(failed.status, 307);assert.equal(failed.headers.get('location'), 'https://precidoc.rainc.tech/auth/sign-in');
  assert.equal(authCalls, 2);
  console.log('Passed domain migration: exact root/path/query encoding, repeated parameters, method-preserving redirects, no public Auth calls or redirect loops, and private workspace Auth fallback.');
})().catch(error => { console.error(error);process.exitCode = 1; }).finally(() => { Module._load = originalLoad;if (originalTs) require.extensions['.ts'] = originalTs;else delete require.extensions['.ts']; });
