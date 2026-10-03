// This import deliberately prevents this module from being bundled for browsers.
import { env } from 'node:process';

export interface EmailConfig {
  apiKey: string;
  from: string;
  replyTo: string;
  adminEmail: string;
  configured: boolean;
}

export function isEmailAddress(value: string): boolean {
  return value.length <= 254 && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value);
}

function isSender(value: string): boolean {
  if (/[\r\n]/.test(value)) return false;
  const match = value.match(/^[^<>]+<([^<>]+)>$/);
  return isEmailAddress(match ? match[1] : value);
}

// Read at send time: environment loading may happen after module imports in Vite.
export function getEmailConfig(source: NodeJS.ProcessEnv = env): EmailConfig {
  const apiKey = source.RESEND_API_KEY?.trim() || '';
  const from = source.EMAIL_FROM?.trim() || '';
  const replyTo = source.EMAIL_REPLY_TO?.trim() || '';
  const adminEmail = source.ADMIN_NOTIFICATION_EMAIL?.trim() || '';
  return {
    apiKey, from, replyTo, adminEmail,
    configured: Boolean(apiKey && !/\s/.test(apiKey) && isSender(from)
      && isEmailAddress(replyTo) && isEmailAddress(adminEmail)),
  };
}
