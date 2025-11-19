import type { ProofOfWorkV2 } from './types';
export declare class ProofOfWorkVerifierV2 {
    /**
     * Verify a proof of work
     */
    verify(name: string, publicKey_dilithium3: Uint8Array, proof: ProofOfWorkV2): Promise<boolean>;
    /**
     * Compute hash (same as generator)
     */
    private computeHash;
    /**
     * Check leading zeros
     */
    private hasLeadingZeros;
    /**
     * Constant-time hash comparison
     */
    private compareHashes;
}
/**
 * Convenience function
 */
export declare function verifyPOWV2(name: string, publicKey_pq: Uint8Array, proof: ProofOfWorkV2): Promise<boolean>;
