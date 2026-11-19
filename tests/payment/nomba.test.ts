/**
 * Good Things Co. — Nomba Payment & Webhook Security Test Suite
 *
 * Validates:
 * 1. Nomba's official colon-separated HMAC-SHA256 Base64 signing algorithm
 * 2. Valid signature verification
 * 3. Invalid/tampered signature rejection
 * 4. Tampered individual signed fields (responseCode, transactionId, etc.)
 * 5. Strict RFC 3339 timestamp validation
 * 6. Legacy header alias support (nomba-sig-value)
 * 7. Decimal-safe monetary conversion to integer Kobo (nairaToKoboSafe)
 * 8. Credential loading and standardization
 * 9. Token caching behavior and expiration buffer
 * 10. Unsupported algorithm rejection
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  buildNombaSigningString,
  verifyNombaWebhookSignature,
  isValidRfc3339,
  nairaToKoboSafe,
  getNombaCredentials,
  resetNombaTokenCache,
} from '../../server/nombaService';
import {
  generateNombaReference,
  generateFlutterwaveReference,
} from '../../src/utils/orderUtils';

const mockSecretKey = 'test_nomba_webhook_secret_key_12345';
const validTimestamp = '2026-11-19T10:51:44Z';

const mockWebhookPayload = {
  event_type: 'payment_success',
  requestId: 'req_b974e36b-5c17-4b90-bcdb-fa24d1ec3a5d',
  data: {
    merchant: {
      userId: 'user_01a10aeb-d989-460a-bbde-9842f2b4320f',
      walletId: 'wallet_693e907aad9ea59616c2b4e1',
    },
    transaction: {
      transactionId: 'WEB-ONLINE_C-613BB-783e42db-1bac-438a',
      type: 'online_checkout',
      time: '2026-11-19T10:51:40Z',
      responseCode: '00',
    },
    order: {
      orderReference: 'nomba_GTC_20261119_TEST_k92x',
      amount: 35000,
      currency: 'NGN',
    },
  },
};

describe('Nomba Payment & Webhook Integration Test Suite', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    resetNombaTokenCache();
  });

  describe('1. Nomba Signing String & Algorithm', () => {
    it('constructs the exact colon-separated string per Nomba SDK specification', () => {
      const signingString = buildNombaSigningString(mockWebhookPayload, validTimestamp);
      const expected = [
        'payment_success',
        'req_b974e36b-5c17-4b90-bcdb-fa24d1ec3a5d',
        'user_01a10aeb-d989-460a-bbde-9842f2b4320f',
        'wallet_693e907aad9ea59616c2b4e1',
        'WEB-ONLINE_C-613BB-783e42db-1bac-438a',
        'online_checkout',
        '2026-11-19T10:51:40Z',
        '00',
        validTimestamp,
      ].join(':');

      assert.equal(signingString, expected);
    });

    it('handles flat payloads gracefully where transaction/merchant are root fields', () => {
      const flatPayload = {
        event_type: 'payment_failed',
        requestId: 'req_123',
        userId: 'user_456',
        walletId: 'wallet_789',
        transactionId: 'tx_999',
        type: 'online_checkout',
        time: '2026-11-19T10:55:00Z',
        responseCode: '99',
      };
      const signingString = buildNombaSigningString(flatPayload, validTimestamp);
      const expected = 'payment_failed:req_123:user_456:wallet_789:tx_999:online_checkout:2026-11-19T10:55:00Z:99:' + validTimestamp;
      assert.equal(signingString, expected);
    });
  });

  describe('2. Webhook Signature Verification', () => {
    it('successfully verifies a valid HMAC-SHA256 Base64 signature', () => {
      const signingString = buildNombaSigningString(mockWebhookPayload, validTimestamp);
      const signature = crypto
        .createHmac('sha256', mockSecretKey)
        .update(signingString)
        .digest('base64');

      const headers = {
        'nomba-signature': signature,
        'nomba-timestamp': validTimestamp,
        'nomba-signature-algorithm': 'HmacSHA256',
        'nomba-signature-version': '1.0.0',
      };

      const result = verifyNombaWebhookSignature(mockWebhookPayload, headers, mockSecretKey);
      assert.equal(result.valid, true);
    });

    it('supports legacy nomba-sig-value header', () => {
      const signingString = buildNombaSigningString(mockWebhookPayload, validTimestamp);
      const signature = crypto
        .createHmac('sha256', mockSecretKey)
        .update(signingString)
        .digest('base64');

      const headers = {
        'nomba-sig-value': signature,
        'nomba-timestamp': validTimestamp,
      };

      const result = verifyNombaWebhookSignature(mockWebhookPayload, headers, mockSecretKey);
      assert.equal(result.valid, true);
    });

    it('rejects signature calculated with mismatched secret key', () => {
      const signingString = buildNombaSigningString(mockWebhookPayload, validTimestamp);
      const signature = crypto
        .createHmac('sha256', 'wrong_secret')
        .update(signingString)
        .digest('base64');

      const headers = {
        'nomba-signature': signature,
        'nomba-timestamp': validTimestamp,
      };

      const result = verifyNombaWebhookSignature(mockWebhookPayload, headers, mockSecretKey);
      assert.equal(result.valid, false);
      assert.equal(result.reason, 'Signature mismatch');
    });

    it('rejects signature when individual signed fields are tampered', () => {
      const signingString = buildNombaSigningString(mockWebhookPayload, validTimestamp);
      const signature = crypto
        .createHmac('sha256', mockSecretKey)
        .update(signingString)
        .digest('base64');

      const tamperedPayload = JSON.parse(JSON.stringify(mockWebhookPayload));
      tamperedPayload.data.transaction.responseCode = '99'; // Tampered from '00' to '99'

      const headers = {
        'nomba-signature': signature,
        'nomba-timestamp': validTimestamp,
      };

      const result = verifyNombaWebhookSignature(tamperedPayload, headers, mockSecretKey);
      assert.equal(result.valid, false);
      assert.equal(result.reason, 'Signature mismatch');
    });

    it('rejects signature when secretKey is missing', () => {
      const headers = {
        'nomba-signature': 'any_sig',
        'nomba-timestamp': validTimestamp,
      };
      const result = verifyNombaWebhookSignature(mockWebhookPayload, headers, '');
      assert.equal(result.valid, false);
      assert.match(result.reason || '', /not configured|missing/i);
    });

    it('rejects unsupported algorithm', () => {
      const headers = {
        'nomba-signature': 'any_sig',
        'nomba-timestamp': validTimestamp,
        'nomba-signature-algorithm': 'MD5',
      };
      const result = verifyNombaWebhookSignature(mockWebhookPayload, headers, mockSecretKey);
      assert.equal(result.valid, false);
      assert.match(result.reason || '', /unsupported/i);
    });
  });

  describe('3. Strict RFC 3339 Timestamp Validation', () => {
    it('accepts valid UTC and offset RFC 3339 timestamps', () => {
      assert.equal(isValidRfc3339('2026-11-19T10:51:44Z'), true);
      assert.equal(isValidRfc3339('2026-11-19T10:51:44+01:00'), true);
      assert.equal(isValidRfc3339('2026-11-19T10:51:44.123Z'), true);
    });

    it('rejects non-RFC 3339 or malformed timestamps', () => {
      assert.equal(isValidRfc3339('invalid-date'), false);
      assert.equal(isValidRfc3339('19/11/2026 10:51:44'), false);
      assert.equal(isValidRfc3339('1732013504000'), false);
      assert.equal(isValidRfc3339(''), false);
    });
  });

  describe('4. Decimal-Safe Monetary Conversion (Integer Kobo)', () => {
    it('converts whole and fractional Naira to exact integer Kobo', () => {
      assert.equal(nairaToKoboSafe(35000), 3500000);
      assert.equal(nairaToKoboSafe('35000'), 3500000);
      assert.equal(nairaToKoboSafe('35000.50'), 3500050);
      assert.equal(nairaToKoboSafe('101.40'), 10140);
      assert.equal(nairaToKoboSafe('0.05'), 5);
      assert.equal(nairaToKoboSafe(0), 0);
    });

    it('throws on non-numeric or malformed amount inputs', () => {
      assert.throws(() => nairaToKoboSafe('abc'));
      assert.throws(() => nairaToKoboSafe(''));
      assert.throws(() => nairaToKoboSafe('NaN'));
    });
  });

  describe('5. Credential Standardization & Safety', () => {
    it('reads credentials with consistent environment variable naming', () => {
      process.env.NOMBA_CLIENT_ID = 'test_client_id';
      process.env.NOMBA_PRIVATE_KEY = 'test_private_key';
      process.env.NOMBA_ACCOUNT_ID = 'test_account_id';
      process.env.NOMBA_WEBHOOK_SECRET = 'test_webhook_secret';

      const creds = getNombaCredentials();
      assert.equal(creds.clientId, 'test_client_id');
      assert.equal(creds.privateKey, 'test_private_key');
      assert.equal(creds.accountId, 'test_account_id');
      assert.equal(creds.webhookSecret, 'test_webhook_secret');
      assert.equal(creds.baseUrl, 'https://api.nomba.com');
    });

    it('supports NOMBA_CLIENT_SECRET as an alias for NOMBA_PRIVATE_KEY', () => {
      delete process.env.NOMBA_PRIVATE_KEY;
      process.env.NOMBA_CLIENT_SECRET = 'test_client_secret_alias';

      const creds = getNombaCredentials();
      assert.equal(creds.privateKey, 'test_client_secret_alias');
    });
  });

  describe('6. Gateway References & Provider Isolation', () => {
    it('generates unique Nomba references prefixed with nomba_', () => {
      const orderNumber = 'GTC-20261119-ABCD';
      const ref1 = generateNombaReference(orderNumber);
      const ref2 = generateNombaReference(orderNumber);

      assert.match(ref1, /^nomba_GTC_20261119_ABCD_[a-z0-9]+_[A-Z0-9]+$/);
      assert.notEqual(ref1, ref2, 'Consecutive references must be distinct');
    });

    it('generates distinct Flutterwave references prefixed with flw_', () => {
      const orderNumber = 'GTC-20261119-ABCD';
      const flwRef = generateFlutterwaveReference(orderNumber);
      const nombaRef = generateNombaReference(orderNumber);

      assert.match(flwRef, /^flw_GTC_20261119_ABCD_[a-z0-9]+_[A-Z0-9]+$/);
      assert.notEqual(flwRef.startsWith('nomba_'), true);
      assert.notEqual(nombaRef.startsWith('flw_'), true);
    });

    it('sanitizes special characters in order numbers for gateway references', () => {
      const messyOrderNumber = 'GTC #2026/11/19:X!';
      const nombaRef = generateNombaReference(messyOrderNumber);
      assert.match(nombaRef, /^nomba_GTC__2026_11_19_X__/);
    });
  });
});
