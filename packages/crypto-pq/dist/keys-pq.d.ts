import type { FRWKeyPairV2, CryptoConfigV2 } from './types';
export declare class KeyManagerV2 {
    private config;
    constructor(config?: CryptoConfigV2);
    /**
     * Generate hybrid quantum-resistant keypair
     * Ed25519 (32 byte pubkey) + Dilithium3 (1952 byte pubkey)
     */
    generateKeyPair(seed?: Uint8Array): FRWKeyPairV2;
    /**
     * Expand seed for Dilithium using SHA3
     */
    private expandSeed;
    /**
     * Convert uint32 to bytes (big-endian)
     */
    private u32ToBytes;
    /**
     * Export keypair to portable format (with optional encryption)
     */
    exportKeyPair(keyPair: FRWKeyPairV2, password?: string): {
        version: 2;
        did: string;
        publicKey_ed25519: string;
        privateKey_ed25519: string | {
            encrypted: string;
            salt: string;
            iv: string;
        };
        publicKey_dilithium3: string;
        privateKey_dilithium3: string | {
            encrypted: string;
            salt: string;
            iv: string;
        };
        encrypted?: boolean;
    };
    /**
     * Import keypair from portable format (with optional decryption)
     */
    importKeyPair(data: {
        version: 2;
        did: string;
        publicKey_ed25519: string;
        privateKey_ed25519: string | {
            encrypted: string;
            salt: string;
            iv: string;
        };
        publicKey_dilithium3: string;
        privateKey_dilithium3: string | {
            encrypted: string;
            salt: string;
            iv: string;
        };
        encrypted?: boolean;
    }, password?: string): FRWKeyPairV2;
    /**
     * Validate keypair structure
     */
    validateKeyPair(keyPair: FRWKeyPairV2): boolean;
    /**
     * Derive public key DID (for verification)
     */
    deriveDID(publicKey_dilithium3: Uint8Array): string;
}
/**
 * Convenience functions
 */
export declare function generateKeyPairV2(seed?: Uint8Array): FRWKeyPairV2;
export declare function validateKeyPairV2(keyPair: FRWKeyPairV2): boolean;
