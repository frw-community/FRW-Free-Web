"use strict";
// Record Creation and Management
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordManagerV2 = void 0;
exports.createRecordV2 = createRecordV2;
const crypto_pq_1 = require("@frw/crypto-pq");
const crypto_pq_2 = require("@frw/crypto-pq");
const types_1 = require("./types");
const serialization_1 = require("./serialization");
class RecordManagerV2 {
    constructor() {
        this.signatureManager = new crypto_pq_1.SignatureManagerV2();
        this.keyManager = new crypto_pq_1.KeyManagerV2();
    }
    /**
     * Create a new V2 record
     */
    createRecord(name, contentCID, ipnsKey, keyPair, proof, previousRecord) {
        // Validate name format
        if (!this.validateNameFormat(name)) {
            throw new types_1.ProtocolV2Error('Invalid name format', 'INVALID_NAME');
        }
        const now = Date.now();
        const expires = now + (365 * 24 * 60 * 60 * 1000); // 1 year
        const recordVersion = previousRecord ? previousRecord.recordVersion + 1 : 1;
        // Create unsigned record
        const record = {
            version: 2,
            name,
            publicKey_ed25519: keyPair.publicKey_ed25519,
            publicKey_dilithium3: keyPair.publicKey_dilithium3,
            did: keyPair.did,
            contentCID,
            ipnsKey,
            recordVersion,
            registered: now,
            expires,
            signature_ed25519: new Uint8Array(64),
            signature_dilithium3: new Uint8Array(3309), // Actual ML-DSA-65 size
            hash_sha256: new Uint8Array(32),
            hash_sha3: new Uint8Array(32),
            proof_v2: proof,
            previousHash_sha3: previousRecord
                ? this.computeRecordHash(previousRecord)
                : null,
            providers: [],
            dnslink: undefined
        };
        // Sign record
        this.signRecord(record, keyPair);
        return record;
    }
    /**
     * Sign a record with hybrid signatures
     */
    signRecord(record, keyPair) {
        // Serialize canonical form
        const canonical = (0, serialization_1.serializeCanonical)(record);
        // Sign with hybrid manager (use record.registered as timestamp)
        const signature = this.signatureManager.sign(canonical, keyPair, record.registered);
        // Update record
        record.signature_ed25519 = signature.signature_ed25519;
        record.signature_dilithium3 = signature.signature_dilithium3;
        // Compute hashes
        const hash_sha3 = (0, crypto_pq_2.hashPQ)(canonical);
        record.hash_sha3 = hash_sha3;
        // Legacy hash (SHA-256) - computed by hybrid hash if in hybrid mode
        // For now, just use SHA3 for both
        record.hash_sha256 = hash_sha3;
    }
    /**
     * Compute record hash for chain linking
     */
    computeRecordHash(record) {
        const canonical = (0, serialization_1.serializeCanonical)(record);
        return (0, crypto_pq_2.hashPQ)(canonical);
    }
    /**
     * Validate name format
     */
    validateNameFormat(name) {
        // Must be lowercase alphanumeric with hyphens
        if (!/^[a-z0-9-]+$/.test(name)) {
            return false;
        }
        // Length constraints
        if (name.length < 1 || name.length > 63) {
            return false;
        }
        // Cannot start or end with hyphen
        if (name.startsWith('-') || name.endsWith('-')) {
            return false;
        }
        return true;
    }
    /**
     * Update record content
     */
    updateRecord(existingRecord, newContentCID, keyPair, proof) {
        // Verify ownership
        if (keyPair.did !== existingRecord.did) {
            throw new types_1.ProtocolV2Error('Not authorized', 'UNAUTHORIZED');
        }
        return this.createRecord(existingRecord.name, newContentCID, existingRecord.ipnsKey, keyPair, proof, existingRecord);
    }
}
exports.RecordManagerV2 = RecordManagerV2;
/**
 * Convenience functions
 */
function createRecordV2(name, contentCID, ipnsKey, keyPair, proof) {
    const manager = new RecordManagerV2();
    return manager.createRecord(name, contentCID, ipnsKey, keyPair, proof);
}
