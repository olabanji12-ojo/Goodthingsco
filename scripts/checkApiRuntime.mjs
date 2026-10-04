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

// Exercise routing without accessing Firebase, Paystack, or creating records.
for (const request of [
  { url: '/api/runtime-smoke-test', method: 'GET', headers: {}, expected: 404 },
  { url: '/api/checkout/session', method: 'GET', headers: {}, expected: 405 },
  { url: '/api?path=checkout/session', method: 'GET', headers: { 'x-matched-path': '/api/checkout/session' }, expected: 405 },
  { url: '/api/paystack/initialize', method: 'GET', headers: {}, expected: 404 },
]) {
  const response = createRes();
  await handler(request, response);
  assert.equal(response.statusCode, request.expected);
  assert.equal(body.success, false);
  assert.match(headers['content-type'], /application\/json/);
}
console.info('API startup and routing passed without require(ESM) support. No external writes.');
