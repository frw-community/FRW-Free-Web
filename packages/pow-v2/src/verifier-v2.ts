// Quantum-Resistant PoW Verifier

import argon2 from 'argon2';
import { sha3_256 } from '@noble/hashes/sha3';
import type { ProofOfWorkV2, DifficultyParams } from './types.js';
import { POWError } from './types.js';
import { getRequiredDifficulty } from './difficulty-v2.js';

export class ProofOfWorkVerifierV2 {
  /**
   * Verify a proof of work
   */
  async verify(
    name: string,
    publicKey_dilithium3: Uint8Array,
    proof: ProofOfWorkV2
  ): Promise<boolean> {
    try {
      // 1. Validate version
      if (proof.version !== 2) {
        console.log('[PoW] Version check failed:', proof.version);
        return false;
      }

      // 2. Get required difficulty
      const required = getRequiredDifficulty(name);

      // 3. Verify proof meets minimum requirements
      if (
        proof.difficulty < required.leading_zeros ||
        proof.memory_cost_mib < required.memory_mib ||
        proof.time_cost < required.iterations
      ) {
        console.log('[PoW] Difficulty check failed:', {
          proof: { diff: proof.difficulty, mem: proof.memory_cost_mib, time: proof.time_cost },
          required: { diff: required.leading_zeros, mem: required.memory_mib, time: required.iterations }
        });
        return false;
      }

      // 4. Check timestamp (prevent pre-computation)
      const MIN_TIMESTAMP = new Date('2025-01-01').getTime();
      if (proof.timestamp < MIN_TIMESTAMP) {
        console.log('[PoW] Timestamp too old:', proof.timestamp);
        return false;
      }

      // 5. Check proof age (must be < 30 days to prevent ancient pre-computed attacks)
      // Extended from 1 hour to 30 days for better usability
      const age = Date.now() - proof.timestamp;
      const MAX_AGE = 30 * 24 * 3600000; // 30 days in ms
      if (age > MAX_AGE || age < 0) {
        console.log('[PoW] Age check failed:', { age, max: MAX_AGE });
        return false;
      }

      // 6. Recompute hash
      const computedHash = await this.computeHash(
        name,
        publicKey_dilithium3,
        proof.nonce,
        proof.timestamp,
        {
          leading_zeros: proof.difficulty,
          memory_mib: proof.memory_cost_mib,
          iterations: proof.time_cost
        }
      );

      // 7. Verify hash matches
      if (!this.compareHashes(computedHash, proof.hash)) {
        console.log('[PoW] Hash mismatch!');
        console.log('  Computed:', Buffer.from(computedHash).toString('hex'));
        console.log('  Provided:', Buffer.from(proof.hash).toString('hex'));
        return false;
      }

      // 8. Verify leading zeros
      if (!this.hasLeadingZeros(proof.hash, proof.difficulty)) {
        console.log('[PoW] Leading zeros check failed');
        return false;
      }

      console.log('[PoW] Verification passed!');
      return true;
    } catch (error) {
      console.log('[PoW] Exception during verification:', error);
      return false;
    }
  }

  /**
   * Compute hash (same as generator)
   */
  private async computeHash(
    name: string,
    publicKey_pq: Uint8Array,
    nonce: bigint,
    timestamp: number,
    params: DifficultyParams
  ): Promise<Uint8Array> {
    // Salt: SHA3-256(name || publicKey)
    const saltInput = new Uint8Array(
      name.length + publicKey_pq.length
    );
    const nameBytes = new TextEncoder().encode(name);
    saltInput.set(nameBytes, 0);
    saltInput.set(publicKey_pq, nameBytes.length);
    const salt = sha3_256(saltInput);

    // Password: nonce || timestamp
    const password = new Uint8Array(16);
    const view = new DataView(password.buffer);
    view.setBigUint64(0, nonce, false);
    view.setBigUint64(8, BigInt(timestamp), false);

    // Compute Argon2id
    const argonHash = await argon2.hash(Buffer.from(password), {
      salt: Buffer.from(salt),
      hashLength: 32,
      memoryCost: params.memory_mib * 1024,
      timeCost: params.iterations,
      parallelism: 4,
      type: argon2.argon2id,
      raw: true
    }) as Buffer;

    // Final hash: SHA3-256(argon_output)
    return sha3_256(Uint8Array.from(argonHash));
  }

  /**
   * Check leading zeros
   */
  private hasLeadingZeros(hash: Uint8Array, required: number): boolean {
    const hexRequired = Math.ceil(required / 2);
    
    for (let i = 0; i < hexRequired && i < hash.length; i++) {
      if (i === hexRequired - 1 && required % 2 === 1) {
        if ((hash[i] & 0xf0) !== 0) return false;
      } else {
        if (hash[i] !== 0) return false;
      }
    }
    
    return true;
  }

  /**
   * Constant-time hash comparison
   */
  private compareHashes(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    
    return result === 0;
  }
}

/**
 * Convenience function
 */
export async function verifyPOWV2(
  name: string,
  publicKey_pq: Uint8Array,
  proof: ProofOfWorkV2
): Promise<boolean> {
  const verifier = new ProofOfWorkVerifierV2();
  return verifier.verify(name, publicKey_pq, proof);
}
