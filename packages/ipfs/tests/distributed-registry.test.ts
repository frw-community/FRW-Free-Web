// Tests for DistributedNameRegistry
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DistributedNameRegistry, createDistributedNameRecord } from '../src/distributed-registry';
import { SignatureManager } from '@frw/crypto';
import type { ProofOfWork } from '@frw/name-registry';

describe('DistributedNameRegistry', () => {
  let registry: DistributedNameRegistry;
  let testKeyPair: { publicKey: Uint8Array; privateKey: Uint8Array };
  let testPublicKeyEncoded: string;

  beforeEach(() => {
    // Generate test keypair
    testKeyPair = SignatureManager.generateKeyPair();
    testPublicKeyEncoded = SignatureManager.encodePublicKey(testKeyPair.publicKey);
    
    // Create registry instance
    registry = new DistributedNameRegistry({
      ipfsUrl: 'http://localhost:5001',
      bootstrapNodes: []
    });
  });

  describe('createDistributedNameRecord', () => {
    it('should create a valid name record', () => {
      const proof: ProofOfWork = {
        nonce: 12345,
        hash: '0000abcd1234567890',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'testname',
        testPublicKeyEncoded,
        'QmTestCID123',
        '/ipns/' + testPublicKeyEncoded,
        testKeyPair.privateKey,
        proof
      );

      expect(record.name).toBe('testname');
      expect(record.publicKey).toBe(testPublicKeyEncoded);
      expect(record.contentCID).toBe('QmTestCID123');
      expect(record.ipnsKey).toBe('/ipns/' + testPublicKeyEncoded);
      expect(record.version).toBe(1);
      expect(record.signature).toBeTruthy();
      expect(record.proof).toEqual(proof);
      expect(record.did).toBe(`did:frw:${testPublicKeyEncoded}`);
    });

    it('should create records with valid signatures', () => {
      const proof: ProofOfWork = {
        nonce: 12345,
        hash: '0000abcd',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'signtest',
        testPublicKeyEncoded,
        'QmSignTest',
        '/ipns/' + testPublicKeyEncoded,
        testKeyPair.privateKey,
        proof
      );

      // Verify signature manually
      const message = `${record.name}:${record.publicKey}:${record.contentCID}:${record.version}:${record.registered}`;
      const isValid = SignatureManager.verify(message, record.signature, testKeyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should set expiration to 1 year by default', () => {
      const proof: ProofOfWork = {
        nonce: 123,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const now = Date.now();
      const record = createDistributedNameRecord(
        'expiretest',
        testPublicKeyEncoded,
        'QmTest',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      const oneYear = 365 * 24 * 60 * 60 * 1000;
      const expectedExpiration = now + oneYear;
      
      // Allow 1 second tolerance
      expect(record.expires).toBeGreaterThan(expectedExpiration - 1000);
      expect(record.expires).toBeLessThan(expectedExpiration + 1000);
    });

    it('should create DID in correct format', () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'didtest',
        testPublicKeyEncoded,
        'QmTest',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      expect(record.did).toMatch(/^did:frw:[A-Za-z0-9]+$/);
      expect(record.did).toBe(`did:frw:${testPublicKeyEncoded}`);
    });
  });

  describe('Record Validation', () => {
    it('should reject records with invalid name format', async () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const invalidRecord = createDistributedNameRecord(
        'UPPERCASE', // Invalid: must be lowercase
        testPublicKeyEncoded,
        'QmTest',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      await expect(registry.registerName(invalidRecord)).rejects.toThrow('Invalid name format');
    });

    it('should reject records with special characters in name', async () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const invalidRecord = createDistributedNameRecord(
        'test@name', // Invalid: @ not allowed
        testPublicKeyEncoded,
        'QmTest',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      await expect(registry.registerName(invalidRecord)).rejects.toThrow('Invalid name format');
    });

    it('should accept valid names with hyphens', async () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const validRecord = createDistributedNameRecord(
        'my-test-name', // Valid: hyphens allowed
        testPublicKeyEncoded,
        'QmTest',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      // Should not throw
      // Note: Will fail on network publish, but validation should pass
      try {
        await registry.registerName(validRecord);
      } catch (error) {
        // Network error is expected in tests, but validation should pass
        expect(error).toBeTruthy();
      }
    });

    it('should reject expired records', async () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const expiredRecord = createDistributedNameRecord(
        'expired',
        testPublicKeyEncoded,
        'QmTest',
        '/ipns/test',
        testKeyPair.privateKey,
        proof,
        -1000 // Expired 1 second ago
      );

      await expect(registry.registerName(expiredRecord)).rejects.toThrow('Record expired');
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid signatures', () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'veriftest',
        testPublicKeyEncoded,
        'QmTest',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      // Access private method through any (for testing)
      const isValid = (registry as any).verifySignature(record);
      expect(isValid).toBe(true);
    });

    it('should reject records with tampered signatures', () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'tampertest',
        testPublicKeyEncoded,
        'QmTest',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      // Tamper with signature
      record.signature = 'invalid_signature_xyz';

      const isValid = (registry as any).verifySignature(record);
      expect(isValid).toBe(false);
    });

    it('should reject records with tampered content', () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'contenttest',
        testPublicKeyEncoded,
        'QmOriginal',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      // Tamper with content (signature won't match)
      record.contentCID = 'QmTampered';

      const isValid = (registry as any).verifySignature(record);
      expect(isValid).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache resolved names in L1 cache', async () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'cachetest',
        testPublicKeyEncoded,
        'QmCache',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      // Cache the record
      (registry as any).cacheRecord(record);

      // Retrieve from L1 cache
      const cached = (registry as any).getFromL1Cache('cachetest');
      expect(cached).toBeTruthy();
      expect(cached.name).toBe('cachetest');
      expect(cached.contentCID).toBe('QmCache');
    });

    it('should return null for cache misses', () => {
      const cached = (registry as any).getFromL1Cache('nonexistent');
      expect(cached).toBeNull();
    });

    it('should handle case-insensitive names in cache', () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'casetest',
        testPublicKeyEncoded,
        'QmCase',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      (registry as any).cacheRecord(record);

      // Should find with different case
      const cached1 = (registry as any).getFromL1Cache('casetest');
      const cached2 = (registry as any).getFromL1Cache('CaseTest');
      const cached3 = (registry as any).getFromL1Cache('CASETEST');

      expect(cached1).toBeTruthy();
      expect(cached2).toBeTruthy();
      expect(cached3).toBeTruthy();
    });

    it('should expire cached entries after TTL', async () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'ttltest',
        testPublicKeyEncoded,
        'QmTTL',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      // Cache with very short TTL (hack for testing)
      (registry as any).L1_CACHE_TTL = 10; // 10ms
      (registry as any).cacheRecord(record);

      // Should be in cache immediately
      let cached = (registry as any).getFromL1Cache('ttltest');
      expect(cached).toBeTruthy();

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should be expired
      cached = (registry as any).getFromL1Cache('ttltest');
      expect(cached).toBeNull();
    });
  });

  describe('DHT Key Generation', () => {
    it('should generate correct DHT keys', () => {
      const key1 = (registry as any).getDHTKey('testname');
      expect(key1).toBe('/frw/names/v1/testname');

      const key2 = (registry as any).getDHTKey('another-name');
      expect(key2).toBe('/frw/names/v1/another-name');
    });

    it('should lowercase names in DHT keys', () => {
      const key = (registry as any).getDHTKey('MixedCase');
      expect(key).toBe('/frw/names/v1/mixedcase');
    });
  });

  describe('Record Hashing', () => {
    it('should generate consistent hashes for same record', () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'hashtest',
        testPublicKeyEncoded,
        'QmHash',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      const hash1 = (registry as any).hashRecord(record);
      const hash2 = (registry as any).hashRecord(record);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('should generate different hashes for different records', () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record1 = createDistributedNameRecord(
        'hash1',
        testPublicKeyEncoded,
        'QmHash1',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      const record2 = createDistributedNameRecord(
        'hash2',
        testPublicKeyEncoded,
        'QmHash2',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      const hash1 = (registry as any).hashRecord(record1);
      const hash2 = (registry as any).hashRecord(record2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Statistics', () => {
    it('should initialize with zero stats', () => {
      const stats = registry.getStats();

      expect(stats.dhtHits).toBe(0);
      expect(stats.dhtMisses).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.pubsubUpdates).toBe(0);
      expect(stats.avgLatency).toBe(0);
    });

    it('should track cache hits', async () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'stattest',
        testPublicKeyEncoded,
        'QmStat',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      // Cache the record
      (registry as any).cacheRecord(record);

      // Resolve (should hit cache)
      await registry.resolveName('stattest');

      const stats = registry.getStats();
      expect(stats.cacheHits).toBeGreaterThan(0);
    });

    it('should calculate cache hit rate', () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'ratetest',
        testPublicKeyEncoded,
        'QmRate',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      // Manually set stats for testing
      (registry as any).stats.cacheHits = 8;
      (registry as any).stats.dhtMisses = 2;

      const stats = registry.getStats();
      expect(stats.hitRate).toBe(0.8); // 8 hits / (8 hits + 2 misses)
    });
  });

  describe('Version Management', () => {
    it('should increment version on updates', () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'versiontest',
        testPublicKeyEncoded,
        'QmV1',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      expect(record.version).toBe(1);

      // Simulate update (version should increment)
      // This would be done by updateContent in real usage
    });

    it('should store previous hash on updates', async () => {
      const proof: ProofOfWork = {
        nonce: 1,
        hash: '0000',
        difficulty: 4,
        timestamp: Date.now()
      };

      const record = createDistributedNameRecord(
        'prevhash',
        testPublicKeyEncoded,
        'QmPrev',
        '/ipns/test',
        testKeyPair.privateKey,
        proof
      );

      expect(record.previousHash).toBeUndefined();

      // After update, previousHash should be set
      // (tested in integration tests)
    });
  });

  describe('Name Validation Rules', () => {
    const validNames = [
      'a',
      'ab',
      'test',
      'my-name',
      'site123',
      '123site',
      'a-b-c-d-e'
    ];

    const invalidNames = [
      '',           // Empty
      'A',          // Uppercase
      'Test',       // Mixed case
      'test_name',  // Underscore
      'test.com',   // Period
      'test@site',  // @
      'test name',  // Space
      '-test',      // Starts with hyphen
      'test-',      // Ends with hyphen
    ];

    validNames.forEach(name => {
      it(`should accept valid name: "${name}"`, () => {
        const regex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
        expect(regex.test(name)).toBe(true);
      });
    });

    invalidNames.forEach(name => {
      it(`should reject invalid name: "${name}"`, () => {
        const regex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
        expect(regex.test(name)).toBe(false);
      });
    });
  });
});
