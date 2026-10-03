import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Fake sentinel only. Never print or embed a real key for a boundary test.
const sentinel = 'resend-bundle-sentinel-not-a-real-key';
const result = spawnSync(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'build'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, RESEND_API_KEY: sentinel,
    EMAIL_FROM: 'bundle-sender@example.com', EMAIL_REPLY_TO: 'bundle-reply@example.com', ADMIN_NOTIFICATION_EMAIL: 'bundle-admin@example.com' },
});
assert.equal(result.status, 0, 'Production build must pass');
let count = 0;
async function inspect(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = resolve(folder, entry.name);
    if (entry.isDirectory()) await inspect(path);
    else if (/\.(js|html|map)$/.test(entry.name)) {
      const content = await readFile(path, 'utf8');
      for (const forbidden of [sentinel, 'RESEND_API_KEY', 'EMAIL_FROM', 'EMAIL_REPLY_TO', 'ADMIN_NOTIFICATION_EMAIL',
        'api.resend.com', 'bundle-sender@example.com', 'bundle-reply@example.com', 'bundle-admin@example.com']) {
        assert.ok(!content.includes(forbidden), `Server email configuration leaked into ${entry.name}`);
      }
      count++;
    }
  }
}
await inspect(resolve(root, 'dist'));
await assert.rejects(build({ absWorkingDir: root, entryPoints: ['server/services/emailService.ts'], bundle: true,
  platform: 'browser', write: false, logLevel: 'silent' }), 'Server email code must reject browser bundling');
console.info(`Email boundary verified: ${count} production files scanned; server email code rejects browser bundling.`);
