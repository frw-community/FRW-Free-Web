import { describe, test, expect, beforeEach } from '@jest/globals';
import { SignatureManager } from '../src/signatures';
import type { FRWKeyPair } from '@frw/common';

describe('SignatureManager', () => {
  let keyPair: FRWKeyPair;

  beforeEach(() => {
    keyPair = SignatureManager.generateKeyPair();
  });

  describe('generateKeyPair', () => {
    test('generates valid keypair', () => {
      expect(keyPair.publicKey).toHaveLength(32);
      expect(keyPair.privateKey).toHaveLength(64);
    });

    test('generates unique keypairs', () => {
      const keyPair2 = SignatureManager.generateKeyPair();
      expect(Buffer.from(keyPair.publicKey)).not.toEqual(Buffer.from(keyPair2.publicKey));
    });
  });

  describe('sign and verify', () => {
    test('signs and verifies content', () => {
      const content = 'test content';
      const signature = SignatureManager.sign(content, keyPair.privateKey);
      
      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
      
      const valid = SignatureManager.verify(content, signature, keyPair.publicKey);
      expect(valid).toBe(true);
    });

    test('rejects invalid signature', () => {
      const content = 'test content';
      const signature = SignatureManager.sign(content, keyPair.privateKey);
      const valid = SignatureManager.verify('modified content', signature, keyPair.publicKey);
      expect(valid).toBe(false);
    });

    test('rejects wrong public key', () => {
      const content = 'test content';
      const signature = SignatureManager.sign(content, keyPair.privateKey);
      const keyPair2 = SignatureManager.generateKeyPair();
      const valid = SignatureManager.verify(content, signature, keyPair2.publicKey);
      expect(valid).toBe(false);
    });
  });

  describe('encodePublicKey and decodePublicKey', () => {
    test('encodes and decodes public key', () => {
      const encoded = SignatureManager.encodePublicKey(keyPair.publicKey);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
      
      const decoded = SignatureManager.decodePublicKey(encoded);
      expect(Buffer.from(decoded)).toEqual(Buffer.from(keyPair.publicKey));
    });
  });

  describe('signPage and verifyPage', () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Page</title>
  <meta name="frw-version" content="1.0">
  <meta name="frw-author" content="@test">
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

    test('signs HTML page', () => {
      const signed = SignatureManager.signPage(html, keyPair.privateKey);
      expect(signed).toContain('frw-signature');
      expect(signed.length).toBeGreaterThan(html.length);
    });

    test('verifies signed page', () => {
      const signed = SignatureManager.signPage(html, keyPair.privateKey);
      const valid = SignatureManager.verifyPage(signed, keyPair.publicKey);
      expect(valid).toBe(true);
    });

    test('rejects tampered page', () => {
      const signed = SignatureManager.signPage(html, keyPair.privateKey);
      const tampered = signed.replace('<h1>Test</h1>', '<h1>Hacked</h1>');
      const valid = SignatureManager.verifyPage(tampered, keyPair.publicKey);
      expect(valid).toBe(false);
    });

    test('throws on invalid HTML', () => {
      const invalidHtml = '<html><body>No head tag</body></html>';
      expect(() => SignatureManager.signPage(invalidHtml, keyPair.privateKey)).toThrow();
    });
  });
});
