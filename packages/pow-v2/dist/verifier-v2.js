"use strict";
// Quantum-Resistant PoW Verifier
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofOfWorkVerifierV2 = void 0;
exports.verifyPOWV2 = verifyPOWV2;
const argon2_1 = __importDefault(require("argon2"));
const sha3_1 = require("@noble/hashes/sha3");
const difficulty_v2_1 = require("./difficulty-v2");
class ProofOfWorkVerifierV2 {
    /**
     * Verify a proof of work
     */
    async verify(name, publicKey_dilithium3, proof) {
        try {
            // 1. Validate version
            if (proof.version !== 2) {
                return false;
            }
            // 2. Get required difficulty
            const required = (0, difficulty_v2_1.getRequiredDifficulty)(name);
            // 3. Verify proof meets minimum requirements
            if (proof.difficulty < required.leading_zeros ||
                proof.memory_cost_mib < required.memory_mib ||
                proof.time_cost < required.iterations) {
                return false;
            }
            // 4. Check timestamp (prevent pre-computation)
            const MIN_TIMESTAMP = new Date('2025-01-01').getTime();
            if (proof.timestamp < MIN_TIMESTAMP) {
                return false;
            }
            // 5. Check proof age (must be < 1 hour old)
            const age = Date.now() - proof.timestamp;
            if (age > 3600000 || age < 0) {
                return false;
            }
            // 6. Recompute hash
            const computedHash = await this.computeHash(name, publicKey_dilithium3, proof.nonce, proof.timestamp, {
                leading_zeros: proof.difficulty,
                memory_mib: proof.memory_cost_mib,
                iterations: proof.time_cost
            });
            // 7. Verify hash matches
            if (!this.compareHashes(computedHash, proof.hash)) {
                return false;
            }
            // 8. Verify leading zeros
            if (!this.hasLeadingZeros(proof.hash, proof.difficulty)) {
                return false;
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Compute hash (same as generator)
     */
    async computeHash(name, publicKey_pq, nonce, timestamp, params) {
        // Salt: SHA3-256(name || publicKey)
        const saltInput = new Uint8Array(name.length + publicKey_pq.length);
        const nameBytes = new TextEncoder().encode(name);
        saltInput.set(nameBytes, 0);
        saltInput.set(publicKey_pq, nameBytes.length);
        const salt = (0, sha3_1.sha3_256)(saltInput);
        // Password: nonce || timestamp
        const password = new Uint8Array(16);
        const view = new DataView(password.buffer);
        view.setBigUint64(0, nonce, false);
        view.setBigUint64(8, BigInt(timestamp), false);
        // Compute Argon2id
        const argonHash = await argon2_1.default.hash(Buffer.from(password), {
            salt: Buffer.from(salt),
            hashLength: 32,
            memoryCost: params.memory_mib * 1024,
            timeCost: params.iterations,
            parallelism: 4,
            type: argon2_1.default.argon2id,
            raw: true
        });
        // Final hash: SHA3-256(argon_output)
        return (0, sha3_1.sha3_256)(Uint8Array.from(argonHash));
    }
    /**
     * Check leading zeros
     */
    hasLeadingZeros(hash, required) {
        const hexRequired = Math.ceil(required / 2);
        for (let i = 0; i < hexRequired && i < hash.length; i++) {
            if (i === hexRequired - 1 && required % 2 === 1) {
                if ((hash[i] & 0xf0) !== 0)
                    return false;
            }
            else {
                if (hash[i] !== 0)
                    return false;
            }
        }
        return true;
    }
    /**
     * Constant-time hash comparison
     */
    compareHashes(a, b) {
        if (a.length !== b.length)
            return false;
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result === 0;
    }
}
exports.ProofOfWorkVerifierV2 = ProofOfWorkVerifierV2;
/**
 * Convenience function
 */
async function verifyPOWV2(name, publicKey_pq, proof) {
    const verifier = new ProofOfWorkVerifierV2();
    return verifier.verify(name, publicKey_pq, proof);
}
