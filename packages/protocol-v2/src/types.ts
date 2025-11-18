// Protocol V2 Types

import type { ProofOfWorkV2 } from '@frw/pow-v2';

export interface DistributedNameRecordV2 {
  // Protocol
  version: 2;
  
  // Identity
  name: string;
  publicKey_ed25519: Uint8Array;      // 32 bytes (legacy)
  publicKey_dilithium3: Uint8Array;   // 1952 bytes
  did: string;                         // did:frw:v2:<hash>
  
  // Content
  contentCID: string;
  ipnsKey: string;
  
  // Metadata
  recordVersion: number;
  registered: number;
  expires: number;
  
  // Cryptography (Hybrid)
  signature_ed25519: Uint8Array;       // 64 bytes (legacy)
  signature_dilithium3: Uint8Array;    // 3293 bytes
  hash_sha256: Uint8Array;             // 32 bytes (legacy)
  hash_sha3: Uint8Array;               // 32 bytes
  
  // Proof of Work (Quantum-Resistant)
  proof_v2: ProofOfWorkV2;
  
  // Chain
  previousHash_sha3: Uint8Array | null;  // 32 bytes
  
  // Discovery
  providers: string[];
  dnslink?: string;
}

export interface ResolvedNameV2 {
  record: DistributedNameRecordV2;
  source: 'dht' | 'ipns' | 'cache' | 'pubsub' | 'bootstrap';
  resolvedAt: number;
  latencyMs: number;
  verified: boolean;
  pqSecure: boolean;  // True if PQ signatures verified
}

export interface NameUpdateMessageV2 {
  type: 'register' | 'update' | 'revoke';
  name: string;
  record: DistributedNameRecordV2;
  timestamp: number;
  signature_pq: Uint8Array;
  publisher_did: string;
}

export interface VerificationResultV2 {
  valid: boolean;
  pqSecure: boolean;
  errors: string[];
  checks: {
    pow: boolean;
    signature_ed25519: boolean;
    signature_dilithium3: boolean;
    hash_chain: boolean;
    expiration: boolean;
    name_format: boolean;
  };
}

export class ProtocolV2Error extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ProtocolV2Error';
  }
}
