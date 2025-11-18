// V2 Support Module for Bootstrap Node
// Adds quantum-resistant V2 record support while maintaining V1 compatibility

import type { DistributedNameRecordV2 } from '@frw/protocol-v2';
import { RecordVerifierV2, serializeFull, deserializeFull, toJSON, fromJSON } from '@frw/protocol-v2';

interface V2IndexEntry {
  name: string;
  version: 2;
  publicKey_dilithium3: string;  // Base64 encoded
  did: string;
  contentCID: string;
  ipnsKey: string;
  timestamp: number;
  pqSecure: boolean;
  recordData: string; // Full CBOR record as base64
}

export class V2RecordManager {
  private v2Index: Map<string, V2IndexEntry>;
  private verifier: RecordVerifierV2;
  
  private readonly PUBSUB_TOPIC_V2 = 'frw/names/updates/v2';
  
  constructor() {
    this.v2Index = new Map();
    this.verifier = new RecordVerifierV2();
  }

  /**
   * Add V2 record to index after verification
   */
  async addRecord(record: DistributedNameRecordV2): Promise<boolean> {
    try {
      // Verify record
      const verification = await this.verifier.verify(record);
      if (!verification.valid) {
        console.error('[V2] Invalid record:', verification.errors);
        return false;
      }

      // Create index entry
      const entry: V2IndexEntry = {
        name: record.name,
        version: 2,
        publicKey_dilithium3: Buffer.from(record.publicKey_dilithium3).toString('base64'),
        did: record.did,
        contentCID: record.contentCID,
        ipnsKey: record.ipnsKey,
        timestamp: record.registered,
        pqSecure: verification.pqSecure,
        recordData: Buffer.from(serializeFull(record)).toString('base64')
      };

      this.v2Index.set(record.name.toLowerCase(), entry);
      console.log(`[V2] ✓ Added record: ${record.name} (PQ: ${verification.pqSecure})`);
      
      return true;
    } catch (error) {
      console.error('[V2] Error adding record:', error);
      return false;
    }
  }

  /**
   * Get V2 record by name
   */
  getRecord(name: string): V2IndexEntry | undefined {
    return this.v2Index.get(name.toLowerCase());
  }

  /**
   * Get full V2 record (deserialized)
   */
  getFullRecord(name: string): DistributedNameRecordV2 | null {
    const entry = this.v2Index.get(name.toLowerCase());
    if (!entry) return null;

    try {
      const recordData = Buffer.from(entry.recordData, 'base64');
      return deserializeFull(new Uint8Array(recordData));
    } catch (error) {
      console.error('[V2] Error deserializing record:', error);
      return null;
    }
  }

  /**
   * Get all V2 records
   */
  getAllRecords(): V2IndexEntry[] {
    return Array.from(this.v2Index.values());
  }

  /**
   * Get index size
   */
  size(): number {
    return this.v2Index.size;
  }

  /**
   * Handle pubsub message
   */
  async handlePubsubMessage(data: Uint8Array): Promise<void> {
    try {
      const record = deserializeFull(data);
      await this.addRecord(record);
    } catch (error) {
      console.error('[V2] Error handling pubsub message:', error);
    }
  }

  /**
   * Export record as JSON (for HTTP API)
   */
  exportRecordJSON(name: string): string | null {
    const record = this.getFullRecord(name);
    if (!record) return null;

    try {
      return toJSON(record);
    } catch (error) {
      console.error('[V2] Error exporting JSON:', error);
      return null;
    }
  }

  /**
   * Get pubsub topic
   */
  getPubsubTopic(): string {
    return this.PUBSUB_TOPIC_V2;
  }

  /**
   * Get statistics
   */
  getStats() {
    const records = this.getAllRecords();
    const pqSecureCount = records.filter(r => r.pqSecure).length;

    return {
      totalV2Records: this.v2Index.size,
      pqSecureRecords: pqSecureCount,
      oldestRecord: records.length > 0 ? Math.min(...records.map(r => r.timestamp)) : null,
      newestRecord: records.length > 0 ? Math.max(...records.map(r => r.timestamp)) : null
    };
  }
}

/**
 * Unified response format (V1 or V2)
 */
export interface UnifiedRecord {
  version: 1 | 2;
  name: string;
  publicKey?: string;          // V1
  publicKey_dilithium3?: string; // V2
  did?: string;                // V2
  contentCID: string;
  ipnsKey: string;
  timestamp: number;
  signature?: string;          // V1
  pqSecure?: boolean;          // V2
  recordData?: string;         // V2 full record
}

/**
 * Create unified response from V1 or V2 entry
 */
export function createUnifiedResponse(
  entry: any,
  version: 1 | 2,
  nodeId: string
): any {
  if (version === 1) {
    return {
      version: 1,
      name: entry.name,
      publicKey: entry.publicKey,
      contentCID: entry.contentCID,
      ipnsKey: entry.ipnsKey,
      timestamp: entry.timestamp,
      signature: entry.signature,
      resolvedBy: nodeId
    };
  } else {
    return {
      version: 2,
      name: entry.name,
      publicKey_dilithium3: entry.publicKey_dilithium3,
      did: entry.did,
      contentCID: entry.contentCID,
      ipnsKey: entry.ipnsKey,
      timestamp: entry.timestamp,
      pqSecure: entry.pqSecure,
      recordData: entry.recordData,
      resolvedBy: nodeId
    };
  }
}
