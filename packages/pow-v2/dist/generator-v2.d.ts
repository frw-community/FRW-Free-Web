import type { ProofOfWorkV2, POWProgress } from './types';
export declare class ProofOfWorkGeneratorV2 {
    /**
     * Generate quantum-resistant proof of work
     * Uses Argon2id for memory-hardness + SHA3-256 for hashing
     */
    generate(name: string, publicKey_pq: Uint8Array, onProgress?: (progress: POWProgress) => void): Promise<ProofOfWorkV2>;
    /**
     * Compute Argon2id-SHA3 hash
     */
    private computeHash;
    /**
     * Check if hash has required leading zeros
     * For hex representation: 2 hex digits = 1 byte
     */
    private hasLeadingZeros;
    /**
     * Convert hash to hex string for debugging
     */
    private hashToHex;
}
/**
 * Convenience function
 */
export declare function generatePOWV2(name: string, publicKey_pq: Uint8Array, onProgress?: (progress: POWProgress) => void): Promise<ProofOfWorkV2>;
