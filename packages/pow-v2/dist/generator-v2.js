"use strict";
// Quantum-Resistant PoW Generator
// Argon2id-based memory-hard proof of work
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofOfWorkGeneratorV2 = void 0;
exports.generatePOWV2 = generatePOWV2;
const argon2_1 = __importDefault(require("argon2"));
const sha3_1 = require("@noble/hashes/sha3");
const types_1 = require("./types");
const difficulty_v2_1 = require("./difficulty-v2");
class ProofOfWorkGeneratorV2 {
    /**
     * Generate quantum-resistant proof of work
     * Uses Argon2id for memory-hardness + SHA3-256 for hashing
     */
    async generate(name, publicKey_pq, onProgress) {
        const params = (0, difficulty_v2_1.getRequiredDifficulty)(name);
        const startTime = Date.now();
        const timestamp = startTime;
        let nonce = 0n;
        let attempts = 0n;
        // Difficulty 0 = no PoW needed (long names)
        if (params.leading_zeros === 0) {
            const hash = await this.computeHash(name, publicKey_pq, nonce, timestamp, params);
            return {
                version: 2,
                nonce,
                timestamp,
                hash,
                difficulty: 0,
                memory_cost_mib: params.memory_mib,
                time_cost: params.iterations,
                parallelism: 4
            };
        }
        // Target: N leading zero bytes
        const target_zeros = Math.ceil(params.leading_zeros / 2);
        // Main PoW loop
        while (true) {
            // Compute Argon2id-SHA3 hash
            const hash = await this.computeHash(name, publicKey_pq, nonce, timestamp, params);
            // Check if hash meets difficulty requirement
            if (this.hasLeadingZeros(hash, params.leading_zeros)) {
                const elapsed = Date.now() - startTime;
                return {
                    version: 2,
                    nonce,
                    timestamp,
                    hash,
                    difficulty: params.leading_zeros,
                    memory_cost_mib: params.memory_mib,
                    time_cost: params.iterations,
                    parallelism: 4
                };
            }
            nonce++;
            attempts++;
            // Progress callback every 100 attempts
            if (onProgress && attempts % 100n === 0n) {
                const elapsed = Date.now() - startTime;
                const hps = Number(attempts) / (elapsed / 1000);
                onProgress({
                    attempts,
                    elapsed_ms: elapsed,
                    hashes_per_sec: hps
                });
            }
            // Safety: prevent infinite loop
            if (nonce > 2n ** 64n - 1n) {
                throw new types_1.POWError('PoW generation overflow', 'OVERFLOW');
            }
        }
    }
    /**
     * Compute Argon2id-SHA3 hash
     */
    async computeHash(name, publicKey_pq, nonce, timestamp, params) {
        try {
            // Salt: SHA3-256(name || publicKey)
            const saltInput = new Uint8Array(name.length + publicKey_pq.length);
            const nameBytes = new TextEncoder().encode(name);
            saltInput.set(nameBytes, 0);
            saltInput.set(publicKey_pq, nameBytes.length);
            const salt = (0, sha3_1.sha3_256)(saltInput);
            // Password: nonce || timestamp
            const password = new Uint8Array(16);
            const view = new DataView(password.buffer);
            view.setBigUint64(0, nonce, false); // big-endian
            view.setBigUint64(8, BigInt(timestamp), false);
            // Compute Argon2id
            const argonHash = await argon2_1.default.hash(Buffer.from(password), {
                salt: Buffer.from(salt),
                hashLength: 32,
                memoryCost: params.memory_mib * 1024, // Convert MiB to KiB
                timeCost: params.iterations,
                parallelism: 4,
                type: argon2_1.default.argon2id,
                raw: true
            });
            // Final hash: SHA3-256(argon_output)
            const finalHash = (0, sha3_1.sha3_256)(Uint8Array.from(argonHash));
            return finalHash;
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new types_1.POWError(`Hash computation failed: ${errorMsg}`, 'HASH_ERROR');
        }
    }
    /**
     * Check if hash has required leading zeros
     * For hex representation: 2 hex digits = 1 byte
     */
    hasLeadingZeros(hash, required) {
        const hexRequired = Math.ceil(required / 2);
        for (let i = 0; i < hexRequired && i < hash.length; i++) {
            if (i === hexRequired - 1 && required % 2 === 1) {
                // Odd number of zeros: check only high nibble
                if ((hash[i] & 0xf0) !== 0)
                    return false;
            }
            else {
                // Full byte must be zero
                if (hash[i] !== 0)
                    return false;
            }
        }
        return true;
    }
    /**
     * Convert hash to hex string for debugging
     */
    hashToHex(hash) {
        return Array.from(hash)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}
exports.ProofOfWorkGeneratorV2 = ProofOfWorkGeneratorV2;
/**
 * Convenience function
 */
async function generatePOWV2(name, publicKey_pq, onProgress) {
    const generator = new ProofOfWorkGeneratorV2();
    return generator.generate(name, publicKey_pq, onProgress);
}
