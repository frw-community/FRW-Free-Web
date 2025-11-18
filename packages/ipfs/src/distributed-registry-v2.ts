// FRW Distributed Registry V2 Integration
// Adds quantum-resistant V2 support while maintaining V1 compatibility

import type { DistributedNameRecord, ResolvedName, RegistryConfig } from './distributed-registry';
import type { DistributedNameRecordV2, ResolvedNameV2 } from '@frw/protocol-v2';
import { RecordVerifierV2, serializeFull, deserializeFull } from '@frw/protocol-v2';
import { create as createIPFSClient, IPFSHTTPClient } from 'ipfs-http-client';

/**
 * Union type for V1 or V2 records
 */
export type DistributedNameRecordAny = DistributedNameRecord | DistributedNameRecordV2;

/**
 * Unified resolution result
 */
export interface ResolvedNameAny {
  record: DistributedNameRecordAny;
  version: 1 | 2;
  source: 'dht' | 'ipns' | 'cache' | 'pubsub' | 'bootstrap';
  resolvedAt: number;
  latencyMs: number;
  verified: boolean;
  pqSecure?: boolean; // Only for V2
}

/**
 * V2 Registry Extension
 * Adds quantum-resistant capabilities to distributed registry
 */
export class DistributedRegistryV2 {
  private ipfs: IPFSHTTPClient;
  private bootstrapNodes?: string[];
  private verifier: RecordVerifierV2;
  
  // Separate cache for V2 records
  private v2Cache: Map<string, { record: DistributedNameRecordV2; expires: number }>;
  
  private readonly V2_CACHE_TTL = 300000;  // 5 minutes
  private readonly PUBSUB_TOPIC_V2 = 'frw/names/updates/v2';
  
  constructor(config: RegistryConfig = {}) {
    const ipfsUrl = config.ipfsUrl || 'http://127.0.0.1:5001';
    this.ipfs = createIPFSClient({ url: ipfsUrl });
    this.bootstrapNodes = config.bootstrapNodes;
    this.verifier = new RecordVerifierV2();
    this.v2Cache = new Map();
  }

  /**
   * Detect record version
   */
  detectVersion(record: any): 1 | 2 {
    if ('version' in record && record.version === 2) {
      return 2;
    }
    return 1;
  }

