import { build } from 'esbuild';
import { mkdir, mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
if (!['test', 'preview', 'send-test'].includes(mode)) throw new Error('Use test, preview or send-test');
const cache = resolve(root, 'node_modules/.cache');
await mkdir(cache, { recursive: true });
const directory = await mkdtemp(resolve(cache, 'goodthings-email-'));
const output = resolve(directory, mode === 'test' ? 'runner.cjs' : 'runner.mjs');
try {
  const result = await build({
    absWorkingDir: root,
    entryPoints: [mode === 'test' ? 'tests/email/email.test.ts' : 'scripts/emailCommand.ts'],
    bundle: true, platform: 'node', target: 'node20', format: mode === 'test' ? 'cjs' : 'esm', packages: 'external', write: false,
    plugins: mode === 'test' ? [{ name: 'isolated-order-tests', setup(builder) {
      // Only test builds substitute Firebase and Paystack. No network or live writes.
      builder.onResolve({ filter: /^firebase\/firestore$/ }, () => ({ path: resolve(root, 'tests/email/orderMocks.ts') }));
      builder.onResolve({ filter: /^\.\/orderFirestore$/ }, () => ({ path: resolve(root, 'tests/email/orderMocks.ts') }));
      builder.onResolve({ filter: /^\.\/firebase$/ }, args => args.importer.endsWith('orderService.ts')
        ? { path: resolve(root, 'tests/email/orderMocks.ts') } : undefined);
      builder.onResolve({ filter: /^\.\/paystackService$/ }, args => args.importer.endsWith('orderService.ts')
        ? { path: resolve(root, 'tests/email/orderMocks.ts') } : undefined);
    } }] : [],
  });
  await writeFile(output, result.outputFiles[0].contents);
  const child = spawnSync(process.execPath, mode === 'test'
    ? ['--test', output] : [output, mode, ...process.argv.slice(3)], { cwd: root, stdio: 'inherit', env: process.env });
  process.exitCode = child.status ?? 1;
} finally {
  await unlink(output).catch(() => {});
  await rmdir(directory);
}
