// Post-Quantum Key Management
// Hybrid Ed25519 + Dilithium3 keypair generation

import nacl from 'tweetnacl';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { sha3_256 } from '@noble/hashes/sha3';
import { scrypt } from '@noble/hashes/scrypt';
import { createCipheriv, createDecipheriv, randomBytes as cryptoRandomBytes } from 'crypto';
import bs58 from 'bs58';
import type { FRWKeyPairV2, CryptoConfigV2 } from './types.js';
import { DEFAULT_CONFIG_V2 } from './types.js';
import { QuantumCryptoError } from './types.js';

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
   * Export keypair to portable format (with optional encryption)
   */
  exportKeyPair(keyPair: FRWKeyPairV2, password?: string): {
    version: 2;
    did: string;
    publicKey_ed25519: string;
    privateKey_ed25519: string | { encrypted: string; salt: string; iv: string };
    publicKey_dilithium3: string;
    privateKey_dilithium3: string | { encrypted: string; salt: string; iv: string };
    encrypted?: boolean;
  } {
    const exported = {
      version: 2 as const,
      did: keyPair.did,
      publicKey_ed25519: bs58.encode(keyPair.publicKey_ed25519),
      privateKey_ed25519: Buffer.from(keyPair.privateKey_ed25519).toString('base64') as string | { encrypted: string; salt: string; iv: string },
      publicKey_dilithium3: Buffer.from(keyPair.publicKey_dilithium3).toString('base64'),
      privateKey_dilithium3: Buffer.from(keyPair.privateKey_dilithium3).toString('base64') as string | { encrypted: string; salt: string; iv: string },
      encrypted: password ? true : undefined
    };

    if (password) {
      // Encrypt private keys
      const salt = cryptoRandomBytes(32);
      const key = scrypt(new TextEncoder().encode(password), salt, { N: 2 ** 16, r: 8, p: 1, dkLen: 32 });
      
      // Encrypt Ed25519 private key
      const iv1 = cryptoRandomBytes(16);
      const cipher1 = createCipheriv('aes-256-gcm', key, iv1);
      const encrypted1 = Buffer.concat([cipher1.update(keyPair.privateKey_ed25519), cipher1.final()]);
      const authTag1 = cipher1.getAuthTag();
      exported.privateKey_ed25519 = {
        encrypted: Buffer.concat([encrypted1, authTag1]).toString('base64'),
        salt: salt.toString('base64'),
        iv: iv1.toString('base64')
      };
      
      // Encrypt Dilithium3 private key
      const iv2 = cryptoRandomBytes(16);
      const cipher2 = createCipheriv('aes-256-gcm', key, iv2);
      const encrypted2 = Buffer.concat([cipher2.update(keyPair.privateKey_dilithium3), cipher2.final()]);
      const authTag2 = cipher2.getAuthTag();
      exported.privateKey_dilithium3 = {
        encrypted: Buffer.concat([encrypted2, authTag2]).toString('base64'),
        salt: salt.toString('base64'),
        iv: iv2.toString('base64')
      };
    }

    return exported;
  }

  /**
   * Import keypair from portable format (with optional decryption)
   */
  importKeyPair(data: {
    version: 2;
    did: string;
    publicKey_ed25519: string;
    privateKey_ed25519: string | { encrypted: string; salt: string; iv: string };
    publicKey_dilithium3: string;
    privateKey_dilithium3: string | { encrypted: string; salt: string; iv: string };
    encrypted?: boolean;
  }, password?: string): FRWKeyPairV2 {
    if (data.version !== 2) {
      throw new QuantumCryptoError('Invalid keypair version', 'INVALID_VERSION');
    }

    // Check if encrypted
    const isEncrypted = typeof data.privateKey_ed25519 === 'object';
    
    if (isEncrypted && !password) {
      throw new QuantumCryptoError('Password required for encrypted keypair', 'PASSWORD_REQUIRED');
    }
    
    if (isEncrypted && password) {
      // Decrypt private keys
      const privData1 = data.privateKey_ed25519 as { encrypted: string; salt: string; iv: string };
      const privData2 = data.privateKey_dilithium3 as { encrypted: string; salt: string; iv: string };
      
      const salt = Buffer.from(privData1.salt, 'base64');
      const key = scrypt(new TextEncoder().encode(password), salt, { N: 2 ** 16, r: 8, p: 1, dkLen: 32 });
      
      try {
        // Decrypt Ed25519 private key
        const iv1 = Buffer.from(privData1.iv, 'base64');
        const encryptedWithTag1 = Buffer.from(privData1.encrypted, 'base64');
        const encrypted1 = encryptedWithTag1.slice(0, -16);
        const authTag1 = encryptedWithTag1.slice(-16);
        const decipher1 = createDecipheriv('aes-256-gcm', key, iv1);
        decipher1.setAuthTag(authTag1);
        const privateKey_ed25519 = Buffer.concat([decipher1.update(encrypted1), decipher1.final()]);
        
        // Decrypt Dilithium3 private key
        const iv2 = Buffer.from(privData2.iv, 'base64');
        const encryptedWithTag2 = Buffer.from(privData2.encrypted, 'base64');
        const encrypted2 = encryptedWithTag2.slice(0, -16);
        const authTag2 = encryptedWithTag2.slice(-16);
        const decipher2 = createDecipheriv('aes-256-gcm', key, iv2);
        decipher2.setAuthTag(authTag2);
        const privateKey_dilithium3 = Buffer.concat([decipher2.update(encrypted2), decipher2.final()]);
        
        return {
          did: data.did,
          publicKey_ed25519: new Uint8Array(bs58.decode(data.publicKey_ed25519)),
          privateKey_ed25519: new Uint8Array(privateKey_ed25519),
          publicKey_dilithium3: new Uint8Array(Buffer.from(data.publicKey_dilithium3, 'base64')),
          privateKey_dilithium3: new Uint8Array(privateKey_dilithium3)
        };
      } catch (error) {
        throw new QuantumCryptoError('Failed to decrypt keypair - invalid password', 'DECRYPTION_FAILED');
      }
    }

    // Unencrypted import
    return {
      did: data.did,
      publicKey_ed25519: new Uint8Array(bs58.decode(data.publicKey_ed25519)),
      privateKey_ed25519: new Uint8Array(Buffer.from(data.privateKey_ed25519 as string, 'base64')),
      publicKey_dilithium3: new Uint8Array(Buffer.from(data.publicKey_dilithium3, 'base64')),
      privateKey_dilithium3: new Uint8Array(Buffer.from(data.privateKey_dilithium3 as string, 'base64'))
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
      keyPair.privateKey_dilithium3.length === 4032 && // Actual ML-DSA-65 size
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
