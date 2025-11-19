import type { HybridHash, CryptoConfigV2 } from './types';
export declare class HashManagerV2 {
    private config;
    constructor(config?: CryptoConfigV2);
    /**
     * Compute hybrid hash
     * Returns both SHA-256 and SHA3-256 hashes
     */
    hash(data: Uint8Array): HybridHash;
    /**
     * Hash string content
     */
    hashString(content: string): HybridHash;
    /**
     * Verify hybrid hash (check collision resistance)
     */
    verify(data: Uint8Array, expectedHash: HybridHash): boolean;
    /**
     * Get primary quantum-resistant hash (SHA3-256)
     */
    hashPQ(data: Uint8Array): Uint8Array;
    /**
     * Get high-performance hash (BLAKE3)
     */
    hashFast(data: Uint8Array): Uint8Array;
    /**
     * Constant-time byte comparison
     */
    private compareBytes;
    /**
     * Convert hash to hex string
     */
    toHex(hash: Uint8Array): string;
    /**
     * Convert hex string to hash
     */
    fromHex(hex: string): Uint8Array;
}
/**
 * Convenience functions
 */
export declare function hashV2(data: Uint8Array): HybridHash;
export declare function hashStringV2(content: string): HybridHash;
export declare function verifyHashV2(data: Uint8Array, expectedHash: HybridHash): boolean;
export declare function hashPQ(data: Uint8Array): Uint8Array;
export declare function hashFast(data: Uint8Array): Uint8Array;
