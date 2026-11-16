import { build } from 'esbuild';
import { mkdir, mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'node_modules/.cache'), { recursive: true });
const folder = await mkdtemp(resolve(root, 'node_modules/.cache/pkg-tests-'));
const output = resolve(folder, 'runner.cjs');

try {
  const result = await build({
    absWorkingDir: root,
    entryPoints: ['tests/packaging/productPackaging.test.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    packages: 'external',
    define: {
      'import.meta.env': 'process.env',
    },
    write: false,
  });
  await writeFile(output, result.outputFiles[0].contents);
  const child = spawnSync(process.execPath, ['--test', output], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_FIREBASE_API_KEY: 'AIzaSyFakeKeyForTestRunnerMocking123',
      VITE_FIREBASE_AUTH_DOMAIN: 'good-things-mock.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'good-things-mock',
      VITE_FIREBASE_STORAGE_BUCKET: 'good-things-mock.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
      VITE_FIREBASE_APP_ID: '1:1234567890:web:abcdef123456',
    },
  });
  process.exitCode = child.status ?? 1;
} finally {
  await unlink(output).catch(() => {});
  await rmdir(folder).catch(() => {});
}
