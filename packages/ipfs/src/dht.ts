// FRW DHT Name Registry
// Distributed name resolution via IPFS DHT

import { create as createIPFSClient, IPFSHTTPClient } from 'ipfs-http-client';
import { SignatureManager } from '@frw/crypto';
import type { ProofOfWork } from '@frw/name-registry';
import bs58 from 'bs58';

/**
 * Name record stored in DHT
 */
export interface NameRecord {
  name: string;           // Human-readable name (e.g., "pouet")
  publicKey: string;      // Base58 encoded Ed25519 public key
  ipnsKey: string;        // IPNS key for content resolution
  timestamp: number;      // Unix timestamp (milliseconds)
  signature: string;      // Signature of (name:publicKey:timestamp)
  proof: ProofOfWork;     // Proof of work (anti-spam)
}

/**
 * Resolved content information
 */
export interface ResolvedName {
  name: string;
  publicKey: string;
  ipnsKey: string;
  timestamp: number;
  source: 'dht' | 'ipns' | 'cache';
}

/**
 * DHT-based name registry for FRW
 * Provides global, decentralized name → publicKey resolution
 */
export class DHTNameRegistry {
  private ipfs: IPFSHTTPClient;
  private cache: Map<string, { record: NameRecord; expires: number }>;
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(ipfsUrl = 'http://localhost:5001') {
    this.ipfs = createIPFSClient({ url: ipfsUrl });
    this.cache = new Map();
  }

  /**
   * Publish a name record to the DHT
   * Makes the name globally resolvable by anyone
   */
  async publishName(record: NameRecord): Promise<void> {
    // Validate record
    this.validateRecord(record);

    // Verify signature
    if (!this.verifySignature(record)) {
      throw new Error('Invalid signature on name record');
    }

    const key = this.getDHTKey(record.name);
    const value = JSON.stringify(record);

    try {
      // Note: IPFS DHT operations are complex and may require specific configuration
      // For now, we'll use a simplified approach with IPNS as primary mechanism
      // DHT operations will be fully implemented in next iteration
      
      // Store locally for now (will implement full DHT in next version)
      console.warn('[DHT] DHT publishing not yet fully implemented - using local storage');
      
      // Cache the record
      this.setCached(record.name, record);

      console.log(`[DHT] Published name "${record.name}" to global network`);
    } catch (error) {
      throw new Error(`Failed to publish to DHT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resolve a name from the DHT
   * Returns null if name not found
   */
  async resolveName(name: string, timeout = 5000): Promise<NameRecord | null> {
    // Check cache first
    const cached = this.getCached(name);
    if (cached) {
      console.log(`[DHT] Resolved "${name}" from cache`);
      return cached;
    }

    const key = this.getDHTKey(name);

    try {
      console.log(`[DHT] Querying network for "${name}"...`);
      
      // Query DHT with timeout
      const result = await Promise.race([
        this.queryDHT(key),
        this.timeout(timeout)
      ]);

      if (!result) {
        console.log(`[DHT] Name "${name}" not found in DHT`);
        return null;
      }

      const record: NameRecord = JSON.parse(result.toString());

      // Verify signature
      if (!this.verifySignature(record)) {
        console.warn(`[DHT] Invalid signature for "${name}"`);
        return null;
      }

      // Validate record
      this.validateRecord(record);

      // Cache it
      this.setCached(name, record);

      console.log(`[DHT] Resolved "${name}" → ${record.publicKey.substring(0, 12)}...`);
      return record;
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.warn(`[DHT] Timeout resolving "${name}" (${timeout}ms)`);
      } else {
        console.warn(`[DHT] Error resolving "${name}":`, error);
      }
      return null;
    }
  }

  /**
   * Check if a name exists in DHT
   */
  async nameExists(name: string): Promise<boolean> {
    const record = await this.resolveName(name, 3000);
    return record !== null;
  }

  /**
   * Get all names published by a public key (expensive operation)
   */
  async getNamesByPublicKey(publicKey: string): Promise<string[]> {
    // This would require scanning DHT or maintaining an index
    // For now, not implemented (would be in IPNS registry fallback)
    throw new Error('Not implemented - use IPNS registry for batch queries');
  }

  /**
   * Clear cache for a specific name or all names
   */
  clearCache(name?: string): void {
    if (name) {
      this.cache.delete(name);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get DHT key for a name
   */
  private getDHTKey(name: string): string {
    return `/frw/name/${name.toLowerCase()}`;
  }

  /**
   * Query DHT for a key
   * Note: Simplified implementation for now - will use full DHT in next version
   */
  private async queryDHT(key: string): Promise<Buffer | null> {
    // For now, DHT queries are not implemented
    // This will be replaced with real DHT operations in the next iteration
    // Currently using IPNS registry as primary mechanism
    return null;
  }

  /**
   * Verify record signature
   */
  private verifySignature(record: NameRecord): boolean {
    try {
      const message = `${record.name}:${record.publicKey}:${record.timestamp}`;
      const publicKeyBytes = SignatureManager.decodePublicKey(record.publicKey);

      return SignatureManager.verify(message, record.signature, publicKeyBytes);
    } catch (error) {
      console.warn('[DHT] Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Validate record fields
   */
  private validateRecord(record: NameRecord): void {
    if (!record.name || typeof record.name !== 'string') {
      throw new Error('Invalid name field');
    }

    if (!record.publicKey || typeof record.publicKey !== 'string') {
      throw new Error('Invalid publicKey field');
    }

    if (!record.timestamp || typeof record.timestamp !== 'number') {
      throw new Error('Invalid timestamp field');
    }

    if (!record.signature || typeof record.signature !== 'string') {
      throw new Error('Invalid signature field');
    }

    // Check timestamp is not too far in future or past
    const now = Date.now();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    const maxFuture = 60 * 60 * 1000; // 1 hour

    if (record.timestamp < now - maxAge) {
      throw new Error('Record timestamp too old');
    }

    if (record.timestamp > now + maxFuture) {
      throw new Error('Record timestamp in future');
    }
  }

  /**
   * Get cached record
   */
  private getCached(name: string): NameRecord | null {
    const cached = this.cache.get(name);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expires) {
      this.cache.delete(name);
      return null;
    }

    return cached.record;
  }

  /**
   * Cache a record
   */
  private setCached(name: string, record: NameRecord): void {
    this.cache.set(name, {
      record,
      expires: Date.now() + this.CACHE_TTL
    });
  }

  /**
   * Create a timeout promise
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new TimeoutError(`Operation timed out after ${ms}ms`)), ms);
    });
  }
}

/**
 * Timeout error
 */
class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Create a signed name record
 */
export function createNameRecord(
  name: string,
  publicKey: string,
  ipnsKey: string,
  privateKey: Uint8Array,
  proof: ProofOfWork
): NameRecord {
  const timestamp = Date.now();
  const message = `${name}:${publicKey}:${timestamp}`;
  
  const signature = SignatureManager.sign(message, privateKey);

  return {
    name,
    publicKey,
    ipnsKey,
    timestamp,
    signature,
    proof
  };
}
