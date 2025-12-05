import type { DistributedNameRecordV2, VerificationResultV2 } from './types.js';
export declare class RecordVerifierV2 {
    private signatureManager;
    constructor();
    /**
     * Verify record completely (zero trust)
     * MUST be called for ALL records from untrusted sources
     */
    verify(record: DistributedNameRecordV2, previousRecord?: DistributedNameRecordV2): Promise<VerificationResultV2>;
    /**
     * Validate name format
     */
    private validateNameFormat;
    /**
     * Verify hash chain
     */
    private verifyHashChain;
    /**
     * Constant-time hash comparison
     */
    private compareHashes;
}
/**
 * Convenience function
 */
export declare function verifyRecordV2(record: DistributedNameRecordV2, previousRecord?: DistributedNameRecordV2): Promise<VerificationResultV2>;
