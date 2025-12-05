// Post-Quantum Hash Functions
// Hybrid SHA-256 + SHA3-256 hashing
import { sha256 } from '@noble/hashes/sha256';
import { sha3_256 } from '@noble/hashes/sha3';
import { blake3 } from '@noble/hashes/blake3';
import { DEFAULT_CONFIG_V2 } from './types.js';
import { QuantumCryptoError } from './types.js';
export class HashManagerV2 {
    constructor(config = DEFAULT_CONFIG_V2) {
        this.config = config;
    }
    /**
     * Compute hybrid hash
     * Returns both SHA-256 and SHA3-256 hashes
     */
    hash(data) {
        try {
            // Legacy hash (SHA-256)
            const hash_sha256 = this.config.mode === 'hybrid'
                ? sha256(data)
                : new Uint8Array(32);
            // Post-quantum hash (SHA3-256)
            const hash_sha3_256 = sha3_256(data);
            return {
                version: 2,
                hash_sha256,
                hash_sha3_256,
                algorithm: this.config.mode === 'hybrid' ? 'hybrid-v2' : 'pq-only'
            };
        }
        catch (error) {
            throw new QuantumCryptoError('Hash computation failed', 'HASH_ERROR');
        }
    }
    /**
     * Hash string content
     */
    hashString(content) {
        const data = new TextEncoder().encode(content);
        return this.hash(data);
    }
    /**
     * Verify hybrid hash (check collision resistance)
     */
    verify(data, expectedHash) {
        const computedHash = this.hash(data);
        if (expectedHash.algorithm === 'hybrid-v2') {
            // Both hashes must match in hybrid mode
            return (this.compareBytes(computedHash.hash_sha256, expectedHash.hash_sha256) &&
                this.compareBytes(computedHash.hash_sha3_256, expectedHash.hash_sha3_256));
        }
        else {
            // Only SHA3 hash must match in PQ-only mode
            return this.compareBytes(computedHash.hash_sha3_256, expectedHash.hash_sha3_256);
        }
    }
    /**
     * Get primary quantum-resistant hash (SHA3-256)
     */
    hashPQ(data) {
        return sha3_256(data);
    }
    /**
     * Get high-performance hash (BLAKE3)
     */
    hashFast(data) {
        return blake3(data);
    }
    /**
     * Constant-time byte comparison
     */
    compareBytes(a, b) {
        if (a.length !== b.length)
            return false;
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result === 0;
    }
    /**
     * Convert hash to hex string
     */
    toHex(hash) {
        return Array.from(hash)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    /**
     * Convert hex string to hash
     */
    fromHex(hex) {
        if (hex.length % 2 !== 0) {
            throw new QuantumCryptoError('Invalid hex string', 'INVALID_HEX');
        }
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return bytes;
    }
}
/**
 * Convenience functions
 */
export function hashV2(data) {
    const manager = new HashManagerV2();
    return manager.hash(data);
}
export function hashStringV2(content) {
    const manager = new HashManagerV2();
    return manager.hashString(content);
}
export function verifyHashV2(data, expectedHash) {
    const manager = new HashManagerV2();
    return manager.verify(data, expectedHash);
}
export function hashPQ(data) {
    return sha3_256(data);
}
export function hashFast(data) {
    return blake3(data);
}
