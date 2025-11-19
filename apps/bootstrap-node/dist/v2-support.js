// V2 Support Module for Bootstrap Node
// Adds quantum-resistant V2 record support while maintaining V1 compatibility
import { RecordVerifierV2, serializeFull, deserializeFull, toJSON } from '@frw/protocol-v2';
export class V2RecordManager {
    v2Index;
    verifier;
    PUBSUB_TOPIC_V2 = 'frw/names/updates/v2';
    constructor() {
        this.v2Index = new Map();
        this.verifier = new RecordVerifierV2();
    }
    /**
     * Add V2 record to index after verification
     */
    async addRecord(record) {
        try {
            // Verify record
            const verification = await this.verifier.verify(record);
            if (!verification.valid) {
                console.error('[V2] ✗ Record validation failed for:', record.name);
                console.error('[V2] Errors:', JSON.stringify(verification.errors, null, 2));
                console.error('[V2] Checks:', JSON.stringify(verification.checks, null, 2));
                return false;
            }
            // Create index entry
            const entry = {
                name: record.name,
                version: 2,
                publicKey_dilithium3: Buffer.from(record.publicKey_dilithium3).toString('base64'),
                did: record.did,
                contentCID: record.contentCID,
                ipnsKey: record.ipnsKey,
                timestamp: record.registered,
                pqSecure: verification.pqSecure,
                recordData: Buffer.from(serializeFull(record)).toString('base64')
            };
            this.v2Index.set(record.name.toLowerCase(), entry);
            console.log(`[V2] ✓ Added record: ${record.name} (PQ: ${verification.pqSecure})`);
            return true;
        }
        catch (error) {
            console.error('[V2] Error adding record:', error);
            return false;
        }
    }
    /**
     * Get V2 record by name
     */
    getRecord(name) {
        return this.v2Index.get(name.toLowerCase());
    }
    /**
     * Get full V2 record (deserialized)
     */
    getFullRecord(name) {
        const entry = this.v2Index.get(name.toLowerCase());
        if (!entry)
            return null;
        try {
            const recordData = Buffer.from(entry.recordData, 'base64');
            return deserializeFull(new Uint8Array(recordData));
        }
        catch (error) {
            console.error('[V2] Error deserializing record:', error);
            return null;
        }
    }
    /**
     * Get all V2 records
     */
    getAllRecords() {
        return Array.from(this.v2Index.values());
    }
    /**
     * Get index size
     */
    size() {
        return this.v2Index.size;
    }
    /**
     * Handle pubsub message
     */
    async handlePubsubMessage(data) {
        try {
            const record = deserializeFull(data);
            await this.addRecord(record);
        }
        catch (error) {
            console.error('[V2] Error handling pubsub message:', error);
        }
    }
    /**
     * Export record as JSON (for HTTP API)
     */
    exportRecordJSON(name) {
        const record = this.getFullRecord(name);
        if (!record)
            return null;
        try {
            return toJSON(record);
        }
        catch (error) {
            console.error('[V2] Error exporting JSON:', error);
            return null;
        }
    }
    /**
     * Get pubsub topic
     */
    getPubsubTopic() {
        return this.PUBSUB_TOPIC_V2;
    }
    /**
     * Get statistics
     */
    getStats() {
        const records = this.getAllRecords();
        const pqSecureCount = records.filter(r => r.pqSecure).length;
        return {
            totalV2Records: this.v2Index.size,
            pqSecureRecords: pqSecureCount,
            oldestRecord: records.length > 0 ? Math.min(...records.map(r => r.timestamp)) : null,
            newestRecord: records.length > 0 ? Math.max(...records.map(r => r.timestamp)) : null
        };
    }
}
/**
 * Create unified response from V1 or V2 entry
 */
export function createUnifiedResponse(entry, version, nodeId) {
    if (version === 1) {
        return {
            version: 1,
            name: entry.name,
            publicKey: entry.publicKey,
            contentCID: entry.contentCID,
            ipnsKey: entry.ipnsKey,
            timestamp: entry.timestamp,
            signature: entry.signature,
            resolvedBy: nodeId
        };
    }
    else {
        return {
            version: 2,
            name: entry.name,
            publicKey_dilithium3: entry.publicKey_dilithium3,
            did: entry.did,
            contentCID: entry.contentCID,
            ipnsKey: entry.ipnsKey,
            timestamp: entry.timestamp,
            pqSecure: entry.pqSecure,
            recordData: entry.recordData,
            resolvedBy: nodeId
        };
    }
}
//# sourceMappingURL=v2-support.js.map