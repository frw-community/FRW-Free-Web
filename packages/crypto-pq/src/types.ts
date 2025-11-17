// Post-Quantum Cryptography Types

export interface FRWKeyPairV2 {
  // Ed25519 (legacy support until 2035)
  publicKey_ed25519: Uint8Array;   // 32 bytes
  privateKey_ed25519: Uint8Array;  // 64 bytes
  
  // Dilithium3 (primary PQ signature)
  publicKey_dilithium3: Uint8Array;   // 1952 bytes
  privateKey_dilithium3: Uint8Array;  // 4000 bytes
  
  // DID identifier
  did: string;  // did:frw:v2:<hash>
}

export interface HybridSignature {
  version: 2;
  
  // Legacy signature (until 2035)
  signature_ed25519: Uint8Array;  // 64 bytes
  
  // Post-quantum signature
  signature_dilithium3: Uint8Array;  // 3293 bytes
  
  // Metadata
  timestamp: number;
  algorithm: 'hybrid-v2' | 'pq-only';
}

export interface HybridHash {
  version: 2;
  
  // Legacy hash (until 2035)
  hash_sha256: Uint8Array;  // 32 bytes
  
  // Post-quantum hash
  hash_sha3_256: Uint8Array;  // 32 bytes
  
  // Algorithm identifier
  algorithm: 'hybrid-v2' | 'pq-only';
}

export interface CryptoConfigV2 {
  // Mode selection
  mode: 'hybrid' | 'pq-only';
  
  // Cutoff date for legacy support
  legacyCutoff: Date;  // 2035-01-01
  
  // Security level
  securityLevel: 'nist-1' | 'nist-3' | 'nist-5';
}

export const DEFAULT_CONFIG_V2: CryptoConfigV2 = {
  mode: 'hybrid',
  legacyCutoff: new Date('2035-01-01'),
  securityLevel: 'nist-3'
};

export class QuantumCryptoError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'QuantumCryptoError';
  }
}
