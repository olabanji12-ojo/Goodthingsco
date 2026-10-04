import type { AbandonedCheckoutSettings } from '../../src/types/settings.js';

export interface AbandonedCheckoutConfig {
  abandonedAfterMinutes: number;
  reminderDelaysHours: number[];
  maxReminders: number;
  resumeExpiryDays: number;
  tokenSecret: string;
}

export function getAbandonedCheckoutConfig(liveSettings?: AbandonedCheckoutSettings): AbandonedCheckoutConfig {
  const env = process.env;
  const tokenSecret = env.CHECKOUT_TOKEN_SECRET || env.PAYSTACK_SECRET_KEY || 'goodthingsco-abandoned-checkout-secret';

  if (liveSettings) {
    return {
      abandonedAfterMinutes: liveSettings.abandonedAfterMinutes,
      reminderDelaysHours: liveSettings.reminderDelaysHours,
      maxReminders: liveSettings.maxReminders,
      resumeExpiryDays: liveSettings.resumeExpiryDays,
      tokenSecret,
    };
  }

  const afterMinutes = parseInt(env.ABANDONED_CHECKOUT_AFTER_MINUTES || '60', 10);
  const rawDelays = env.ABANDONED_REMINDER_DELAYS_HOURS || '1,24';
  const reminderDelaysHours = rawDelays
    .split(',')
    .map(s => parseFloat(s.trim()))
    .filter(n => Number.isFinite(n) && n >= 0);

  const maxReminders = parseInt(env.ABANDONED_MAX_REMINDERS || '2', 10);
  const expiryDays = parseInt(env.ABANDONED_RESUME_EXPIRY_DAYS || '7', 10);

  return {
    abandonedAfterMinutes: Number.isFinite(afterMinutes) && afterMinutes > 0 ? afterMinutes : 60,
    reminderDelaysHours: reminderDelaysHours.length > 0 ? reminderDelaysHours : [1, 24],
    maxReminders: Number.isFinite(maxReminders) && maxReminders >= 0 ? maxReminders : 2,
    resumeExpiryDays: Number.isFinite(expiryDays) && expiryDays > 0 ? expiryDays : 7,
    tokenSecret,
  };
}

