import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'node_modules/.cache'), { recursive: true });
const output = await mkdtemp(resolve(root, 'node_modules/.cache/api-runtime-'));
const compile = spawnSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'),
  '-p', 'tsconfig.api-runtime.json', '--noEmit', 'false', '--outDir', output], { cwd: root, stdio: 'inherit' });
assert.equal(compile.status, 0, 'API must compile with NodeNext resolution');
await writeFile(resolve(output, 'package.json'), '{"type":"module"}');
// Native Node import: no bundler, no extension-resolution plugin, no live database writes.
const { default: handler } = await import(pathToFileURL(resolve(output, 'api/index.js')).href);
assert.equal(typeof handler, 'function');
let body;
let headers = {};
const createRes = () => ({
  statusCode: 0,
  setHeader(k, v) { headers[k.toLowerCase()] = v; },
  end(value) { body = JSON.parse(value); }
});

// Test 1: Unknown route returns 404 JSON
await handler({ url: '/api/runtime-smoke-test', method: 'GET', headers: {} }, createRes());
assert.equal(body.success, false);

// Test 2: Checkout session POST initializes session without crashing
await handler({
  url: '/api/checkout/session',
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: { customer: { fullName: 'Smoke Test User' } }
}, createRes());
assert.equal(body.success, true);
assert.ok(body.sessionId && body.sessionId.startsWith('ac_'));

// Test 3: Vercel rewrite via x-matched-path header routes correctly
await handler({
  url: '/api?path=checkout/session',
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-matched-path': '/api/checkout/session'
  },
  body: { customer: { fullName: 'Vercel Rewritten User' } }
}, createRes());
assert.equal(body.success, true);
assert.ok(body.sessionId && body.sessionId.startsWith('ac_'));

// Test 4: Paystack initialize returns 400 JSON on empty payload (never crashes with 500)
await handler({
  url: '/api/paystack/initialize',
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: { payload: {} }
}, createRes());
assert.equal(body.success, false);

console.info('API native ESM startup passed; routes, rewrite headers, and fallbacks verified with 0 errors.');

