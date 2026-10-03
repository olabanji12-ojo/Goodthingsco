import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import { sendTestEmail } from '../server/services/emailService';
import { renderEmail } from '../server/email/templates';
import { sampleNotifications } from '../tests/email/fixtures';

async function main() {
  if (process.argv[2] === 'preview') {
    const folder = resolve('artifacts/email-previews');
    await mkdir(folder, { recursive: true });
    const notifications = sampleNotifications();
    for (const notification of notifications) {
      const template = renderEmail(notification);
      await writeFile(resolve(folder, `${notification.event}.html`), template.html);
      await writeFile(resolve(folder, `${notification.event}.txt`), `${template.subject}\n\n${template.text}`);
    }
    const links = notifications.map(n => `<li><a href="${n.event}.html">${n.event}</a></li>`).join('');
    await writeFile(resolve(folder, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email previews</title><body style="font:16px Arial;padding:24px;background:#FAF8F5"><h1>Good Things Co. email previews</h1><p>Fictional data. No email is sent. Abandoned checkout is a preview only.</p><ul>${links}</ul></body></html>`);
    console.info(`Email previews: ${folder}`);
    return;
  }
  // A local operator command only. There is deliberately no HTTP route.
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new Error('Run the email test command in a local development environment.');
  }
  const recipient = process.argv[3];
  if (!recipient) throw new Error('Usage: npm run email:test -- recipient@example.com');
  const loaded = loadEnv('development', process.cwd(), '');
  for (const [key, value] of Object.entries(loaded)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  process.env.NODE_ENV = 'development';
  const result = await sendTestEmail(recipient);
  console.info(JSON.stringify(result, null, 2));
  if (!result.sent && !result.skipped) process.exitCode = 1;
}
main().catch(() => {
  console.error('Email command failed. Use a local development environment and supply a valid test recipient.');
  process.exitCode = 1;
});
