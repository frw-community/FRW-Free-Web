/**
 * FRW Naming System
 * Human-readable names → Public keys
 */

import { SignatureManager } from '@frw/crypto';
import { ProtocolError } from '@frw/common';

export interface NameRecord {
  name: string;
  publicKey: string;
  ipnsName: string;
  signature: string;
  timestamp: number;
  expires?: number;
  metadata?: {
    description?: string;
    email?: string;
    website?: string;
  };
}

export interface DNSFRWRecord {
  publicKey: string;
  name?: string;
  verified: boolean;
}

export class FRWNamingSystem {
  private cache: Map<string, NameRecord>;
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly bootstrapNodes: string[];

  constructor(bootstrapConfig?: { useDefaults?: boolean; customNodes?: string[] }) {
    this.cache = new Map();
    // Default bootstrap nodes - hardcoded for reliability
    this.bootstrapNodes = bootstrapConfig?.customNodes || [
      'http://localhost:3100',
      'http://83.228.214.189:3100',
      'http://83.228.213.45:3100',
      'http://83.228.213.240:3100',
      'http://83.228.214.72:3100',
      'http://155.117.46.244:3100',
      'http://165.73.244.107:3100',
      'http://165.73.244.74:3100'
    ];
  }

  /**
   * Resolve human-readable name to public key
   */
  async resolveName(name: string): Promise<string> {
    // Check cache
    const cached = this.cache.get(name);
    if (cached && !this.isExpired(cached)) {
      return cached.publicKey;
    }

    // Query DHT (placeholder - requires IPFS integration)
    const record = await this.queryDHT(name);
    if (!record) {
      throw new ProtocolError(`Name not found: ${name}`);
    }

    // Verify signature
    if (!this.verifyNameRecord(record)) {
      throw new ProtocolError(`Invalid signature for name: ${name}`);
    }

    // Cache
    this.cache.set(name, record);

    return record.publicKey;
  }

  /**
   * Register a new name
   */
  createNameRecord(
    name: string,
    publicKey: string,
    ipnsName: string,
    privateKey: Uint8Array,
    metadata?: NameRecord['metadata']
  ): NameRecord {
    const record: NameRecord = {
      name,
      publicKey,
      ipnsName,
      signature: '',
      timestamp: Date.now(),
      metadata
    };

    // Sign the record
    const message = this.serializeForSigning(record);
    record.signature = SignatureManager.sign(message, privateKey);

    return record;
  }

  /**
   * Verify name record signature
   */
  verifyNameRecord(record: NameRecord): boolean {
    try {
      const message = this.serializeForSigning(record);
      const publicKey = SignatureManager.decodePublicKey(record.publicKey);
      return SignatureManager.verify(message, record.signature, publicKey);
    } catch {
      return false;
    }
  }

  /**
   * Check if record is expired
   */
  private isExpired(record: NameRecord): boolean {
    if (record.expires) {
      return Date.now() > record.expires;
    }
    // Cache TTL
    return Date.now() - record.timestamp > this.CACHE_TTL;
  }

  /**
   * Serialize record for signing
   */
  private serializeForSigning(record: NameRecord): string {
    return JSON.stringify({
      name: record.name,
      publicKey: record.publicKey,
      ipnsName: record.ipnsName,
      timestamp: record.timestamp,
      expires: record.expires,
      metadata: record.metadata
    });
  }

