import { build } from 'esbuild';
import { mkdir, mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'node_modules/.cache'), { recursive: true });
const folder = await mkdtemp(resolve(root, 'node_modules/.cache/content-tests-'));
const output = resolve(folder, 'runner.cjs');

try {
  const result = await build({
    absWorkingDir: root,
    entryPoints: ['tests/content/content.test.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    packages: 'external',
    write: false,
  });
  await writeFile(output, result.outputFiles[0].contents);
  const child = spawnSync(process.execPath, ['--test', output], { cwd: root, stdio: 'inherit', env: process.env });
  process.exitCode = child.status ?? 1;
} finally {
  await unlink(output).catch(() => {});
  await rmdir(folder).catch(() => {});
}
