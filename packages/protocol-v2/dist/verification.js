// Record Verification (Zero Trust)
import { SignatureManagerV2, hashPQ } from '@frw/crypto-pq';
import { verifyPOWV2 } from '@frw/pow-v2';
import { serializeCanonical } from './serialization.js';
export class RecordVerifierV2 {
    constructor() {
        this.signatureManager = new SignatureManagerV2();
    }
    /**
     * Verify record completely (zero trust)
     * MUST be called for ALL records from untrusted sources
     */
    async verify(record, previousRecord) {
        const result = {
            valid: false,
            pqSecure: false,
            errors: [],
            checks: {
                pow: false,
                signature_ed25519: false,
                signature_dilithium3: false,
                hash_chain: false,
                expiration: false,
                name_format: false
            }
        };
        // 1. Check protocol version
        if (record.version !== 2) {
            result.errors.push('Invalid protocol version');
            return result;
        }
        // 2. Validate name format
        result.checks.name_format = this.validateNameFormat(record.name);
        if (!result.checks.name_format) {
            result.errors.push('Invalid name format');
        }
        // 3. Check expiration
        result.checks.expiration = record.expires > Date.now();
        if (!result.checks.expiration) {
            result.errors.push('Record expired');
        }
        // 4. Verify PoW
        try {
            result.checks.pow = await verifyPOWV2(record.name, record.publicKey_dilithium3, record.proof_v2);
            if (!result.checks.pow) {
                result.errors.push('Invalid proof of work');
            }
        }
        catch (error) {
            result.errors.push('PoW verification failed');
        }
        // 5. Verify signatures
        const canonical = serializeCanonical(record);
        // Create temporary keypair for verification
        const tempKeyPair = {
            publicKey_ed25519: record.publicKey_ed25519,
            privateKey_ed25519: new Uint8Array(64), // Not needed for verify
            publicKey_dilithium3: record.publicKey_dilithium3,
            privateKey_dilithium3: new Uint8Array(4000), // Not needed
            did: record.did
        };
        // Verify Dilithium3 (primary PQ signature)
        try {
            const hybridSig = {
                version: 2,
                signature_ed25519: record.signature_ed25519,
                signature_dilithium3: record.signature_dilithium3,
                timestamp: record.registered,
                algorithm: 'hybrid-v2'
            };
            // In verification, we check both signatures
            result.checks.signature_dilithium3 = this.signatureManager.verify(canonical, hybridSig, tempKeyPair);
            if (!result.checks.signature_dilithium3) {
                result.errors.push('Invalid Dilithium3 signature');
            }
            else {
                result.pqSecure = true;
            }
        }
        catch (error) {
            result.errors.push('Signature verification failed');
        }
        // 6. Verify hash chain (if update)
        if (previousRecord) {
            result.checks.hash_chain = this.verifyHashChain(record, previousRecord);
            if (!result.checks.hash_chain) {
                result.errors.push('Invalid hash chain');
            }
        }
        else {
            result.checks.hash_chain = true; // Genesis record
        }
        // 7. Verify hash integrity
        const computedHash = hashPQ(canonical);
        const hashValid = this.compareHashes(computedHash, record.hash_sha3);
        if (!hashValid) {
            result.errors.push('Hash mismatch');
        }
        // Overall validity
        result.valid = (result.checks.name_format &&
            result.checks.expiration &&
            result.checks.pow &&
            result.checks.signature_dilithium3 &&
            result.checks.hash_chain &&
            hashValid);
        return result;
    }
    /**
     * Validate name format
     */
    validateNameFormat(name) {
        if (!/^[a-z0-9-]+$/.test(name))
            return false;
        if (name.length < 1 || name.length > 63)
            return false;
        if (name.startsWith('-') || name.endsWith('-'))
            return false;
        return true;
    }
    /**
     * Verify hash chain
     */
    verifyHashChain(current, previous) {
        if (!current.previousHash_sha3)
            return false;
        const previousCanonical = serializeCanonical(previous);
        const previousHash = hashPQ(previousCanonical);
        return this.compareHashes(previousHash, current.previousHash_sha3);
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
/**
 * Convenience function
 */
export async function verifyRecordV2(record, previousRecord) {
    const verifier = new RecordVerifierV2();
    return verifier.verify(record, previousRecord);
}
