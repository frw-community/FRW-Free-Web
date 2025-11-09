import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { FRWResolver } from '../src/resolver.js';
import { SignatureManager } from '@frw/crypto';

describe('FRWResolver', () => {
  let resolver: FRWResolver;
  let mockIPFS: any;
  let testKeyPair: any;

  beforeEach(() => {
    testKeyPair = SignatureManager.generateKeyPair();
    
    mockIPFS = {
      resolveName: jest.fn(),
      getFile: jest.fn()
    };
    
    resolver = new FRWResolver(mockIPFS);
  });

  describe('resolve', () => {
    test('should resolve valid FRW URL', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const url = `frw://${publicKey}/index.html`;
      const cid = 'Qm...testcid';
      const htmlContent = '<html><body>Test</body></html>';

      mockIPFS.resolveName.mockResolvedValue(cid);
      mockIPFS.getFile.mockResolvedValue(Buffer.from(htmlContent));

      const result = await resolver.resolve(url);

      expect(result.content).toBeInstanceOf(Buffer);
      expect(result.metadata.author).toBe(publicKey);
      expect(mockIPFS.resolveName).toHaveBeenCalledWith(publicKey);
      expect(mockIPFS.getFile).toHaveBeenCalledWith(cid, 'index.html');
    });

    test('should handle root path resolution', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const url = `frw://${publicKey}/`;
      const cid = 'Qm...testcid';

      mockIPFS.resolveName.mockResolvedValue(cid);
      mockIPFS.getFile.mockResolvedValue(Buffer.from('<html></html>'));

      await resolver.resolve(url);

      expect(mockIPFS.getFile).toHaveBeenCalledWith(cid, '');
    });

    test('should throw error on IPNS resolution failure', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const url = `frw://${publicKey}/index.html`;

      mockIPFS.resolveName.mockRejectedValue(new Error('IPNS error'));

      await expect(resolver.resolve(url)).rejects.toThrow('Failed to resolve IPNS name');
    });

    test('should throw ContentNotFoundError when file not found', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const url = `frw://${publicKey}/missing.html`;
      const cid = 'Qm...testcid';

      mockIPFS.resolveName.mockResolvedValue(cid);
      mockIPFS.getFile.mockRejectedValue(new Error('File not found'));

      await expect(resolver.resolve(url)).rejects.toThrow('Content not found');
    });

    test('should cache resolved content', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const url = `frw://${publicKey}/index.html`;
      const cid = 'Qm...testcid';

      mockIPFS.resolveName.mockResolvedValue(cid);
      mockIPFS.getFile.mockResolvedValue(Buffer.from('<html></html>'));

      // First resolution
      await resolver.resolve(url);
      
      // Second resolution should use cache
      await resolver.resolve(url);

      // IPFS should only be called once
      expect(mockIPFS.resolveName).toHaveBeenCalledTimes(1);
      expect(mockIPFS.getFile).toHaveBeenCalledTimes(1);
    });

    test('should handle different paths to same public key', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const url1 = `frw://${publicKey}/index.html`;
      const url2 = `frw://${publicKey}/about.html`;
      const cid = 'Qm...testcid';

      mockIPFS.resolveName.mockResolvedValue(cid);
      mockIPFS.getFile.mockResolvedValue(Buffer.from('<html></html>'));

      await resolver.resolve(url1);
      await resolver.resolve(url2);

      // Should resolve IPNS once but fetch files twice
      expect(mockIPFS.resolveName).toHaveBeenCalledTimes(2);
      expect(mockIPFS.getFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    test('should clear all cached content', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const url = `frw://${publicKey}/index.html`;
      const cid = 'Qm...testcid';

      mockIPFS.resolveName.mockResolvedValue(cid);
      mockIPFS.getFile.mockResolvedValue(Buffer.from('<html></html>'));

      await resolver.resolve(url);
      resolver.clearCache();
      await resolver.resolve(url);

      // Should fetch twice after clear
      expect(mockIPFS.resolveName).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidate', () => {
    test('should invalidate specific URL from cache', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const url = `frw://${publicKey}/index.html`;
      const cid = 'Qm...testcid';

      mockIPFS.resolveName.mockResolvedValue(cid);
      mockIPFS.getFile.mockResolvedValue(Buffer.from('<html></html>'));

      await resolver.resolve(url);
      resolver.invalidate(url);
      await resolver.resolve(url);

      // Should fetch twice after invalidation
      expect(mockIPFS.resolveName).toHaveBeenCalledTimes(2);
    });

    test('should only invalidate specified URL', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const url1 = `frw://${publicKey}/index.html`;
      const url2 = `frw://${publicKey}/about.html`;
      const cid = 'Qm...testcid';

      mockIPFS.resolveName.mockResolvedValue(cid);
      mockIPFS.getFile.mockResolvedValue(Buffer.from('<html></html>'));

      await resolver.resolve(url1);
      await resolver.resolve(url2);
      
      resolver.invalidate(url1);
      
      await resolver.resolve(url1);
      await resolver.resolve(url2);

      // url1 fetched twice, url2 uses cache
      expect(mockIPFS.getFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('getCacheSize', () => {
    test('should return zero for empty cache', () => {
      expect(resolver.getCacheSize()).toBe(0);
    });

    test('should return correct cache size', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const cid = 'Qm...testcid';

      mockIPFS.resolveName.mockResolvedValue(cid);
      mockIPFS.getFile.mockResolvedValue(Buffer.from('<html></html>'));

      await resolver.resolve(`frw://${publicKey}/index.html`);
      await resolver.resolve(`frw://${publicKey}/about.html`);

      expect(resolver.getCacheSize()).toBe(2);
    });

    test('should update size after clear', async () => {
      const publicKey = SignatureManager.encodePublicKey(testKeyPair.publicKey);
      const cid = 'Qm...testcid';

      mockIPFS.resolveName.mockResolvedValue(cid);
      mockIPFS.getFile.mockResolvedValue(Buffer.from('<html></html>'));

      await resolver.resolve(`frw://${publicKey}/index.html`);
      expect(resolver.getCacheSize()).toBe(1);

      resolver.clearCache();
      expect(resolver.getCacheSize()).toBe(0);
    });
  });
});
