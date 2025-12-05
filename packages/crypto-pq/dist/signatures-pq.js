// Post-Quantum Signature Management
// Hybrid Ed25519 + Dilithium3 signatures
import nacl from 'tweetnacl';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { sha256 } from '@noble/hashes/sha256';
import { sha3_256 } from '@noble/hashes/sha3';
import { DEFAULT_CONFIG_V2 } from './types.js';
import { QuantumCryptoError } from './types.js';
export class SignatureManagerV2 {
    constructor(config = DEFAULT_CONFIG_V2) {
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
            const hash_sha256 = sha256(messageWithTimestamp);
            const hash_sha3 = sha3_256(messageWithTimestamp);
            // Sign with Ed25519 (legacy)
            const signature_ed25519 = this.config.mode === 'hybrid'
                ? nacl.sign.detached(hash_sha256, keyPair.privateKey_ed25519)
                : new Uint8Array(64); // Empty if PQ-only
            // Sign with Dilithium3 (primary)
            const signature_dilithium3 = ml_dsa65.sign(keyPair.privateKey_dilithium3, hash_sha3);
            return {
                version: 2,
                signature_ed25519,
                signature_dilithium3,
                timestamp: ts,
                algorithm: this.config.mode === 'hybrid' ? 'hybrid-v2' : 'pq-only'
            };
        }
        catch (error) {
            throw new QuantumCryptoError('Signature generation failed', 'SIGN_ERROR');
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
            const hash_sha256 = sha256(messageWithTimestamp);
            const hash_sha3 = sha3_256(messageWithTimestamp);
            // Verify Ed25519 (if hybrid mode and before cutoff)
            let ed25519_valid = true;
            if (signature.algorithm === 'hybrid-v2') {
                if (Date.now() < this.config.legacyCutoff.getTime()) {
                    ed25519_valid = nacl.sign.detached.verify(hash_sha256, signature.signature_ed25519, keyPair.publicKey_ed25519);
                }
            }
            // Verify Dilithium3 (always required)
            const dilithium_valid = ml_dsa65.verify(keyPair.publicKey_dilithium3, hash_sha3, signature.signature_dilithium3);
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
            throw new QuantumCryptoError('Invalid signature version', 'INVALID_VERSION');
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
/**
 * Convenience functions
 */
export function signV2(message, keyPair) {
    const manager = new SignatureManagerV2();
    return manager.sign(message, keyPair);
}
export function verifyV2(message, signature, keyPair) {
    const manager = new SignatureManagerV2();
    return manager.verify(message, signature, keyPair);
}
export function signStringV2(content, keyPair) {
    const manager = new SignatureManagerV2();
    return manager.signString(content, keyPair);
}
export function verifyStringV2(content, signature, keyPair) {
    const manager = new SignatureManagerV2();
    return manager.verifyString(content, signature, keyPair);
}
