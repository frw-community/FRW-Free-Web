import { describe, test, expect, beforeEach } from '@jest/globals';
import { FRWNamingSystem, NameRecord } from '../src/naming';
import { SignatureManager } from '@frw/crypto';

describe('FRWNamingSystem', () => {
  let naming: FRWNamingSystem;
  let testKeys: { publicKey: string; privateKey: Uint8Array };

  beforeEach(() => {
    naming = new FRWNamingSystem();
    const keyPair = SignatureManager.generateKeyPair();
    testKeys = {
      publicKey: SignatureManager.encodePublicKey(keyPair.publicKey),
      privateKey: keyPair.privateKey
    };
  });

  describe('createNameRecord', () => {
    test('should create valid name record', () => {
      const record = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns',
        testKeys.privateKey
      );

      expect(record.name).toBe('alice');
      expect(record.publicKey).toBe(testKeys.publicKey);
      expect(record.ipnsName).toBe('k51qzi5uqu5testipns');
      expect(record.signature).toBeTruthy();
      expect(record.timestamp).toBeGreaterThan(0);
    });

    test('should create record with metadata', () => {
      const metadata = {
        description: 'Alice personal page',
        email: 'alice@example.com',
        website: 'https://alice.example.com'
      };

      const record = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns',
        testKeys.privateKey,
        metadata
      );

      expect(record.metadata).toEqual(metadata);
    });

    test('should generate unique signatures for different names', () => {
      const record1 = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns1',
        testKeys.privateKey
      );

      const record2 = naming.createNameRecord(
        'bob',
        testKeys.publicKey,
        'k51qzi5uqu5testipns2',
        testKeys.privateKey
      );

      expect(record1.signature).not.toBe(record2.signature);
    });
  });

  describe('verifyNameRecord', () => {
    test('should verify valid record signature', () => {
      const record = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns',
        testKeys.privateKey
      );

      const isValid = naming.verifyNameRecord(record);
      expect(isValid).toBe(true);
    });

    test('should reject tampered record', () => {
      const record = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns',
        testKeys.privateKey
      );

      // Tamper with the record
      record.name = 'bob';

      const isValid = naming.verifyNameRecord(record);
      expect(isValid).toBe(false);
    });

    test('should reject record with wrong public key', () => {
      const record = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns',
        testKeys.privateKey
      );

      // Change public key
      const otherKeys = SignatureManager.generateKeyPair();
      record.publicKey = SignatureManager.encodePublicKey(otherKeys.publicKey);

      const isValid = naming.verifyNameRecord(record);
      expect(isValid).toBe(false);
    });

    test('should handle invalid signature format', () => {
      const record: NameRecord = {
        name: 'alice',
        publicKey: testKeys.publicKey,
        ipnsName: 'k51qzi5uqu5testipns',
        signature: 'invalid-signature',
        timestamp: Date.now()
      };

      const isValid = naming.verifyNameRecord(record);
      expect(isValid).toBe(false);
    });
  });

  describe('resolveName', () => {
    test('should throw error for non-existent name', async () => {
      await expect(naming.resolveName('nonexistent')).rejects.toThrow('Name not found');
    });

    test('should return cached record', async () => {
      const record = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns',
        testKeys.privateKey
      );

      await naming.publishNameRecord(record);

      const publicKey = await naming.resolveName('alice');
      expect(publicKey).toBe(testKeys.publicKey);
    });

    test('should not return expired record from cache', async () => {
      const record = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns',
        testKeys.privateKey
      );

      // Set expiry in the past
      record.expires = Date.now() - 1000;
      await naming.publishNameRecord(record);

      // Should fail because cached record is expired and DHT returns null
      await expect(naming.resolveName('alice')).rejects.toThrow();
    });
  });

  describe('publishNameRecord', () => {
    test('should cache published record', async () => {
      const record = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns',
        testKeys.privateKey
      );

      await naming.publishNameRecord(record);

      const publicKey = await naming.resolveName('alice');
      expect(publicKey).toBe(testKeys.publicKey);
    });

    test('should update existing record', async () => {
      const record1 = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns1',
        testKeys.privateKey
      );

      await naming.publishNameRecord(record1);

      const record2 = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns2',
        testKeys.privateKey
      );

      await naming.publishNameRecord(record2);

      const publicKey = await naming.resolveName('alice');
      expect(publicKey).toBe(testKeys.publicKey);
    });
  });

  describe('clearCache', () => {
    test('should clear all cached records', async () => {
      const record = naming.createNameRecord(
        'alice',
        testKeys.publicKey,
        'k51qzi5uqu5testipns',
        testKeys.privateKey
      );

      await naming.publishNameRecord(record);
      naming.clearCache();

      await expect(naming.resolveName('alice')).rejects.toThrow();
    });
  });

  describe('DNSFRWRecord', () => {
    test('queryDNS should return null (placeholder)', async () => {
      const result = await FRWNamingSystem.queryDNS('example.com');
      expect(result).toBeNull();
    });
  });
});
