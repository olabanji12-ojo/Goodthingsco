/**
 * Good Things Co. — Abandoned Checkout Orchestration Service
 */

import { getAbandonedCheckoutConfig, type AbandonedCheckoutConfig } from './abandonedConfig';
import { settingsService } from '../settings/service';
import {
  firestoreAbandonedCheckouts,
  type AbandonedCheckoutRepository,
} from './repository';
import {
  CheckoutHttpError,
  createResumeToken,
  generateSessionId,
  hashResumeToken,
  sanitizeSessionForPersistence,
  verifyResumeToken,
} from './domain';
import { revalidateRecoveredCheckout } from './revalidation';
import { notificationService } from '../services/notificationService';
import type {
  AbandonedCheckoutSession,
  CheckoutSessionInput,
  RecoveredCheckoutPayload,
} from '../../src/types/abandonedCheckout';

interface ServiceDependencies {
  repository?: AbandonedCheckoutRepository;
  config?: () => AbandonedCheckoutConfig | Promise<AbandonedCheckoutConfig>;
  notify?: typeof notificationService;
  revalidate?: typeof revalidateRecoveredCheckout;
  now?: () => string;
}

export function createAbandonedCheckoutService(dependencies: ServiceDependencies = {}) {
  const repo = dependencies.repository || firestoreAbandonedCheckouts;
  const notify = dependencies.notify || notificationService;
  const revalidate = dependencies.revalidate || revalidateRecoveredCheckout;
  const getNow = dependencies.now || (() => new Date().toISOString());

  async function resolveConfig(): Promise<AbandonedCheckoutConfig> {
    if (dependencies.config) {
      return await dependencies.config();
    }
    try {
      const live = await settingsService.getEffectiveAbandonedCheckout();
      return getAbandonedCheckoutConfig(live);
    } catch {
      return getAbandonedCheckoutConfig();
    }
  }

  return {
    async initOrUpdateSession(
      input: CheckoutSessionInput,
      origin: string = 'https://goodthingsco.ng'
    ): Promise<{ session: AbandonedCheckoutSession; sessionId: string; resumeToken: string; resumeUrl: string }> {
      const config = await resolveConfig();
      let existing: AbandonedCheckoutSession | null = null;

      if (input.sessionId) {
        existing = await repo.getBySessionId(input.sessionId);
      }

      const sessionId = existing?.sessionId || generateSessionId();
      const resumeToken = createResumeToken(sessionId, config.tokenSecret);
      const tokenHash = hashResumeToken(resumeToken);
      const now = getNow();
      const expiryDate = new Date(new Date(now).getTime() + config.resumeExpiryDays * 86400 * 1000).toISOString();

      const sessionData = sanitizeSessionForPersistence(input, existing, {
        sessionId,
        tokenHash,
        now,
        expiryDate,
      });

      const saved = await repo.save(sessionData);
      const resumeUrl = `${origin.replace(/\/$/, '')}/resume-checkout?token=${encodeURIComponent(resumeToken)}`;

      return {
        session: saved,
        sessionId: saved.sessionId,
        resumeToken,
        resumeUrl,
      };
    },

    async autosaveSession(
      sessionId: string,
      input: CheckoutSessionInput
    ): Promise<AbandonedCheckoutSession> {
      if (!sessionId || !sessionId.startsWith('ac_')) {
        throw new CheckoutHttpError(400, 'Invalid checkout session ID.');
      }

      const existing = await repo.getBySessionId(sessionId);
      if (!existing) {
        throw new CheckoutHttpError(404, 'Checkout session not found.');
      }

      if (existing.status === 'converted') {
        return existing;
      }

      const now = getNow();
      const sessionData = sanitizeSessionForPersistence(input, existing, {
        sessionId,
        tokenHash: existing.resumeTokenHash,
        now,
      });

      return repo.save(sessionData);
    },

    async resumeCheckout(token: string): Promise<RecoveredCheckoutPayload> {
      if (!token || typeof token !== 'string') {
        throw new CheckoutHttpError(400, 'A valid recovery token is required.');
      }

      const config = await resolveConfig();
      const verification = verifyResumeToken(token, config.tokenSecret);
      if (!verification.valid || !verification.sessionId) {
        throw new CheckoutHttpError(404, 'We could not find a saved checkout matching this link.');
      }

      const tokenHash = hashResumeToken(token);
      let session = await repo.getByTokenHash(tokenHash);

      if (!session) {
        session = await repo.getBySessionId(verification.sessionId);
        if (!session || session.resumeTokenHash !== tokenHash) {
          throw new CheckoutHttpError(404, 'We could not find a saved checkout matching this link.');
        }
      }

      const now = getNow();

      if (session.status === 'converted') {
        throw new CheckoutHttpError(409, `This order (${session.convertedOrderNumber || 'completed'}) has already been placed!`);
      }

      if (session.expiresAt && session.expiresAt <= now) {
        throw new CheckoutHttpError(410, 'This checkout link has expired. Your items can still be discovered in the shop.');
      }

      // Revalidate stock, prices, availability, delivery
      const revalidation = await revalidate(session.items, {
        country: session.delivery?.address?.country,
        state: session.delivery?.address?.state,
      });

      // Update session status to resumed
      await repo.update(session.sessionId, {
        status: 'resumed',
        lastActivityAt: now,
      });

      return {
        sessionId: session.sessionId,
        customer: {
          fullName: session.customer?.fullName || '',
          email: session.customer?.email || '',
          phone: session.customer?.phone || '',
        },
        recipient: {
          isSelf: Boolean(session.recipient?.isSelf),
          fullName: session.recipient?.fullName || '',
          phone: session.recipient?.phone || '',
        },
        delivery: {
          address: {
            addressLine1: session.delivery?.address?.addressLine1 || '',
            addressLine2: session.delivery?.address?.addressLine2 || '',
            city: session.delivery?.address?.city || '',
            state: session.delivery?.address?.state || 'Lagos',
            country: session.delivery?.address?.country || 'Nigeria',
            postalCode: session.delivery?.address?.postalCode || '',
          },
          zone: (session.delivery?.zone as any) || 'lagos',
          preferredDate: session.delivery?.preferredDate || '',
          specialInstructions: session.delivery?.specialInstructions || '',
        },
        giftMessage: session.giftMessage || '',
        items: revalidation.items,
        subtotal: revalidation.subtotal,
        deliveryFee: revalidation.deliveryFee,
        total: revalidation.total,
        currency: 'NGN',
        hasPriceChanges: revalidation.hasPriceChanges,
        hasUnavailableItems: revalidation.hasUnavailableItems,
        warnings: revalidation.warnings,
      };
    },

    async markConverted(
      sessionId: string,
      orderId: string,
      orderNumber: string
    ): Promise<void> {
      if (!sessionId) return;
      const now = getNow();
      await repo.markConverted(sessionId, orderId, orderNumber, now);
    },

    async markConvertedByEmail(
      email: string,
      orderId: string,
      orderNumber: string
    ): Promise<number> {
      if (!email) return 0;
      const now = getNow();
      return repo.markConvertedByEmail(email, orderId, orderNumber, now);
    },

    async processAbandonedCheckoutReminders(
      origin: string = 'https://goodthingsco.ng'
    ): Promise<{
      examined: number;
      eligible: number;
      sent: number;
      skipped: number;
      failed: number;
    }> {
      const config = await resolveConfig();
      const nowIso = getNow();
      const nowMs = new Date(nowIso).getTime();
      const abandonedThresholdIso = new Date(nowMs - config.abandonedAfterMinutes * 60 * 1000).toISOString();

      const candidates = await repo.findEligibleForReminders({
        nowIso,
        abandonedThresholdIso,
        maxReminders: config.maxReminders,
      });

      const stats = {
        examined: candidates.length,
        eligible: 0,
        sent: 0,
        skipped: 0,
        failed: 0,
      };

      for (const session of candidates) {
        const sentCount = session.reminderState?.sentCount || 0;
        if (sentCount >= config.maxReminders) continue;

        const customerEmail = session.customer?.email?.trim();
        if (!customerEmail || !customerEmail.includes('@')) {
          stats.skipped++;
          continue;
        }

        let eligibleAtMs: number;

        if (sentCount === 0) {
          eligibleAtMs = new Date(session.lastActivityAt).getTime() + config.abandonedAfterMinutes * 60 * 1000;
        } else {
          const delayHours = config.reminderDelaysHours[sentCount] ?? config.reminderDelaysHours.at(-1) ?? 24;
          const lastSentMs = session.reminderState?.lastSentAt
            ? new Date(session.reminderState.lastSentAt).getTime()
            : new Date(session.lastActivityAt).getTime();
          eligibleAtMs = lastSentMs + delayHours * 3600 * 1000;
        }

        if (nowMs < eligibleAtMs) {
          continue;
        }

        stats.eligible++;

        // Atomically claim this reminder
        const claimed = await repo.claimReminder(session.sessionId, sentCount, nowIso);
        if (!claimed) {
          continue; // Claimed by concurrent worker or already converted
        }

        // Generate secure resume link
        const resumeToken = createResumeToken(session.sessionId, config.tokenSecret);
        const resumeUrl = `${origin.replace(/\/$/, '')}/resume-checkout?token=${encodeURIComponent(resumeToken)}`;
        const eventId = `${session.sessionId}-reminder-${sentCount + 1}`;

        try {
          const notificationResult = await notify.abandonedCheckoutReminder({
            sessionId: session.sessionId,
            customerName: session.customer?.fullName || 'there',
            customerEmail,
            resumeUrl,
            items: session.items.map(i => ({ name: i.name, quantity: i.quantity, subtotal: i.subtotal })),
            eventId,
          });

          const primaryResult = notificationResult[0];

          if (primaryResult?.sent) {
            stats.sent++;
            const nextCount = sentCount + 1;
            const nextDelayHours = config.reminderDelaysHours[nextCount];
            const nextEligibleAt = nextDelayHours !== undefined && nextCount < config.maxReminders
              ? new Date(nowMs + nextDelayHours * 3600 * 1000).toISOString()
              : undefined;

            await repo.recordReminderResult(session.sessionId, {
              sentCount: nextCount,
              lastSentAt: nowIso,
              nextEligibleAt,
              lastEventId: eventId,
            });
          } else if (primaryResult?.skipped) {
            stats.skipped++;
            // Release claim so it can re-evaluate or stay skipped
            await repo.releaseReminderClaim(session.sessionId);
          } else {
            stats.failed++;
            // Provider error or timeout: release claim so it can safely retry later
            await repo.releaseReminderClaim(session.sessionId);
          }
        } catch (err) {
          stats.failed++;
          await repo.releaseReminderClaim(session.sessionId).catch(() => {});
        }
      }

      return stats;
    },
  };
}

export const abandonedCheckoutService = createAbandonedCheckoutService();
