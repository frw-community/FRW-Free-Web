import type { ProofOfWorkV2 } from '@frw/pow-v2';
export interface DistributedNameRecordV2 {
    version: 2;
    name: string;
    publicKey_ed25519: Uint8Array;
    publicKey_dilithium3: Uint8Array;
    did: string;
    contentCID: string;
    ipnsKey: string;
    recordVersion: number;
    registered: number;
    expires: number;
    signature_ed25519: Uint8Array;
    signature_dilithium3: Uint8Array;
    hash_sha256: Uint8Array;
    hash_sha3: Uint8Array;
    proof_v2: ProofOfWorkV2;
    previousHash_sha3: Uint8Array | null;
    providers: string[];
    dnslink?: string;
}
export interface ResolvedNameV2 {
    record: DistributedNameRecordV2;
    source: 'dht' | 'ipns' | 'cache' | 'pubsub' | 'bootstrap';
    resolvedAt: number;
    latencyMs: number;
    verified: boolean;
    pqSecure: boolean;
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
export declare class ProtocolV2Error extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
