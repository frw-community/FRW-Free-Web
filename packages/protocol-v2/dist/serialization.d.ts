import type { DistributedNameRecordV2 } from './types.js';
/**
 * Serialize record to canonical CBOR format
 * Used for signatures and hashing
 */
export declare function serializeCanonical(record: DistributedNameRecordV2): Uint8Array;
/**
 * Serialize full record for storage/transmission
 */
export declare function serializeFull(record: DistributedNameRecordV2): Uint8Array;
/**
 * Deserialize full record
 */
export declare function deserializeFull(data: Uint8Array): DistributedNameRecordV2;
/**
 * Serialize to JSON (for HTTP API)
 */
export declare function toJSON(record: DistributedNameRecordV2): string;
/**
 * Deserialize from JSON (for HTTP API)
 */
export declare function fromJSON(json: string): DistributedNameRecordV2;
