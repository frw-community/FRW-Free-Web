// Fast unit tests for hybrid signatures

import { generateKeyPairV2 } from '../keys-pq';
import { signV2, verifyV2, signStringV2, verifyStringV2 } from '../signatures-pq';

describe('SignatureManagerV2', () => {
  let keyPair: any;

  beforeAll(() => {
    keyPair = generateKeyPairV2();
  });

  describe('signV2 and verifyV2', () => {
    it('should sign and verify message', () => {
      const message = new TextEncoder().encode('Hello, quantum world!');
      const signature = signV2(message, keyPair);
      
      expect(signature.version).toBe(2);
      expect(signature.signature_ed25519).toBeInstanceOf(Uint8Array);
      expect(signature.signature_ed25519.length).toBe(64);
      expect(signature.signature_dilithium3).toBeInstanceOf(Uint8Array);
      expect(signature.signature_dilithium3.length).toBe(3293);
      expect(signature.algorithm).toBe('hybrid-v2');
      
      const valid = verifyV2(message, signature, keyPair);
      expect(valid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const message = new TextEncoder().encode('Hello, quantum world!');
      const signature = signV2(message, keyPair);
      
      // Corrupt signature
      signature.signature_dilithium3[0] ^= 0xFF;
      
      const valid = verifyV2(message, signature, keyPair);
      expect(valid).toBe(false);
    });

    it('should reject modified message', () => {
      const message1 = new TextEncoder().encode('Hello, quantum world!');
      const message2 = new TextEncoder().encode('Hello, quantum world?');
      const signature = signV2(message1, keyPair);
      
      const valid = verifyV2(message2, signature, keyPair);
      expect(valid).toBe(false);
    });

    it('should reject old signature (replay protection)', async () => {
      const message = new TextEncoder().encode('Test message');
      const signature = signV2(message, keyPair);
      
      // Simulate old timestamp (2 hours ago)
      signature.timestamp = Date.now() - 7200000;
      
      const valid = verifyV2(message, signature, keyPair);
      expect(valid).toBe(false);
    });
  });

  describe('signStringV2 and verifyStringV2', () => {
    it('should sign and verify string', () => {
      const content = 'FRW Protocol V2 Test';
      const signature = signStringV2(content, keyPair);
      const valid = verifyStringV2(content, signature, keyPair);
      
      expect(valid).toBe(true);
    });

    it('should reject modified string', () => {
      const content1 = 'FRW Protocol V2 Test';
      const content2 = 'FRW Protocol V2 Test!';
      const signature = signStringV2(content1, keyPair);
      const valid = verifyStringV2(content2, signature, keyPair);
      
      expect(valid).toBe(false);
    });
  });
});
