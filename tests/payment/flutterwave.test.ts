/**
 * Good Things Co. — Flutterwave Payment & Safety Test Suite
 *
 * Validates:
 * 1. Key format and safety guards
 * 2. Secret key isolation (server-only, no VITE_ prefix)
 * 3. Unique Flutterwave reference generation (flw_...)
 * 4. Webhook secret hash verification
 * 5. Simulation / Development mode fallback
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getFlutterwaveSecretKey,
  isFlutterwaveSimulationMode,
  validateFlutterwaveKeySafety,
  verifyFlutterwaveWebhookSignature,
} from '../../server/flutterwaveService';
import { generateFlutterwaveReference } from '../../src/utils/orderUtils';

const mockTestSecret = 'FLWSECK_TEST-mock_dummy_secret_for_tests-X';
const mockLiveSecret = 'FLWSECK-mock_dummy_secret_for_tests-X';

describe('Flutterwave Integration & Key Safety Test Suite', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Key Safety & Guards', () => {
    it('accepts valid test secret key (FLWSECK_TEST-...) in non-simulation', () => {
      delete process.env.FLUTTERWAVE_MODE;
      process.env.NODE_ENV = 'production';
      process.env.FLUTTERWAVE_SECRET_KEY = mockTestSecret;

      const check = validateFlutterwaveKeySafety();
      assert.equal(check.valid, true);
    });

    it('accepts valid live secret key (FLWSECK-...) in non-simulation', () => {
      delete process.env.FLUTTERWAVE_MODE;
      process.env.NODE_ENV = 'production';
      process.env.FLUTTERWAVE_SECRET_KEY = mockLiveSecret;

      const check = validateFlutterwaveKeySafety();
      assert.equal(check.valid, true);
    });

    it('rejects malformed secret key format when not simulated', () => {
      delete process.env.FLUTTERWAVE_MODE;
      process.env.NODE_ENV = 'production';
      process.env.FLUTTERWAVE_SECRET_KEY = 'invalid_format_key';

      const check = validateFlutterwaveKeySafety();
      assert.equal(check.valid, false);
      assert.match(check.error || '', /format/i);
    });

    it('enables simulation mode when FLUTTERWAVE_MODE=simulation in development', () => {
      process.env.FLUTTERWAVE_MODE = 'simulation';
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL;

      assert.equal(isFlutterwaveSimulationMode(), true);
    });
  });

  describe('2. Secret Key Isolation & Server Privacy', () => {
    it('FLUTTERWAVE_SECRET_KEY does NOT have VITE_ prefix', () => {
      assert.equal(Object.prototype.hasOwnProperty.call(process.env, 'VITE_FLUTTERWAVE_SECRET_KEY'), false);
    });

    it('getFlutterwaveSecretKey trims whitespace accurately', () => {
      process.env.FLUTTERWAVE_SECRET_KEY = `  ${mockTestSecret}  `;
      assert.equal(getFlutterwaveSecretKey(), mockTestSecret);
    });
  });

  describe('3. Reference Generation', () => {
    it('generates unique Flutterwave reference matching order number with flw_ prefix', () => {
      const orderNumber = 'GTC-20261029-A1B2';
      const ref1 = generateFlutterwaveReference(orderNumber);
      const ref2 = generateFlutterwaveReference(orderNumber);

      assert.match(ref1, /^flw_GTC_20261029_A1B2_[a-z0-9]+_[A-Z0-9]+$/);
      assert.match(ref2, /^flw_GTC_20261029_A1B2_[a-z0-9]+_[A-Z0-9]+$/);
      assert.notEqual(ref1, ref2);
    });
  });

  describe('4. Webhook Security & Signature Validation', () => {
    it('validates authentic Flutterwave secret hash', () => {
      process.env.FLUTTERWAVE_SECRET_HASH = 'gtc_secret_hash_9921';
      assert.equal(verifyFlutterwaveWebhookSignature('gtc_secret_hash_9921'), true);
    });

    it('rejects tampered or mismatched webhook secret hash', () => {
      process.env.FLUTTERWAVE_SECRET_HASH = 'gtc_secret_hash_9921';
      assert.equal(verifyFlutterwaveWebhookSignature('wrong_hash'), false);
    });

    it('rejects webhooks if signature is missing', () => {
      process.env.FLUTTERWAVE_SECRET_HASH = 'gtc_secret_hash_9921';
      assert.equal(verifyFlutterwaveWebhookSignature(undefined), false);
    });
  });
});
