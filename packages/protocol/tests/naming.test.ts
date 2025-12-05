import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';
import { FRWNamingSystem, NameRecord } from '../src/naming';
import { SignatureManager } from '@frw/crypto';

type MockResponse = {
  ok: boolean;
  json: () => Promise<any>;
  text: () => Promise<string>;
};

const createResponse = (data: any, ok = true): MockResponse => ({
  ok,
  json: async () => data,
  text: async () => JSON.stringify(data ?? {})
});

const resignRecord = (record: NameRecord, privateKey: Uint8Array) => {
  const message = JSON.stringify({
    name: record.name,
    publicKey: record.publicKey,
    ipnsName: record.ipnsName,
    timestamp: record.timestamp,
    expires: record.expires,
    metadata: record.metadata
  });
  record.signature = SignatureManager.sign(message, privateKey);
};

describe('FRWNamingSystem', () => {
  let naming: FRWNamingSystem;
  let testKeys: { publicKey: string; privateKey: Uint8Array };
  const publishedRecords = new Map<string, NameRecord>();
  const originalFetch = global.fetch;
  const globalAny = global as unknown as { fetch: any };
  const fetchMock = jest.fn(async (input: any, init?: any): Promise<MockResponse> => createResponse({}));

  beforeEach(() => {
    naming = new FRWNamingSystem();
    const keyPair = SignatureManager.generateKeyPair();
    testKeys = {
      publicKey: SignatureManager.encodePublicKey(keyPair.publicKey),
      privateKey: keyPair.privateKey
    };

    publishedRecords.clear();
    fetchMock.mockImplementation(async (input: any, init?: any) => {
      const method = init?.method ?? 'GET';
      const url = typeof input === 'string' ? input : input.toString();

      if (method === 'POST' && init?.body) {
        const record = JSON.parse(init.body as string) as NameRecord;
        publishedRecords.set(record.name, record);
        return createResponse({ success: true });
      }

      if (method === 'GET' && url.includes('/api/resolve/')) {
        const name = decodeURIComponent(url.split('/api/resolve/')[1] ?? '');
        const record = publishedRecords.get(name);
        if (!record) {
          return createResponse({}, false);
        }
        return createResponse(record);
      }

      return createResponse({});
    });

    globalAny.fetch = fetchMock;
  });

  afterAll(() => {
    globalAny.fetch = originalFetch;
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

      // Set expiry in the past and update signature
      record.expires = Date.now() - 1000;
      resignRecord(record, testKeys.privateKey);
      await naming.publishNameRecord(record);
      publishedRecords.delete('alice');

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
      publishedRecords.clear();

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
