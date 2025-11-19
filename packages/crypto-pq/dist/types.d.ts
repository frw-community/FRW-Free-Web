export interface FRWKeyPairV2 {
    publicKey_ed25519: Uint8Array;
    privateKey_ed25519: Uint8Array;
    publicKey_dilithium3: Uint8Array;
    privateKey_dilithium3: Uint8Array;
    did: string;
}
export interface HybridSignature {
    version: 2;
    signature_ed25519: Uint8Array;
    signature_dilithium3: Uint8Array;
    timestamp: number;
    algorithm: 'hybrid-v2' | 'pq-only';
}
export interface HybridHash {
    version: 2;
    hash_sha256: Uint8Array;
    hash_sha3_256: Uint8Array;
    algorithm: 'hybrid-v2' | 'pq-only';
}
export interface CryptoConfigV2 {
    mode: 'hybrid' | 'pq-only';
    legacyCutoff: Date;
    securityLevel: 'nist-1' | 'nist-3' | 'nist-5';
}
export declare const DEFAULT_CONFIG_V2: CryptoConfigV2;
export declare class QuantumCryptoError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
