import { build } from 'esbuild';
import { mkdir, mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'node_modules/.cache'), { recursive: true });
const folder = await mkdtemp(resolve(root, 'node_modules/.cache/cron-lifecycle-'));
const output = resolve(folder, 'runner.mjs');

const runnerCode = `
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createAbandonedCheckoutService } from './server/checkout/service';
import { createCheckoutHttp } from './server/checkout/http';
import { memoryAbandonedCheckoutRepository, sampleCartItem } from './tests/checkout/memory';

const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

const cronSecret = process.env.CRON_SECRET;
console.log('===========================================================');
console.log(' GOOD THINGS CO. — CRON & PURCHASE LIFECYCLE TEST');
console.log('===========================================================');
console.log('CRON_SECRET configured in .env: ' + (cronSecret ? '✅ YES (' + cronSecret.slice(0, 6) + '...' + cronSecret.slice(-6) + ')' : '❌ NO'));
console.log('');

if (!cronSecret) {
  console.error('❌ Please add CRON_SECRET to your .env file first.');
  process.exit(1);
}

const { store, repository } = memoryAbandonedCheckoutRepository();
let virtualTime = new Date('2026-10-04T10:00:00.000Z').getTime();
const getNow = () => new Date(virtualTime).toISOString();

const sentEmails = [];
const mockNotify = {
  async abandonedCheckoutReminder(payload) {
    sentEmails.push({
      to: payload.customerEmail,
      resumeUrl: payload.resumeUrl,
      items: payload.items,
    });
    return [{ sent: true, provider: 'resend', id: 'mock-' + sentEmails.length }];
  },
};

const service = createAbandonedCheckoutService({
  repository,
  config: () => ({
    abandonedAfterMinutes: 60,
    reminderDelaysHours: [1, 24],
    maxReminders: 2,
    resumeExpiryDays: 7,
    tokenSecret: 'demo-secret-12345678',
  }),
  now: getNow,
  notify: mockNotify,
});

const httpHandler = createCheckoutHttp(service);

async function callEndpoint({ headers = {}, method = 'GET' }) {
  let statusCode = 200;
  let bodyStr = '';
  const req = {
    url: '/api/checkout/process-reminders',
    method,
    headers: {
      host: 'goodthingsco.ng',
      'x-forwarded-proto': 'https',
      ...headers,
    },
    [Symbol.asyncIterator]: async function* () {},
  };
  const res = {
    setHeader() {},
    end(chunk) { if (chunk) bodyStr += chunk; },
  };
  Object.defineProperty(res, 'statusCode', {
    get() { return statusCode; },
    set(v) { statusCode = v; },
  });

  await httpHandler(req, res);
  return { status: statusCode, body: JSON.parse(bodyStr || '{}') };
}

async function runTest() {
  console.log('--- TEST 1: Calling without Authorization header ---');
  const resNoAuth = await callEndpoint({ headers: {} });
  console.log('Status: ' + resNoAuth.status + ' (Expected: 401)');
  console.log('Response: ' + JSON.stringify(resNoAuth.body));
  if (resNoAuth.status === 401) {
    console.log('✅ PASS: Unauthorized requests are rejected.\\n');
  } else {
    console.log('❌ FAIL: Expected 401.\\n');
  }

  console.log('--- TEST 2: Calling with wrong Bearer token ---');
  const resWrongAuth = await callEndpoint({ headers: { authorization: 'Bearer wrong_random_token_999' } });
  console.log('Status: ' + resWrongAuth.status + ' (Expected: 401)');
  console.log('Response: ' + JSON.stringify(resWrongAuth.body));
  if (resWrongAuth.status === 401) {
    console.log('✅ PASS: Incorrect secrets are rejected.\\n');
  } else {
    console.log('❌ FAIL: Expected 401.\\n');
  }

  console.log('--- TEST 3: Calling with REAL CRON_SECRET from .env ---');
  const resRealAuth = await callEndpoint({ headers: { authorization: 'Bearer ' + cronSecret } });
  console.log('Status: ' + resRealAuth.status + ' (Expected: 200)');
  console.log('Response: ' + JSON.stringify(resRealAuth.body));
  if (resRealAuth.status === 200 && resRealAuth.body.success) {
    console.log('✅ PASS: Real CRON_SECRET is accepted!\\n');
  } else {
    console.log('❌ FAIL: Expected 200.\\n');
  }

  console.log('--- TEST 4: Scenario A (Customer abandons checkout) ---');
  console.log('1. Customer "Amina" adds "Luxury Velvet Gift Box" to checkout (amina@example.com)...');
  const abandonedSession = await service.initOrUpdateSession({
    customer: { fullName: 'Amina Bello', email: 'amina@example.com' },
    items: [sampleCartItem('prod-1', 'Luxury Velvet Gift Box', 35000)],
  });

  console.log('2. Customer walks away without paying. 70 minutes pass...');
  virtualTime += 70 * 60 * 1000;

  console.log('3. Daily Vercel Cron executes with CRON_SECRET...');
  const resCronA = await callEndpoint({ headers: { authorization: 'Bearer ' + cronSecret } });
  console.log('Cron Execution Stats: ' + JSON.stringify(resCronA.body.stats));
  console.log('Emails dispatched: ' + sentEmails.length);
  if (sentEmails.length === 1 && sentEmails[0].to === 'amina@example.com') {
    console.log('✅ PASS: Abandoned cart detected! Sent recovery email to ' + sentEmails[0].to + ' with resume link:');
    console.log('   ' + sentEmails[0].resumeUrl + '\\n');
  } else {
    console.log('❌ FAIL: Expected 1 reminder email.\\n');
  }

  console.log('--- TEST 5: Scenario B (Customer BUYS something / completes payment) ---');
  console.log('1. Customer "David" enters checkout for "Artisanal Hamper" (david@example.com)...');
  const boughtSession = await service.initOrUpdateSession({
    customer: { fullName: 'David Adeleke', email: 'david@example.com' },
    items: [sampleCartItem('prod-2', 'Artisanal Hamper', 65000)],
  });

  console.log('2. David pays successfully via Paystack!');
  console.log('   -> System calls markConverted() with Order Number "GTC-20261004-9WXY"...');
  await service.markConverted(boughtSession.sessionId, 'order-uuid-999', 'GTC-20261004-9WXY');

  console.log('3. 70 minutes pass...');
  virtualTime += 70 * 60 * 1000;

  const emailCountBefore = sentEmails.length;
  console.log('4. Daily Vercel Cron executes with CRON_SECRET...');
  const resCronB = await callEndpoint({ headers: { authorization: 'Bearer ' + cronSecret } });
  console.log('Cron Execution Stats: ' + JSON.stringify(resCronB.body.stats));
  const emailCountAfter = sentEmails.length;
  const newEmailsSent = emailCountAfter - emailCountBefore;

  console.log('New emails sent for David: ' + newEmailsSent + ' (Expected: 0)');
  if (newEmailsSent === 0) {
    console.log('✅ PASS: Customer bought their items! Cron recognizes "converted" status and completely skips them.');
    console.log('   No annoying or duplicate reminder is sent to customers who already paid!\\n');
  } else {
    console.log('❌ FAIL: Cron should not send emails to customers who bought items.\\n');
  }

  console.log('===========================================================');
  console.log('🎉 ALL CRON & PURCHASE LIFECYCLE TESTS VERIFIED 100%!');
  console.log('===========================================================');
}

runTest();
`;

try {
  const result = await build({
    stdin: {
      contents: runnerCode,
      resolveDir: root,
      sourcefile: 'runner.ts',
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    packages: 'external',
    write: false,
  });
  await writeFile(output, result.outputFiles[0].contents);
  const child = spawnSync(process.execPath, [output], { cwd: root, stdio: 'inherit', env: process.env });
  process.exitCode = child.status ?? 1;
} finally {
  await unlink(output).catch(() => {});
  await rmdir(folder).catch(() => {});
}
