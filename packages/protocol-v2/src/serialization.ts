// CBOR Canonical Serialization

import { encode as cborEncode, decode as cborDecode } from 'cbor-x';
import type { DistributedNameRecordV2 } from './types.js';
import { ProtocolV2Error } from './types.js';

/**
 * Serialize record to canonical CBOR format
 * Used for signatures and hashing
 */
export function serializeCanonical(record: DistributedNameRecordV2): Uint8Array {
  try {
    // Create deterministic object (exclude signatures and hashes)
    const canonical = {
      version: record.version,
      name: record.name,
      publicKey_dilithium3: Array.from(record.publicKey_dilithium3),
      contentCID: record.contentCID,
      recordVersion: record.recordVersion,
      registered: record.registered,
      expires: record.expires,
      previousHash_sha3: record.previousHash_sha3 
        ? Array.from(record.previousHash_sha3)
        : null
    };

    // CBOR encode (deterministic by default)
    const encoded = cborEncode(canonical);

    return new Uint8Array(encoded);
  } catch (error) {
    throw new ProtocolV2Error('Serialization failed', 'SERIALIZATION_ERROR');
  }
}

/**
 * Serialize full record for storage/transmission
 */
export function serializeFull(record: DistributedNameRecordV2): Uint8Array {
  try {
    const data = {
      version: record.version,
      name: record.name,
      publicKey_ed25519: Array.from(record.publicKey_ed25519),
      publicKey_dilithium3: Array.from(record.publicKey_dilithium3),
      did: record.did,
      contentCID: record.contentCID,
      ipnsKey: record.ipnsKey,
      recordVersion: record.recordVersion,
      registered: record.registered,
      expires: record.expires,
      signature_ed25519: Array.from(record.signature_ed25519),
      signature_dilithium3: Array.from(record.signature_dilithium3),
      hash_sha256: Array.from(record.hash_sha256),
      hash_sha3: Array.from(record.hash_sha3),
      proof_v2: {
        version: record.proof_v2.version,
        nonce: record.proof_v2.nonce.toString(),
        timestamp: record.proof_v2.timestamp,
        hash: Array.from(record.proof_v2.hash),
        difficulty: record.proof_v2.difficulty,
        memory_cost_mib: record.proof_v2.memory_cost_mib,
        time_cost: record.proof_v2.time_cost,
        parallelism: record.proof_v2.parallelism
      },
      previousHash_sha3: record.previousHash_sha3
        ? Array.from(record.previousHash_sha3)
        : null,
      providers: record.providers,
      dnslink: record.dnslink
    };

    return new Uint8Array(cborEncode(data));
  } catch (error) {
    throw new ProtocolV2Error('Full serialization failed', 'SERIALIZATION_ERROR');
  }
}

/**
 * Deserialize full record
 */
export function deserializeFull(data: Uint8Array): DistributedNameRecordV2 {
  try {
    const decoded = cborDecode(data);

    return {
      version: decoded.version,
      name: decoded.name,
      publicKey_ed25519: new Uint8Array(decoded.publicKey_ed25519),
      publicKey_dilithium3: new Uint8Array(decoded.publicKey_dilithium3),
      did: decoded.did,
      contentCID: decoded.contentCID,
      ipnsKey: decoded.ipnsKey,
      recordVersion: decoded.recordVersion,
      registered: decoded.registered,
      expires: decoded.expires,
      signature_ed25519: new Uint8Array(decoded.signature_ed25519),
      signature_dilithium3: new Uint8Array(decoded.signature_dilithium3),
      hash_sha256: new Uint8Array(decoded.hash_sha256),
      hash_sha3: new Uint8Array(decoded.hash_sha3),
      proof_v2: {
        version: decoded.proof_v2.version,
        nonce: BigInt(decoded.proof_v2.nonce),
        timestamp: decoded.proof_v2.timestamp,
        hash: new Uint8Array(decoded.proof_v2.hash),
        difficulty: decoded.proof_v2.difficulty,
        memory_cost_mib: decoded.proof_v2.memory_cost_mib,
        time_cost: decoded.proof_v2.time_cost,
        parallelism: decoded.proof_v2.parallelism
      },
      previousHash_sha3: decoded.previousHash_sha3
        ? new Uint8Array(decoded.previousHash_sha3)
        : null,
      providers: decoded.providers || [],
      dnslink: decoded.dnslink
    };
  } catch (error) {
    throw new ProtocolV2Error('Deserialization failed', 'DESERIALIZATION_ERROR');
  }
}