  /**
   * Resolve name (V1 or V2)
   * Returns appropriate record type based on what's stored
   */
  async resolveName(name: string): Promise<ResolvedNameAny | null> {
    const startTime = Date.now();

    try {
      // Check V2 cache first
      const cached = this.v2Cache.get(name);
      if (cached && cached.expires > Date.now()) {
        return {
          record: cached.record,
          version: 2,
          source: 'cache',
          resolvedAt: Date.now(),
          latencyMs: Date.now() - startTime,
          verified: true,
          pqSecure: true
        };
      }

      // Try bootstrap nodes (they should support both V1 and V2)
      if (this.bootstrapNodes && this.bootstrapNodes.length > 0) {
        const bootstrapRecord = await this.resolveFromBootstrap(name);
        if (bootstrapRecord) {
          const version = this.detectVersion(bootstrapRecord);
          
          if (version === 2) {
            this.cacheV2Record(bootstrapRecord as DistributedNameRecordV2);
            const verification = await this.verifier.verify(bootstrapRecord as DistributedNameRecordV2);
            
            return {
              record: bootstrapRecord as DistributedNameRecordV2,
              version: 2,
              source: 'bootstrap',
              resolvedAt: Date.now(),
              latencyMs: Date.now() - startTime,
              verified: verification.valid,
              pqSecure: verification.pqSecure
            };
          }
        }
      }

      // Try DHT lookup
      const dhtRecord = await this.resolveFromDHT(name);
      if (dhtRecord) {
        const version = this.detectVersion(dhtRecord);
        
        if (version === 2) {
          this.cacheV2Record(dhtRecord as DistributedNameRecordV2);
          const verification = await this.verifier.verify(dhtRecord as DistributedNameRecordV2);
          
          return {
            record: dhtRecord as DistributedNameRecordV2,
            version: 2,
            source: 'dht',
            resolvedAt: Date.now(),
            latencyMs: Date.now() - startTime,
            verified: verification.valid,
            pqSecure: verification.pqSecure
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`[RegistryV2] Error resolving "${name}":`, error);
      return null;
    }
  }

  /**
   * Register V2 name
   */
  async registerV2(record: DistributedNameRecordV2): Promise<void> {
    // Verify record before storing
    const verification = await this.verifier.verify(record);
    if (!verification.valid) {
      throw new Error(`Invalid V2 record: ${verification.errors.join(', ')}`);
    }

    // Store to DHT
    await this.storeToDHT(record);
    
    // Broadcast via pubsub
    await this.broadcastUpdate(record);
    
    // Cache locally
    this.cacheV2Record(record);
    
    console.log(`[RegistryV2] ✓ Registered V2 name: ${record.name}`);
  }

  /**
   * Store V2 record to DHT
   */
  private async storeToDHT(record: DistributedNameRecordV2): Promise<void> {
    const key = `frw/v2/names/${record.name}`;
    
    try {
      // Serialize to CBOR
      const serialized = serializeFull(record);
      
      // Store to IPFS
      const result = await this.ipfs.add(serialized, { pin: true });
      const cid = result.cid.toString();
      
      console.log(`[RegistryV2] Stored V2 record to IPFS: ${cid}`);
      
      // Also store as JSON for HTTP bootstrap nodes
      const jsonValue = JSON.stringify({
        name: record.name,
        cid,
        version: 2,
        timestamp: Date.now()
      });
      
      await this.ipfs.add(jsonValue, { pin: true });
      
    } catch (error) {
      console.error('[RegistryV2] DHT storage failed:', error);
      throw error;
    }
  }

  /**
   * Resolve from bootstrap nodes
   */
  private async resolveFromBootstrap(name: string): Promise<DistributedNameRecordAny | null> {
    if (!this.bootstrapNodes || this.bootstrapNodes.length === 0) {
      return null;
    }

    const promises = this.bootstrapNodes.map(async (nodeUrl) => {
      try {
        const response = await fetch(`${nodeUrl}/api/resolve/${name}`, {
          timeout: 5000
        } as any);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data;
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }

    return null;
  }

  /**
   * Resolve from DHT
   */
  private async resolveFromDHT(name: string): Promise<DistributedNameRecordAny | null> {
    try {
      // Try V2 key first
      const v2Key = `frw/v2/names/${name}`;
      
      // List all content with this name prefix
      const entries: any[] = [];
      for await (const entry of this.ipfs.ls(v2Key)) {
        entries.push(entry);
      }
      
      if (entries.length > 0) {
        // Get the most recent entry
        const latest = entries[0];
        const chunks: Uint8Array[] = [];
        
        for await (const chunk of this.ipfs.cat(latest.cid)) {
          chunks.push(chunk);
        }
        
        const data = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Try to deserialize as V2 CBOR
        try {
          const record = deserializeFull(data);
          return record;
        } catch {
          // Not CBOR, might be JSON (V1)
          const json = new TextDecoder().decode(data);
          return JSON.parse(json);
        }
      }
      
      return null;
    } catch (error) {
      console.error('[RegistryV2] DHT lookup failed:', error);
      return null;
    }
  }

  /**
   * Broadcast update via pubsub
   */
  private async broadcastUpdate(record: DistributedNameRecordV2): Promise<void> {
    try {
      const message = serializeFull(record);
      await this.ipfs.pubsub.publish(this.PUBSUB_TOPIC_V2, message);
      console.log(`[RegistryV2] Broadcast update for: ${record.name}`);
    } catch (error) {
      console.error('[RegistryV2] Pubsub broadcast failed:', error);
    }
  }

  /**
   * Cache V2 record
   */
  private cacheV2Record(record: DistributedNameRecordV2): void {
    this.v2Cache.set(record.name, {
      record,
      expires: Date.now() + this.V2_CACHE_TTL
    });
  }

  /**
   * Subscribe to V2 updates
   */
  async subscribeToUpdates(callback: (record: DistributedNameRecordV2) => void): Promise<void> {
    try {
      await this.ipfs.pubsub.subscribe(this.PUBSUB_TOPIC_V2, (msg) => {
        try {
          const record = deserializeFull(msg.data);
          this.cacheV2Record(record);
          callback(record);
        } catch (error) {
          console.error('[RegistryV2] Failed to parse pubsub message:', error);
        }
      });
      
      console.log('[RegistryV2] Subscribed to V2 updates');
    } catch (error) {
      console.error('[RegistryV2] Pubsub subscription failed:', error);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      v2CachedRecords: this.v2Cache.size
    };
  }
}
