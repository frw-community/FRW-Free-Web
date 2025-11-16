/**
 * IPFS Content Fetcher
 * Fetches content from IPFS gateways with smart fallback
 */

export interface IPFSFetchResult {
  content: string | ArrayBuffer;
  mimeType: string;
  gateway: string;
  latency: number;
}

export class IPFSFetcher {
  // Public IPFS gateways in order of preference
  private static readonly GATEWAYS = [
    'https://ipfs.io',
    'https://cloudflare-ipfs.com',
    'https://dweb.link',
    'https://gateway.pinata.cloud',
    'https://ipfs.eth.aragon.network'
  ];
  
  private readonly timeout: number;
  
  constructor(timeout = 10000) {
    this.timeout = timeout;
  }
  
  /**
   * Fetch content from IPFS with gateway fallback
   */
  async fetch(cid: string, path: string = '/index.html'): Promise<IPFSFetchResult> {
    console.log(`[IPFS] Fetching: ${cid}${path}`);
    
    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Try each gateway
    for (const gateway of IPFSFetcher.GATEWAYS) {
      const startTime = Date.now();
      const url = `${gateway}/ipfs/${cid}${normalizedPath}`;
      
      try {
        console.log(`[IPFS] Trying gateway: ${gateway}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const latency = Date.now() - startTime;
          const mimeType = response.headers.get('Content-Type') || this.getMimeType(normalizedPath);
          
          // Get content based on type
          let content: string | ArrayBuffer;
          if (mimeType.startsWith('text/') || mimeType.includes('javascript') || mimeType.includes('json')) {
            content = await response.text();
          } else {
            content = await response.arrayBuffer();
          }
          
          console.log(`[IPFS] Success: ${gateway} (${latency}ms, ${this.formatSize(content)})`);
          
          return {
            content,
            mimeType,
            gateway,
            latency
          };
        } else {
          console.warn(`[IPFS] Gateway returned ${response.status}: ${gateway}`);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`[IPFS] Timeout: ${gateway}`);
        } else {
          console.warn(`[IPFS] Error with ${gateway}:`, error);
        }
      }
    }
    
    throw new Error(`Failed to fetch ${cid}${normalizedPath} from all gateways`);
  }
  
  /**
   * Get MIME type from file path
   */
  private getMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'ico': 'image/x-icon',
      'txt': 'text/plain'
    };
    
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
  
  /**
   * Format content size for logging
   */
  private formatSize(content: string | ArrayBuffer): string {
    const bytes = typeof content === 'string' ? content.length : content.byteLength;
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
}