/**
 * Serialize to JSON (for HTTP API)
 */
export function toJSON(record: DistributedNameRecordV2): string {
  const data = {
    version: record.version,
    name: record.name,
    publicKey_ed25519: Buffer.from(record.publicKey_ed25519).toString('base64'),
    publicKey_dilithium3: Buffer.from(record.publicKey_dilithium3).toString('base64'),
    did: record.did,
    contentCID: record.contentCID,
    ipnsKey: record.ipnsKey,
    recordVersion: record.recordVersion,
    registered: record.registered,
    expires: record.expires,
    signature_ed25519: Buffer.from(record.signature_ed25519).toString('base64'),
    signature_dilithium3: Buffer.from(record.signature_dilithium3).toString('base64'),
    hash_sha256: Buffer.from(record.hash_sha256).toString('hex'),
    hash_sha3: Buffer.from(record.hash_sha3).toString('hex'),
    proof_v2: {
      version: record.proof_v2.version,
      nonce: record.proof_v2.nonce.toString(),
      timestamp: record.proof_v2.timestamp,
      hash: Buffer.from(record.proof_v2.hash).toString('hex'),
      difficulty: record.proof_v2.difficulty,
      memory_cost_mib: record.proof_v2.memory_cost_mib,
      time_cost: record.proof_v2.time_cost,
      parallelism: record.proof_v2.parallelism
    },
    previousHash_sha3: record.previousHash_sha3
      ? Buffer.from(record.previousHash_sha3).toString('hex')
      : null,
    providers: record.providers,
    dnslink: record.dnslink
  };

  return JSON.stringify(data);
}

/**
 * Deserialize from JSON (for HTTP API)
 */
export function fromJSON(json: string): DistributedNameRecordV2 {
  try {
    const data = JSON.parse(json);

    return {
      version: data.version,
      name: data.name,
      publicKey_ed25519: new Uint8Array(Buffer.from(data.publicKey_ed25519, 'base64')),
      publicKey_dilithium3: new Uint8Array(Buffer.from(data.publicKey_dilithium3, 'base64')),
      did: data.did,
      contentCID: data.contentCID,
      ipnsKey: data.ipnsKey,
      recordVersion: data.recordVersion,
      registered: data.registered,
      expires: data.expires,
      signature_ed25519: new Uint8Array(Buffer.from(data.signature_ed25519, 'base64')),
      signature_dilithium3: new Uint8Array(Buffer.from(data.signature_dilithium3, 'base64')),
      hash_sha256: new Uint8Array(Buffer.from(data.hash_sha256, 'hex')),
      hash_sha3: new Uint8Array(Buffer.from(data.hash_sha3, 'hex')),
      proof_v2: {
        version: data.proof_v2.version,
        nonce: BigInt(data.proof_v2.nonce),
        timestamp: data.proof_v2.timestamp,
        hash: new Uint8Array(Buffer.from(data.proof_v2.hash, 'hex')),
        difficulty: data.proof_v2.difficulty,
        memory_cost_mib: data.proof_v2.memory_cost_mib,
        time_cost: data.proof_v2.time_cost,
        parallelism: data.proof_v2.parallelism
      },
      previousHash_sha3: data.previousHash_sha3
        ? new Uint8Array(Buffer.from(data.previousHash_sha3, 'hex'))
        : null,
      providers: data.providers || [],
      dnslink: data.dnslink
    };
  } catch (error) {
    throw new ProtocolV2Error('JSON deserialization failed', 'JSON_ERROR');
  }
}
