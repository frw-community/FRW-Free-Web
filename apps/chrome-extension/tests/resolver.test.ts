/**
 * Tests for FRW Resolver
 */

import { FRWResolver } from '../src/core/resolver';

// Mock fetch globally
global.fetch = jest.fn();

describe('FRWResolver', () => {
  let resolver: FRWResolver;

  beforeEach(() => {
    resolver = new FRWResolver();
    (fetch as jest.Mock).mockClear();
  });

  describe('resolveName', () => {
    it('should resolve a valid name from bootstrap node', async () => {
      const mockRecord = {
        name: 'alice',
        publicKey: 'abcd1234efgh5678',
        contentCID: 'QmTest123',
        ipnsKey: 'k51test',
        timestamp: Date.now(),
        signature: 'sig123'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecord
      });

      const result = await resolver.resolveName('alice');

      expect(result).toEqual(mockRecord);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/resolve/alice'),
        expect.any(Object)
      );
    });

    it('should return cached result on second call', async () => {
      const mockRecord = {
        name: 'bob',
        publicKey: 'pubkey123',
        contentCID: 'QmTest456',
        ipnsKey: 'k51test2',
        timestamp: Date.now(),
        signature: 'sig456'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecord
      });

      // First call
      await resolver.resolveName('bob');

      // Second call (should use cache)
      const result = await resolver.resolveName('bob');

      expect(result).toEqual(mockRecord);
      expect(fetch).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should return null if name not found', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await resolver.resolveName('nonexistent');

      expect(result).toBeNull();
    });

    it('should try next bootstrap node on failure', async () => {
      const mockRecord = {
        name: 'charlie',
        publicKey: 'pubkey789',
        contentCID: 'QmTest789',
        ipnsKey: 'k51test3',
        timestamp: Date.now(),
        signature: 'sig789'
      };

      // First bootstrap node fails
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Second bootstrap node succeeds
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecord
      });

      const result = await resolver.resolveName('charlie');

      expect(result).toEqual(mockRecord);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should timeout after configured duration', async () => {
      resolver = new FRWResolver({ timeout: 100 });

      (fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 500))
      );

      const result = await resolver.resolveName('slow');

      expect(result).toBeNull();
    }, 10000);
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const mockRecord = {
        name: 'test',
        publicKey: 'pubkey',
        contentCID: 'QmTest',
        ipnsKey: 'k51test',
        timestamp: Date.now(),
        signature: 'sig'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockRecord
      });

      // Cache a result
      await resolver.resolveName('test');

      // Clear cache
      resolver.clearCache();

      // Should fetch again
      await resolver.resolveName('test');

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should return cache stats', async () => {
      const mockRecord = {
        name: 'alice',
        publicKey: 'pubkey',
        contentCID: 'QmTest',
        ipnsKey: 'k51test',
        timestamp: Date.now(),
        signature: 'sig'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockRecord
      });

      await resolver.resolveName('alice');
      await resolver.resolveName('bob');

      const stats = resolver.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toContain('alice');
      expect(stats.entries).toContain('bob');
    });
  });

  describe('configuration', () => {
    it('should use custom bootstrap nodes', async () => {
      const customNodes = ['http://custom-node:3100'];
      resolver = new FRWResolver({ bootstrapNodes: customNodes });

      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });

      await resolver.resolveName('test');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://custom-node:3100'),
        expect.any(Object)
      );
    });

    it('should use custom cache TTL', async () => {
      resolver = new FRWResolver({ cacheTTL: 1000 }); // 1 second

      const mockRecord = {
        name: 'test',
        publicKey: 'pubkey',
        contentCID: 'QmTest',
        ipnsKey: 'k51test',
        timestamp: Date.now(),
        signature: 'sig'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockRecord
      });

      // First call
      await resolver.resolveName('test');

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second call (cache expired, should fetch again)
      await resolver.resolveName('test');

      expect(fetch).toHaveBeenCalledTimes(2);
    }, 5000);
  });
});
