import type { FRWKeyPairV2, HybridSignature, CryptoConfigV2 } from './types';
export declare class SignatureManagerV2 {
    private config;
    constructor(config?: CryptoConfigV2);
    /**
     * Sign message with hybrid signatures
     * Returns both Ed25519 and Dilithium3 signatures
     */
    sign(message: Uint8Array, keyPair: FRWKeyPairV2, timestamp?: number): HybridSignature;
    /**
     * Verify hybrid signature
     * Both signatures must be valid (in hybrid mode)
     */
    verify(message: Uint8Array, signature: HybridSignature, keyPair: FRWKeyPairV2): boolean;
    /**
     * Sign string content (convenience wrapper)
     */
    signString(content: string, keyPair: FRWKeyPairV2): HybridSignature;
    /**
     * Verify string content (convenience wrapper)
     */
    verifyString(content: string, signature: HybridSignature, keyPair: FRWKeyPairV2): boolean;
    /**
     * Serialize signature to portable format
     */
    serializeSignature(signature: HybridSignature): string;
    /**
     * Deserialize signature from portable format
     */
    deserializeSignature(serialized: string): HybridSignature;
    /**
     * Convert timestamp to bytes
     */
    private timestampToBytes;
}
/**
 * Convenience functions
 */
export declare function signV2(message: Uint8Array, keyPair: FRWKeyPairV2): HybridSignature;
export declare function verifyV2(message: Uint8Array, signature: HybridSignature, keyPair: FRWKeyPairV2): boolean;
export declare function signStringV2(content: string, keyPair: FRWKeyPairV2): HybridSignature;
export declare function verifyStringV2(content: string, signature: HybridSignature, keyPair: FRWKeyPairV2): boolean;
