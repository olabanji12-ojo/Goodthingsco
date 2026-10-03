import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createSettingsManagement } from '../../server/settings/service';
import { createMemorySettingsRepository } from './memory';
import {
  calculateEffectiveDeliveryFee,
  SettingsHttpError,
} from '../../server/settings/domain';
import { getDeliveryFeeCalculation } from '../../src/config/shipping';
import { createAbandonedCheckoutService } from '../../server/checkout/service';
import { createCorporateManagement } from '../../server/corporate/service';
import { createCustomManagement } from '../../server/custom/service';
import { memoryCorporateRepository } from '../corporate/memory';
import { memoryCustomRepository, sampleCustomRequest } from '../custom/memory';

describe('Admin Settings & Delivery Rate Management Phase Test Suite', () => {
  const adminToken = 'Bearer valid-admin-token';
  const userToken = 'Bearer normal-user-token';

  const mockVerify = async (token: string) => {
    if (token === 'valid-admin-token') return { uid: 'adm-1', admin: true, email: 'admin@goodthingsco.ng' };
    if (token === 'normal-user-token') return { uid: 'usr-1', admin: false, email: 'customer@example.com' };
    throw new Error('Invalid or revoked token');
  };

  let repo: ReturnType<typeof createMemorySettingsRepository>;
  let service: ReturnType<typeof createSettingsManagement>;

  beforeEach(() => {
    repo = createMemorySettingsRepository();
    service = createSettingsManagement({
      repository: repo,
      verify: mockVerify,
      now: () => '2026-10-03T12:00:00.000Z',
    });
  });

  // 1–5: Settings Load & Persistence
  it('1. Admin loads settings and existing default values display accurately', async () => {
    const settings = await service.getStoreSettings();
    assert.equal(settings.business.brandName, 'Good Things Co.');
    assert.equal(settings.shipping.lagos.fee, 3500);
    assert.equal(settings.shipping.lagos.enabled, true);
    assert.equal(settings.shipping.otherNigeria.fee, 7500);
    assert.equal(settings.shipping.international.mode, 'quote-required');
    assert.equal(settings.abandonedCheckout.abandonedAfterMinutes, 60);
    assert.deepEqual(settings.abandonedCheckout.reminderDelaysHours, [1, 24]);
    assert.equal(settings.quotes.corporateDefaultValidityDays, 7);
  });

  it('2. Public safe settings endpoint returns only non-sensitive presentation fields', async () => {
    const pub = await service.getPublicStoreSettings();
    assert.equal(pub.business.brandName, 'Good Things Co.');
    assert.equal(pub.shipping.lagos.fee, 3500);
    // Ensure internal operational parameters are NOT in public settings
    assert.equal((pub as any).abandonedCheckout, undefined);
    assert.equal((pub as any).quotes, undefined);
    assert.equal((pub as any).updatedBy, undefined);
  });

  it('3. Update Lagos delivery fee and confirm persistence across fetches', async () => {
    const updated = await service.updateStoreSettings(adminToken, {
      shipping: {
        lagos: { fee: 4200 },
      },
    });
    assert.equal(updated.shipping.lagos.fee, 4200);

    const reloaded = await service.getStoreSettings();
    assert.equal(reloaded.shipping.lagos.fee, 4200);
    assert.equal(reloaded.updatedBy, 'admin@goodthingsco.ng');
    assert.equal(reloaded.updatedAt, '2026-10-03T12:00:00.000Z');
  });

  it('4. Update Other Nigeria delivery fee and estimates', async () => {
    const updated = await service.updateStoreSettings(adminToken, {
      shipping: {
        otherNigeria: {
          fee: 8500,
          estimatedMinDays: 4,
          estimatedMaxDays: 6,
          label: 'Premium Interstate Dispatch',
        },
      },
    });
    assert.equal(updated.shipping.otherNigeria.fee, 8500);
    assert.equal(updated.shipping.otherNigeria.estimatedMinDays, 4);
    assert.equal(updated.shipping.otherNigeria.estimatedMaxDays, 6);
    assert.equal(updated.shipping.otherNigeria.label, 'Premium Interstate Dispatch');
  });

  it('5. Update International shipping mode from quote-required to fixed fee', async () => {
    const updated = await service.updateStoreSettings(adminToken, {
      shipping: {
        international: {
          mode: 'fixed',
          fee: 35000,
          estimatedMinDays: 4,
          estimatedMaxDays: 8,
          notice: 'DHL Express worldwide delivery with tracking.',
        },
      },
    });
    assert.equal(updated.shipping.international.mode, 'fixed');
    assert.equal(updated.shipping.international.fee, 35000);
    assert.equal(updated.shipping.international.estimatedMinDays, 4);
  });

  it('6. Update Business contact details', async () => {
    const updated = await service.updateStoreSettings(adminToken, {
      business: {
        brandName: 'Good Things Co. Atelier',
        supportEmail: 'concierge@goodthingsco.ng',
        supportPhone: '+234 812 345 6789',
      },
    });
    assert.equal(updated.business.brandName, 'Good Things Co. Atelier');
    assert.equal(updated.business.supportEmail, 'concierge@goodthingsco.ng');
    assert.equal(updated.business.supportPhone, '+234 812 345 6789');
  });

  it('7. Update Abandoned Checkout timing, delays array, and limits', async () => {
    const updated = await service.updateStoreSettings(adminToken, {
      abandonedCheckout: {
        abandonedAfterMinutes: 45,
        reminderDelaysHours: [2, 12, 48],
        maxReminders: 3,
        resumeExpiryDays: 14,
      },
    });
    assert.equal(updated.abandonedCheckout.abandonedAfterMinutes, 45);
    assert.deepEqual(updated.abandonedCheckout.reminderDelaysHours, [2, 12, 48]);
    assert.equal(updated.abandonedCheckout.maxReminders, 3);
    assert.equal(updated.abandonedCheckout.resumeExpiryDays, 14);
  });

  it('8. Reminder delays validation sorts, deduplicates, and rejects invalid inputs', async () => {
    const updated = await service.updateStoreSettings(adminToken, {
      abandonedCheckout: {
        reminderDelaysHours: [48, 2, 24, 2], // unordered & duplicate
      },
    });
    assert.deepEqual(updated.abandonedCheckout.reminderDelaysHours, [2, 24, 48]);

    await assert.rejects(
      () =>
        service.updateStoreSettings(adminToken, {
          abandonedCheckout: {
            reminderDelaysHours: [],
          },
        }),
      /At least one valid positive reminder delay/
    );
  });

  it('9. Update Quote validity defaults', async () => {
    const updated = await service.updateStoreSettings(adminToken, {
      quotes: {
        corporateDefaultValidityDays: 14,
        customDefaultValidityDays: 10,
      },
    });
    assert.equal(updated.quotes.corporateDefaultValidityDays, 14);
    assert.equal(updated.quotes.customDefaultValidityDays, 10);
  });

  // 14–17: Authorization
  it('14. Public user without token cannot update settings', async () => {
    await assert.rejects(
      () => service.updateStoreSettings(undefined, { business: { brandName: 'Hacked' } }),
      (err: any) => err instanceof SettingsHttpError && err.statusCode === 401
    );
  });

  it('15. Authenticated non-admin customer cannot update settings', async () => {
    await assert.rejects(
      () => service.updateStoreSettings(userToken, { business: { brandName: 'Hacked' } }),
      (err: any) => err instanceof SettingsHttpError && err.statusCode === 403
    );
  });

  it('16. Valid administrator can update settings', async () => {
    const res = await service.updateStoreSettings(adminToken, {
      business: { brandName: 'Verified Good Things Co.' },
    });
    assert.equal(res.business.brandName, 'Verified Good Things Co.');
  });

  it('17. Invalid or revoked token is rejected with 401', async () => {
    await assert.rejects(
      () => service.updateStoreSettings('Bearer expired-token', { business: { brandName: 'Test' } }),
      (err: any) => err instanceof SettingsHttpError && err.statusCode === 401
    );
  });

  it('17a. getStoreSettingsAsAdmin without token returns 401', async () => {
    await assert.rejects(
      () => service.getStoreSettingsAsAdmin(undefined),
      (err: any) => err instanceof SettingsHttpError && err.statusCode === 401
    );
  });

  it('17b. getStoreSettingsAsAdmin with non-admin token returns 403', async () => {
    await assert.rejects(
      () => service.getStoreSettingsAsAdmin(userToken),
      (err: any) => err instanceof SettingsHttpError && err.statusCode === 403
    );
  });

  it('17c. getStoreSettingsAsAdmin with valid admin token returns full settings', async () => {
    const settings = await service.getStoreSettingsAsAdmin(adminToken);
    assert.equal(settings.business.brandName, 'Good Things Co.');
    assert.ok(typeof settings.abandonedCheckout.abandonedAfterMinutes === 'number');
    assert.ok(typeof settings.quotes.corporateDefaultValidityDays === 'number');
  });

  // 18–24: Checkout & Shipping Calculation
  it('18. Checkout calculation uses configured Lagos delivery fee', async () => {
    await service.updateStoreSettings(adminToken, {
      shipping: { lagos: { fee: 5000 } },
    });
    const liveShipping = await service.getEffectiveShipping();
    const calc = getDeliveryFeeCalculation('lagos', liveShipping);
    assert.equal(calc.fee, 5000);
    assert.equal(calc.enabled, true);
    assert.equal(calc.requiresQuote, false);
  });

  it('19. Checkout calculation uses configured Other Nigeria delivery fee', async () => {
    await service.updateStoreSettings(adminToken, {
      shipping: { otherNigeria: { fee: 9000, estimatedMinDays: 3, estimatedMaxDays: 4 } },
    });
    const liveShipping = await service.getEffectiveShipping();
    const calc = getDeliveryFeeCalculation('other-nigeria', liveShipping);
    assert.equal(calc.fee, 9000);
    assert.equal(calc.estimatedDeliveryTime, '3–4 business days');
  });

  it('20. International quote-required returns requiresQuote=true and zero fee', async () => {
    const liveShipping = await service.getEffectiveShipping();
    const calc = getDeliveryFeeCalculation('international', liveShipping);
    assert.equal(calc.requiresQuote, true);
    assert.equal(calc.fee, 0);
  });

  it('21. International fixed fee mode returns configured fee and requiresQuote=false', async () => {
    await service.updateStoreSettings(adminToken, {
      shipping: {
        international: {
          mode: 'fixed',
          fee: 28000,
        },
      },
    });
    const liveShipping = await service.getEffectiveShipping();
    const calc = getDeliveryFeeCalculation('international', liveShipping);
    assert.equal(calc.requiresQuote, false);
    assert.equal(calc.fee, 28000);
  });

  it('22. Disabled shipping zone reports enabled=false and prevents delivery', async () => {
    await service.updateStoreSettings(adminToken, {
      shipping: {
        lagos: { enabled: false },
      },
    });
    const liveShipping = await service.getEffectiveShipping();
    const calc = getDeliveryFeeCalculation('lagos', liveShipping);
    assert.equal(calc.enabled, false);
  });

  it('23. Authoritative delivery fee calculation handles all zones correctly', async () => {
    const shipping = await service.getEffectiveShipping();
    const lagosFee = calculateEffectiveDeliveryFee('lagos', shipping);
    assert.equal(lagosFee.fee, 3500);

    const intlFee = calculateEffectiveDeliveryFee('international', shipping);
    assert.equal(intlFee.requiresQuote, true);
    assert.equal(intlFee.fee, 0);
  });

  // 25–28: Abandoned Checkout Settings Integration
  it('25. Abandoned checkout service reflects live reminder threshold and expiry', async () => {
    await service.updateStoreSettings(adminToken, {
      abandonedCheckout: {
        abandonedAfterMinutes: 30,
        resumeExpiryDays: 10,
        maxReminders: 3,
        reminderDelaysHours: [1, 12, 36],
      },
    });

    const memorySessions = new Map();
    const mockRepo: any = {
      getBySessionId: async (id: string) => memorySessions.get(id) || null,
      save: async (s: any) => {
        memorySessions.set(s.sessionId, s);
        return s;
      },
      update: async (id: string, patch: any) => {
        const cur = memorySessions.get(id);
        if (cur) Object.assign(cur, patch);
        return cur;
      },
      findEligibleForReminders: async () => [],
    };

    const checkoutService = createAbandonedCheckoutService({
      repository: mockRepo,
      config: async () => {
        const live = await service.getEffectiveAbandonedCheckout();
        return {
          abandonedAfterMinutes: live.abandonedAfterMinutes,
          reminderDelaysHours: live.reminderDelaysHours,
          maxReminders: live.maxReminders,
          resumeExpiryDays: live.resumeExpiryDays,
          tokenSecret: 'test-secret',
        };
      },
    });

    const sessionRes = await checkoutService.initOrUpdateSession({
      customer: { fullName: 'Funke Akindele', email: 'funke@example.com' },
      items: [
        {
          id: 'prod-1',
          name: 'Curated Box',
          price: 25000,
          quantity: 1,
        } as any,
      ],
    });

    const saved = memorySessions.get(sessionRes.session.sessionId);
    assert.ok(saved);
    const expiresAtMs = new Date(saved.expiresAt).getTime();
    const nowMs = Date.now();
    const daysDiff = Math.round((expiresAtMs - nowMs) / (86400 * 1000));
    assert.equal(daysDiff, 10);
  });

  // 29–31: Quote Defaults Integration
  it('29. New Corporate quote uses configured corporateDefaultValidityDays', async () => {
    await service.updateStoreSettings(adminToken, {
      quotes: { corporateDefaultValidityDays: 14 },
    });

    const { repository: corpRepo } = memoryCorporateRepository([]);

    const corpService = createCorporateManagement({
      repository: corpRepo,
      verify: mockVerify,
      settings: service,
      now: () => '2026-10-03T12:00:00.000Z',
    });

    const created = await corpService.submitRequest({
      company: {
        companyName: 'Zenith Holdings',
        contactName: 'Ngozi Okonjo',
        email: 'ngozi@zenith.com',
        phone: '+234 802 111 2222',
      },
      giftingPurpose: 'client',
      giftType: 'choose-gift',
      budgetRange: '50000-100000',
      quantity: 100,
      recipients: [{ name: 'Ngozi', address: 'Victoria Island, Lagos' }],
      delivery: {
        preferredDeliveryDate: '2026-10-25',
        deliveryMethod: 'single-hub',
      },
    });

    const draft = await corpService.saveQuoteDraft(adminToken, created.request.id!, {
      action: 'draft',
      subtotal: 3500000,
      deliveryFee: 50000,
    });

    assert.ok(draft.quote.validUntil);
    // Calculated date should be 14 days from 2026-10-03 -> 2026-10-17
    assert.equal(draft.quote.validUntil, '2026-10-17');
  });

  it('30. New Custom quote uses configured customDefaultValidityDays', async () => {
    await service.updateStoreSettings(adminToken, {
      quotes: { customDefaultValidityDays: 21 },
    });

    const { repository: custRepo, store: custStore } = memoryCustomRepository([]);

    const sample = sampleCustomRequest();
    sample.quote.status = 'not-prepared';
    sample.quote.validUntil = undefined;
    custStore.set(sample.id, sample);

    const custService = createCustomManagement({
      repository: custRepo,
      verify: mockVerify,
      settings: service,
      now: () => '2026-10-03T12:00:00.000Z',
    });

    const draft = await custService.saveQuoteDraft(adminToken, sample.id, {
      subtotal: 150000,
      designFee: 25000,
    });

    assert.ok(draft.quote.validUntil);
    // Calculated date should be 21 days from 2026-10-03 -> 2026-10-24
    assert.equal(draft.quote.validUntil, '2026-10-24');
  });

  it('31. Existing quote validity is NOT retroactively changed when store settings change', async () => {
    // 1. Initial settings = 7 days
    const { repository: corpRepo } = memoryCorporateRepository([]);

    const corpService = createCorporateManagement({
      repository: corpRepo,
      verify: mockVerify,
      settings: service,
      now: () => '2026-10-03T12:00:00.000Z',
    });

    const created = await corpService.submitRequest({
      company: {
        companyName: 'Sterling Capital',
        contactName: 'Adeola Johnson',
        email: 'adeola@sterling.com',
        phone: '+234 803 999 8888',
      },
      giftingPurpose: 'client',
      giftType: 'choose-gift',
      budgetRange: '50000-100000',
      quantity: 50,
      recipients: [{ name: 'Adeola', address: 'Ikoyi, Lagos' }],
      delivery: {
        preferredDeliveryDate: '2026-10-25',
        deliveryMethod: 'single-hub',
      },
    });

    const draft1 = await corpService.saveQuoteDraft(adminToken, created.request.id!, {
      action: 'draft',
      subtotal: 1000000,
      validUntil: '2026-10-10', // 7 days
    });
    assert.equal(draft1.quote.validUntil, '2026-10-10');

    // 2. Admin changes store setting to 30 days
    await service.updateStoreSettings(adminToken, {
      quotes: { corporateDefaultValidityDays: 30 },
    });

    // 3. Admin modifies subtotal on the same quote without entering a new validity date
    const updatedDraft = await corpService.saveQuoteDraft(adminToken, created.request.id!, {
      action: 'draft',
      subtotal: 1100000,
    });

    // The previously saved validity date must be preserved!
    assert.equal(updatedDraft.quote.validUntil, '2026-10-10');
  });
});
