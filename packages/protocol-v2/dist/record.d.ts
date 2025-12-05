import type { FRWKeyPairV2 } from '@frw/crypto-pq';
import type { ProofOfWorkV2 } from '@frw/pow-v2';
import type { DistributedNameRecordV2 } from './types.js';
export declare class RecordManagerV2 {
    private signatureManager;
    private keyManager;
    constructor();
    /**
     * Create a new V2 record
     */
    createRecord(name: string, contentCID: string, ipnsKey: string, keyPair: FRWKeyPairV2, proof: ProofOfWorkV2, previousRecord?: DistributedNameRecordV2): DistributedNameRecordV2;
    /**
     * Sign a record with hybrid signatures
     */
    private signRecord;
    /**
     * Compute record hash for chain linking
     */
    private computeRecordHash;
    /**
     * Validate name format
     */
    private validateNameFormat;
    /**
     * Update record content
     */
    updateRecord(existingRecord: DistributedNameRecordV2, newContentCID: string, keyPair: FRWKeyPairV2, proof: ProofOfWorkV2): DistributedNameRecordV2;
}
/**
 * Convenience functions
 */
export declare function createRecordV2(name: string, contentCID: string, ipnsKey: string, keyPair: FRWKeyPairV2, proof: ProofOfWorkV2): DistributedNameRecordV2;
