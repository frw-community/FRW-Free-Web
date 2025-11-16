/**
 * FRW Name Resolver
 * Queries bootstrap nodes to resolve names to IPFS CIDs
 */

export interface NameRecord {
  name: string;
  publicKey: string;
  contentCID: string;
  ipnsKey: string;
  timestamp: number;
  signature: string;
}

export interface ResolverConfig {
  bootstrapNodes?: string[];
  timeout?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export class FRWResolver {
  private cache: Map<string, { record: NameRecord; expires: number }>;
  private readonly bootstrapNodes: string[];
  private readonly timeout: number;
  private readonly cacheTTL: number;
  
  // Default bootstrap nodes - Swiss nodes from FRW foundation
  private static readonly DEFAULT_BOOTSTRAP_NODES = [
    'http://83.228.214.189:3100',
    'http://83.228.213.45:3100',
    'http://83.228.213.240:3100',
    'http://83.228.214.72:3100'
  ];
  
  constructor(config?: ResolverConfig) {
    this.cache = new Map();
    this.bootstrapNodes = config?.bootstrapNodes || FRWResolver.DEFAULT_BOOTSTRAP_NODES;
    this.timeout = config?.timeout || 3000;
    this.cacheTTL = config?.cacheTTL || 300000; // 5 minutes
  }
  
  /**
   * Resolve name to CID using bootstrap nodes
   */
  async resolveName(name: string): Promise<NameRecord | null> {
    // Check cache first
    const cached = this.getFromCache(name);
    if (cached) {
      console.log(`[Resolver] Cache hit: ${name}`);
      return cached;
    }
    
    console.log(`[Resolver] Resolving: ${name}`);
    
    // Try each bootstrap node
    for (const node of this.bootstrapNodes) {
      try {
        const url = `${node}/api/resolve/${encodeURIComponent(name)}`;
        console.log(`[Resolver] Querying: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json() as NameRecord;
          console.log(`[Resolver] Resolved: ${name} -> ${data.contentCID}`);
          
          // Cache the result
          this.cacheRecord(name, data);
          
          return data;
        } else if (response.status === 404) {
          console.log(`[Resolver] Name not found: ${name}`);
          // Try next bootstrap node
          continue;
        } else {
          console.warn(`[Resolver] Bootstrap returned ${response.status}: ${node}`);
          continue;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`[Resolver] Timeout querying ${node}`);
        } else {
          console.warn(`[Resolver] Error querying ${node}:`, error);
        }
        // Try next bootstrap node
        continue;
      }
    }
    
    console.log(`[Resolver] All bootstrap nodes failed for: ${name}`);
    return null;
  }
  
  /**
   * Get record from cache
   */
  private getFromCache(name: string): NameRecord | null {
    const cached = this.cache.get(name.toLowerCase());
    if (cached && cached.expires > Date.now()) {
      return cached.record;
    }
    // Expired or not found
    this.cache.delete(name.toLowerCase());
    return null;
  }
  
  /**
   * Cache a name record
   */
  private cacheRecord(name: string, record: NameRecord): void {
    this.cache.set(name.toLowerCase(), {
      record,
      expires: Date.now() + this.cacheTTL
    });
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}
