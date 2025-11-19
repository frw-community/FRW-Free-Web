import type { DistributedNameRecordV2 } from '@frw/protocol-v2';
interface V2IndexEntry {
    name: string;
    version: 2;
    publicKey_dilithium3: string;
    did: string;
    contentCID: string;
    ipnsKey: string;
    timestamp: number;
    pqSecure: boolean;
    recordData: string;
}
export declare class V2RecordManager {
    private v2Index;
    private verifier;
    private readonly PUBSUB_TOPIC_V2;
    constructor();
    /**
     * Add V2 record to index after verification
     */
    addRecord(record: DistributedNameRecordV2): Promise<boolean>;
    /**
     * Get V2 record by name
     */
    getRecord(name: string): V2IndexEntry | undefined;
    /**
     * Get full V2 record (deserialized)
     */
    getFullRecord(name: string): DistributedNameRecordV2 | null;
    /**
     * Get all V2 records
     */
    getAllRecords(): V2IndexEntry[];
    /**
     * Get index size
     */
    size(): number;
    /**
     * Handle pubsub message
     */
    handlePubsubMessage(data: Uint8Array): Promise<void>;
    /**
     * Export record as JSON (for HTTP API)
     */
    exportRecordJSON(name: string): string | null;
    /**
     * Get pubsub topic
     */
    getPubsubTopic(): string;
    /**
     * Get statistics
     */
    getStats(): {
        totalV2Records: number;
        pqSecureRecords: number;
        oldestRecord: number | null;
        newestRecord: number | null;
    };
}
/**
 * Unified response format (V1 or V2)
 */
export interface UnifiedRecord {
    version: 1 | 2;
    name: string;
    publicKey?: string;
    publicKey_dilithium3?: string;
    did?: string;
    contentCID: string;
    ipnsKey: string;
    timestamp: number;
    signature?: string;
    pqSecure?: boolean;
    recordData?: string;
}
/**
 * Create unified response from V1 or V2 entry
 */
export declare function createUnifiedResponse(entry: any, version: 1 | 2, nodeId: string): any;
export {};
//# sourceMappingURL=v2-support.d.ts.map