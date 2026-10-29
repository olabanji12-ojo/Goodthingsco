import { build } from 'esbuild';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'node_modules/.cache'), { recursive: true });
const folder = await mkdtemp(resolve(root, 'node_modules/.cache/payment-tests-'));

try {
  await build({
    absWorkingDir: root,
    entryPoints: [
      'tests/payment/paystack.test.ts',
      'tests/payment/flutterwave.test.ts',
    ],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    packages: 'external',
    outdir: folder,
  });
  const child = spawnSync(
    process.execPath,
    ['--test', resolve(folder, 'paystack.test.js'), resolve(folder, 'flutterwave.test.js')],
    { cwd: root, stdio: 'inherit', env: process.env }
  );
  process.exitCode = child.status ?? 1;
} finally {
  await rm(folder, { recursive: true, force: true }).catch(() => {});
}
