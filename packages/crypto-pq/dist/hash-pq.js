"use strict";
// Post-Quantum Hash Functions
// Hybrid SHA-256 + SHA3-256 hashing
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashManagerV2 = void 0;
exports.hashV2 = hashV2;
exports.hashStringV2 = hashStringV2;
exports.verifyHashV2 = verifyHashV2;
exports.hashPQ = hashPQ;
exports.hashFast = hashFast;
const sha256_1 = require("@noble/hashes/sha256");
const sha3_1 = require("@noble/hashes/sha3");
const blake3_1 = require("@noble/hashes/blake3");
const types_1 = require("./types");
const types_2 = require("./types");
class HashManagerV2 {
    constructor(config = types_1.DEFAULT_CONFIG_V2) {
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
                ? (0, sha256_1.sha256)(data)
                : new Uint8Array(32);
            // Post-quantum hash (SHA3-256)
            const hash_sha3_256 = (0, sha3_1.sha3_256)(data);
            return {
                version: 2,
                hash_sha256,
                hash_sha3_256,
                algorithm: this.config.mode === 'hybrid' ? 'hybrid-v2' : 'pq-only'
            };
        }
        catch (error) {
            throw new types_2.QuantumCryptoError('Hash computation failed', 'HASH_ERROR');
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
        return (0, sha3_1.sha3_256)(data);
    }
    /**
     * Get high-performance hash (BLAKE3)
     */
    hashFast(data) {
        return (0, blake3_1.blake3)(data);
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
            throw new types_2.QuantumCryptoError('Invalid hex string', 'INVALID_HEX');
        }
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return bytes;
    }
}
exports.HashManagerV2 = HashManagerV2;
/**
 * Convenience functions
 */
function hashV2(data) {
    const manager = new HashManagerV2();
    return manager.hash(data);
}
function hashStringV2(content) {
    const manager = new HashManagerV2();
    return manager.hashString(content);
}
function verifyHashV2(data, expectedHash) {
    const manager = new HashManagerV2();
    return manager.verify(data, expectedHash);
}
function hashPQ(data) {
    return (0, sha3_1.sha3_256)(data);
}
function hashFast(data) {
    return (0, blake3_1.blake3)(data);
}