  /**
   * Query DHT for name record via bootstrap nodes
   * Parallel queries to multiple bootstrap nodes for fast resolution (50-100ms)
   */
  private async queryDHT(name: string): Promise<NameRecord | null> {
    const startTime = Date.now();
    
    try {
      // Query all bootstrap nodes in parallel
      const queries = this.bootstrapNodes.map(async (nodeUrl) => {
        try {
          const response = await fetch(`${nodeUrl}/api/resolve/${encodeURIComponent(name)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'FRW-Protocol/2.0'
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout per node
          });
          
          if (!response.ok) {
            return null;
          }
          
          const data = await response.json() as any;
          
          // Validate response structure
          if (data && typeof data === 'object' && 
              'name' in data && 'publicKey' in data && 
              'signature' in data && 'ipnsName' in data) {
            const record: NameRecord = {
              name: data.name,
              publicKey: data.publicKey,
              ipnsName: data.ipnsName,
              signature: data.signature,
              timestamp: data.timestamp || Date.now(),
              expires: data.expires,
              metadata: data.metadata
            };
            
            // Verify the signature
            if (this.verifyNameRecord(record)) {
              console.log(`[FRW Naming] Resolved ${name} via ${nodeUrl} in ${Date.now() - startTime}ms`);
              return record;
            }
          }
          
          return null;
        } catch (error) {
          console.warn(`[FRW Naming] Failed to query ${nodeUrl}:`, error instanceof Error ? error.message : error);
          return null;
        }
      });
      
      // Wait for first successful response
      const results = await Promise.allSettled(queries);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value !== null) {
          return result.value;
        }
      }
      
      console.log(`[FRW Naming] No bootstrap nodes returned results for ${name}`);
      return null;
      
    } catch (error) {
      console.error(`[FRW Naming] DHT query failed for ${name}:`, error);
      return null;
    }
  }

  /**
   * Publish name record to bootstrap nodes
   * Publishes to all bootstrap nodes for redundancy and fast propagation
   */
  async publishNameRecord(record: NameRecord): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate record before publishing
      if (!this.verifyNameRecord(record)) {
        throw new ProtocolError(`Invalid signature for record: ${record.name}`);
      }
      
      // Publish to all bootstrap nodes in parallel
      const publishPromises = this.bootstrapNodes.map(async (nodeUrl) => {
        try {
          const response = await fetch(`${nodeUrl}/api/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'FRW-Protocol/2.0'
            },
            body: JSON.stringify(record),
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          const result = await response.json();
          console.log(`[FRW Naming] Published ${record.name} to ${nodeUrl} in ${Date.now() - startTime}ms`);
          return result;
          
        } catch (error) {
          console.error(`[FRW Naming] Failed to publish to ${nodeUrl}:`, error instanceof Error ? error.message : error);
          throw error;
        }
      });
      
      // Wait for all publications to complete
      const results = await Promise.allSettled(publishPromises);
      
      // Check if at least one publication succeeded
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      if (successCount === 0) {
        throw new ProtocolError(`Failed to publish ${record.name} to any bootstrap node`);
      }
      
      if (successCount < this.bootstrapNodes.length) {
        console.warn(`[FRW Naming] Published ${record.name} to ${successCount}/${this.bootstrapNodes.length} bootstrap nodes`);
      }
      
      // Cache the published record
      this.cache.set(record.name, record);
      
      console.log(`[FRW Naming] Successfully published ${record.name} to ${successCount} bootstrap nodes`);
      
    } catch (error) {
      console.error(`[FRW Naming] Failed to publish ${record.name}:`, error);
      throw error;
    }
  }

  /**
   * Query DNS TXT records for FRW key
   * Note: Full DNS verification is handled by @frw/name-registry
   * This is a lightweight query method
   */
  static async queryDNS(domain: string): Promise<DNSFRWRecord | null> {
    try {
      // Use DNSVerifier from name-registry for actual implementation
      const { DNSVerifier } = await import('@frw/name-registry');
      const verifier = new DNSVerifier();
      const result = await verifier.verifyDomainOwnership(domain, '');
      
      if (result.dnsKey) {
        return {
          publicKey: result.dnsKey,
          name: domain,
          verified: result.verified
        };
      }
      return null;
    } catch {
      return null;
    }
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

  /**
   * Check if name exists in cache
   */
  hasCached(name: string): boolean {
    const cached = this.cache.get(name);
    return cached !== undefined && !this.isExpired(cached);
  }

  /**
   * Get cached record
   */
  getCached(name: string): NameRecord | null {
    const cached = this.cache.get(name);
    if (cached && !this.isExpired(cached)) {
      return cached;
    }
    return null;
  }

  /**
   * Force refresh name from bootstrap nodes
   */
  async refreshName(name: string): Promise<NameRecord> {
    // Clear from cache
    this.cache.delete(name);
    
    // Query DHT
    const record = await this.queryDHT(name);
    if (!record) {
      throw new ProtocolError(`Name not found: ${name}`);
    }
    
    // Verify signature
    if (!this.verifyNameRecord(record)) {
      throw new ProtocolError(`Invalid signature for name: ${name}`);
    }
    
    // Cache and return
    this.cache.set(name, record);
    return record;
  }

  /**
   * Get bootstrap node status
   */
  async getBootstrapStatus(): Promise<{ node: string; online: boolean; latency?: number }[]> {
    const statusPromises = this.bootstrapNodes.map(async (nodeUrl) => {
      try {
        const startTime = Date.now();
        const response = await fetch(`${nodeUrl}/api/status`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          return {
            node: nodeUrl,
            online: true,
            latency: Date.now() - startTime
          };
        }
        
        return { node: nodeUrl, online: false };
      } catch {
        return { node: nodeUrl, online: false };
      }
    });
    
    return Promise.all(statusPromises);
  }
}
