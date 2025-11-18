// Post-Quantum Key Management
// Hybrid Ed25519 + Dilithium3 keypair generation

import nacl from 'tweetnacl';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { sha3_256 } from '@noble/hashes/sha3';
import bs58 from 'bs58';
import type { FRWKeyPairV2, CryptoConfigV2 } from './types';
import { DEFAULT_CONFIG_V2 } from './types';
import { QuantumCryptoError } from './types';

export class KeyManagerV2 {
  private config: CryptoConfigV2;

  constructor(config: CryptoConfigV2 = DEFAULT_CONFIG_V2) {
    this.config = config;
  }

  /**
   * Generate hybrid quantum-resistant keypair
   * Ed25519 (32 byte pubkey) + Dilithium3 (1952 byte pubkey)
   */
  generateKeyPair(seed?: Uint8Array): FRWKeyPairV2 {
    try {
      // Generate Ed25519 keypair (legacy support)
      const ed25519Pair = seed 
        ? nacl.sign.keyPair.fromSeed(seed)
        : nacl.sign.keyPair();

      // Generate Dilithium3 keypair (primary PQ)
      // ml_dsa65 = ML-DSA-65 = Dilithium3 (NIST Level 3)
      const dilithiumSeed = seed 
        ? this.expandSeed(seed, 32)
        : crypto.getRandomValues(new Uint8Array(32));
      
      const dilithiumPair = ml_dsa65.keygen(dilithiumSeed);

      // Create DID from Dilithium public key hash
      const pkHash = sha3_256(dilithiumPair.publicKey);
      const did = `did:frw:v2:${bs58.encode(pkHash)}`;

      return {
        publicKey_ed25519: ed25519Pair.publicKey,
        privateKey_ed25519: ed25519Pair.secretKey,
        publicKey_dilithium3: dilithiumPair.publicKey,
        privateKey_dilithium3: dilithiumPair.secretKey,
        did
      };
    } catch (error) {
      throw new QuantumCryptoError(
        'Keypair generation failed',
        'KEYGEN_ERROR'
      );
    }
  }

  /**
   * Expand seed for Dilithium using SHA3
   */
  private expandSeed(seed: Uint8Array, length: number): Uint8Array {
    const expanded = new Uint8Array(length);
    let offset = 0;
    let counter = 0;

    while (offset < length) {
      const input = new Uint8Array(seed.length + 4);
      input.set(seed);
      input.set(this.u32ToBytes(counter), seed.length);
      
      const hash = sha3_256(input);
      const chunk = Math.min(32, length - offset);
      expanded.set(hash.slice(0, chunk), offset);
      
      offset += chunk;
      counter++;
    }

    return expanded;
  }

  /**
   * Convert uint32 to bytes (big-endian)
   */
  private u32ToBytes(n: number): Uint8Array {
    const bytes = new Uint8Array(4);
    bytes[0] = (n >>> 24) & 0xff;
    bytes[1] = (n >>> 16) & 0xff;
    bytes[2] = (n >>> 8) & 0xff;
    bytes[3] = n & 0xff;
    return bytes;
  }

  /**
   * Export keypair to portable format
   */
  exportKeyPair(keyPair: FRWKeyPairV2): {
    version: 2;
    did: string;
    publicKey_ed25519: string;
    privateKey_ed25519: string;
    publicKey_dilithium3: string;
    privateKey_dilithium3: string;
  } {
    return {
      version: 2,
      did: keyPair.did,
      publicKey_ed25519: bs58.encode(keyPair.publicKey_ed25519),
      privateKey_ed25519: Buffer.from(keyPair.privateKey_ed25519).toString('base64'),
      publicKey_dilithium3: Buffer.from(keyPair.publicKey_dilithium3).toString('base64'),
      privateKey_dilithium3: Buffer.from(keyPair.privateKey_dilithium3).toString('base64')
    };
  }

  /**
   * Import keypair from portable format
   */
  importKeyPair(data: {
    version: 2;
    did: string;
    publicKey_ed25519: string;
    privateKey_ed25519: string;
    publicKey_dilithium3: string;
    privateKey_dilithium3: string;
  }): FRWKeyPairV2 {
    if (data.version !== 2) {
      throw new QuantumCryptoError('Invalid keypair version', 'INVALID_VERSION');
    }

    return {
      did: data.did,
      publicKey_ed25519: new Uint8Array(bs58.decode(data.publicKey_ed25519)),
      privateKey_ed25519: new Uint8Array(Buffer.from(data.privateKey_ed25519, 'base64')),
      publicKey_dilithium3: new Uint8Array(Buffer.from(data.publicKey_dilithium3, 'base64')),
      privateKey_dilithium3: new Uint8Array(Buffer.from(data.privateKey_dilithium3, 'base64'))
    };
  }

  /**
   * Validate keypair structure
   */
  validateKeyPair(keyPair: FRWKeyPairV2): boolean {
    return (
      keyPair.publicKey_ed25519.length === 32 &&
      keyPair.privateKey_ed25519.length === 64 &&
      keyPair.publicKey_dilithium3.length === 1952 &&
      keyPair.privateKey_dilithium3.length === 4000 &&
      keyPair.did.startsWith('did:frw:v2:')
    );
  }

  /**
   * Derive public key DID (for verification)
   */
  deriveDID(publicKey_dilithium3: Uint8Array): string {
    const pkHash = sha3_256(publicKey_dilithium3);
    return `did:frw:v2:${bs58.encode(pkHash)}`;
  }
}

/**
 * Convenience functions
 */
export function generateKeyPairV2(seed?: Uint8Array): FRWKeyPairV2 {
  const manager = new KeyManagerV2();
  return manager.generateKeyPair(seed);
}

export function validateKeyPairV2(keyPair: FRWKeyPairV2): boolean {
  const manager = new KeyManagerV2();
  return manager.validateKeyPair(keyPair);
}
