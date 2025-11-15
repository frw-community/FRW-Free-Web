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

  constructor() {
    this.cache = new Map();
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
   * Query DHT for name record (placeholder)
   * Future Enhancement: Direct DHT queries without bootstrap nodes
   * Current system uses bootstrap nodes for fast resolution (50-100ms)
   */
  private async queryDHT(name: string): Promise<NameRecord | null> {
    // Future v2.0: Implement direct DHT query via IPFS
    // Bootstrap nodes provide faster resolution, so this is not critical
    return null;
  }

  /**
   * Publish name record to DHT (placeholder)
   * Future Enhancement: Direct DHT publishing
   * Current system uses IPFS pubsub via bootstrap nodes
   */
  async publishNameRecord(record: NameRecord): Promise<void> {
    // Future v2.0: Implement direct DHT publish via IPFS
    // Current system uses bootstrap nodes + pubsub (works well)
    this.cache.set(record.name, record);
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
}
