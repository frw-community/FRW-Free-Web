"use strict";
// Post-Quantum Signature Management
// Hybrid Ed25519 + Dilithium3 signatures
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureManagerV2 = void 0;
exports.signV2 = signV2;
exports.verifyV2 = verifyV2;
exports.signStringV2 = signStringV2;
exports.verifyStringV2 = verifyStringV2;
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const ml_dsa_1 = require("@noble/post-quantum/ml-dsa");
const sha256_1 = require("@noble/hashes/sha256");
const sha3_1 = require("@noble/hashes/sha3");
const types_1 = require("./types");
const types_2 = require("./types");
class SignatureManagerV2 {
    constructor(config = types_1.DEFAULT_CONFIG_V2) {
        this.config = config;
    }
    /**
     * Sign message with hybrid signatures
     * Returns both Ed25519 and Dilithium3 signatures
     */
    sign(message, keyPair, timestamp) {
        try {
            const ts = timestamp ?? Date.now();
            // Add timestamp to message for replay protection
            const messageWithTimestamp = new Uint8Array(message.length + 8);
            messageWithTimestamp.set(message);
            messageWithTimestamp.set(this.timestampToBytes(ts), message.length);
            // Hash message with both algorithms
            const hash_sha256 = (0, sha256_1.sha256)(messageWithTimestamp);
            const hash_sha3 = (0, sha3_1.sha3_256)(messageWithTimestamp);
            // Sign with Ed25519 (legacy)
            const signature_ed25519 = this.config.mode === 'hybrid'
                ? tweetnacl_1.default.sign.detached(hash_sha256, keyPair.privateKey_ed25519)
                : new Uint8Array(64); // Empty if PQ-only
            // Sign with Dilithium3 (primary)
            const signature_dilithium3 = ml_dsa_1.ml_dsa65.sign(keyPair.privateKey_dilithium3, hash_sha3);
            return {
                version: 2,
                signature_ed25519,
                signature_dilithium3,
                timestamp: ts,
                algorithm: this.config.mode === 'hybrid' ? 'hybrid-v2' : 'pq-only'
            };
        }
        catch (error) {
            throw new types_2.QuantumCryptoError('Signature generation failed', 'SIGN_ERROR');
        }
    }
    /**
     * Verify hybrid signature
     * Both signatures must be valid (in hybrid mode)
     */
    verify(message, signature, keyPair) {
        try {
            // Check signature age (prevent replay attacks)
            const age = Date.now() - signature.timestamp;
            if (age > 3600000) { // 1 hour
                return false;
            }
            // Reconstruct message with timestamp
            const messageWithTimestamp = new Uint8Array(message.length + 8);
            messageWithTimestamp.set(message);
            messageWithTimestamp.set(this.timestampToBytes(signature.timestamp), message.length);
            // Hash with both algorithms
            const hash_sha256 = (0, sha256_1.sha256)(messageWithTimestamp);
            const hash_sha3 = (0, sha3_1.sha3_256)(messageWithTimestamp);
            // Verify Ed25519 (if hybrid mode and before cutoff)
            let ed25519_valid = true;
            if (signature.algorithm === 'hybrid-v2') {
                if (Date.now() < this.config.legacyCutoff.getTime()) {
                    ed25519_valid = tweetnacl_1.default.sign.detached.verify(hash_sha256, signature.signature_ed25519, keyPair.publicKey_ed25519);
                }
            }
            // Verify Dilithium3 (always required)
            const dilithium_valid = ml_dsa_1.ml_dsa65.verify(keyPair.publicKey_dilithium3, hash_sha3, signature.signature_dilithium3);
            // In hybrid mode: both must be valid
            // In PQ-only mode: only Dilithium3 must be valid
            if (signature.algorithm === 'hybrid-v2') {
                return ed25519_valid && dilithium_valid;
            }
            else {
                return dilithium_valid;
            }
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Sign string content (convenience wrapper)
     */
    signString(content, keyPair) {
        const message = new TextEncoder().encode(content);
        return this.sign(message, keyPair);
    }
    /**
     * Verify string content (convenience wrapper)
     */
    verifyString(content, signature, keyPair) {
        const message = new TextEncoder().encode(content);
        return this.verify(message, signature, keyPair);
    }
    /**
     * Serialize signature to portable format
     */
    serializeSignature(signature) {
        const data = {
            version: signature.version,
            sig_ed: Buffer.from(signature.signature_ed25519).toString('base64'),
            sig_pq: Buffer.from(signature.signature_dilithium3).toString('base64'),
            timestamp: signature.timestamp,
            algorithm: signature.algorithm
        };
        return JSON.stringify(data);
    }
    /**
     * Deserialize signature from portable format
     */
    deserializeSignature(serialized) {
        const data = JSON.parse(serialized);
        if (data.version !== 2) {
            throw new types_2.QuantumCryptoError('Invalid signature version', 'INVALID_VERSION');
        }
        return {
            version: 2,
            signature_ed25519: new Uint8Array(Buffer.from(data.sig_ed, 'base64')),
            signature_dilithium3: new Uint8Array(Buffer.from(data.sig_pq, 'base64')),
            timestamp: data.timestamp,
            algorithm: data.algorithm
        };
    }
    /**
     * Convert timestamp to bytes
     */
    timestampToBytes(timestamp) {
        const bytes = new Uint8Array(8);
        const view = new DataView(bytes.buffer);
        view.setBigUint64(0, BigInt(timestamp), false); // big-endian
        return bytes;
    }
}
exports.SignatureManagerV2 = SignatureManagerV2;
/**
 * Convenience functions
 */
function signV2(message, keyPair) {
    const manager = new SignatureManagerV2();
    return manager.sign(message, keyPair);
}
function verifyV2(message, signature, keyPair) {
    const manager = new SignatureManagerV2();
    return manager.verify(message, signature, keyPair);
}
function signStringV2(content, keyPair) {
    const manager = new SignatureManagerV2();
    return manager.signString(content, keyPair);
}
function verifyStringV2(content, signature, keyPair) {
    const manager = new SignatureManagerV2();
    return manager.verifyString(content, signature, keyPair);
}
