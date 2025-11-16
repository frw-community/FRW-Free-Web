/**
 * Tests for IPFS Fetcher
 */

import { IPFSFetcher } from '../src/core/ipfs-fetcher';

global.fetch = jest.fn();

describe('IPFSFetcher', () => {
  let fetcher: IPFSFetcher;

  beforeEach(() => {
    fetcher = new IPFSFetcher();
    (fetch as jest.Mock).mockClear();
  });

  describe('fetch', () => {
    it('should fetch HTML content from IPFS gateway', async () => {
      const mockHtml = '<html><body>Hello World</body></html>';

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['Content-Type', 'text/html']]),
        text: async () => mockHtml
      });

      const result = await fetcher.fetch('QmTest123', '/index.html');

      expect(result.content).toBe(mockHtml);
      expect(result.mimeType).toBe('text/html');
      expect(result.gateway).toBeTruthy();
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should fetch binary content from IPFS gateway', async () => {
      const mockBuffer = new ArrayBuffer(1024);

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['Content-Type', 'image/png']]),
        arrayBuffer: async () => mockBuffer
      });

      const result = await fetcher.fetch('QmTest456', '/image.png');

      expect(result.content).toBe(mockBuffer);
      expect(result.mimeType).toContain('image');
      expect(result.gateway).toBeTruthy();
    });

    it('should fallback to next gateway on failure', async () => {
      const mockHtml = '<html>Test</html>';

      // First gateway fails
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Gateway down'));

      // Second gateway succeeds
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['Content-Type', 'text/html']]),
        text: async () => mockHtml
      });

      const result = await fetcher.fetch('QmTest789', '/index.html');

      expect(result.content).toBe(mockHtml);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error if all gateways fail', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('All gateways down'));

      await expect(
        fetcher.fetch('QmTestFail', '/index.html')
      ).rejects.toThrow('Failed to fetch');
    });

    it('should handle gateway timeout', async () => {
      fetcher = new IPFSFetcher(100); // 100ms timeout

      (fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 500))
      );

      await expect(
        fetcher.fetch('QmTestSlow', '/index.html')
      ).rejects.toThrow();
    }, 10000);

    it('should normalize path correctly', async () => {
      const mockHtml = '<html>Test</html>';

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['Content-Type', 'text/html']]),
        text: async () => mockHtml
      });

      // Test with leading slash
      await fetcher.fetch('QmTest', '/index.html');
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/ipfs/QmTest/index.html'),
        expect.any(Object)
      );

      // Test without leading slash
      await fetcher.fetch('QmTest', 'index.html');
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/ipfs/QmTest/index.html'),
        expect.any(Object)
      );
    });
  });
});
