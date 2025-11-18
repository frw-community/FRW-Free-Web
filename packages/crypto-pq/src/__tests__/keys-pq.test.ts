// Fast unit tests for post-quantum key generation

import { generateKeyPairV2, validateKeyPairV2, KeyManagerV2 } from '../keys-pq';

describe('KeyManagerV2', () => {
  describe('generateKeyPairV2', () => {
    it('should generate valid V2 keypair', () => {
      const keyPair = generateKeyPairV2();
      
      expect(keyPair.publicKey_ed25519).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey_ed25519.length).toBe(32);
      
      expect(keyPair.privateKey_ed25519).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey_ed25519.length).toBe(64);
      
      expect(keyPair.publicKey_dilithium3).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey_dilithium3.length).toBe(1952);
      
      expect(keyPair.privateKey_dilithium3).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey_dilithium3.length).toBe(4032); // Actual ML-DSA-65 size
      
      expect(keyPair.did).toMatch(/^did:frw:v2:/);
    });

    it('should generate deterministic keypair from seed', () => {
      const seed = new Uint8Array(32).fill(42);
      const keyPair1 = generateKeyPairV2(seed);
      const keyPair2 = generateKeyPairV2(seed);
      
      expect(keyPair1.publicKey_ed25519).toEqual(keyPair2.publicKey_ed25519);
      expect(keyPair1.publicKey_dilithium3).toEqual(keyPair2.publicKey_dilithium3);
      expect(keyPair1.did).toBe(keyPair2.did);
    });

    it('should generate different keypairs without seed', () => {
      const keyPair1 = generateKeyPairV2();
      const keyPair2 = generateKeyPairV2();
      
      expect(keyPair1.publicKey_dilithium3).not.toEqual(keyPair2.publicKey_dilithium3);
      expect(keyPair1.did).not.toBe(keyPair2.did);
    });
  });

  describe('validateKeyPairV2', () => {
    it('should validate correct keypair', () => {
      const keyPair = generateKeyPairV2();
      expect(validateKeyPairV2(keyPair)).toBe(true);
    });

    it('should reject invalid keypair', () => {
      const keyPair = generateKeyPairV2();
      keyPair.publicKey_ed25519 = new Uint8Array(16); // Wrong size
      expect(validateKeyPairV2(keyPair)).toBe(false);
    });
  });

  describe('export/import', () => {
    it('should export and import keypair', () => {
      const manager = new KeyManagerV2();
      const original = generateKeyPairV2();
      
      const exported = manager.exportKeyPair(original);
      const imported = manager.importKeyPair(exported);
      
      expect(imported.publicKey_ed25519).toEqual(original.publicKey_ed25519);
      expect(imported.publicKey_dilithium3).toEqual(original.publicKey_dilithium3);
      expect(imported.did).toBe(original.did);
    });
  });
});
