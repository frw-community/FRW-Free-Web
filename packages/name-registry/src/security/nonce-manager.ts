// Nonce Manager - Replay Attack Prevention
// Ensures each signature is only used once

import * as crypto from 'crypto';

export interface NonceRecord {
    publicKey: string;
    nonce: string;
    timestamp: number;
    used: boolean;
}

export class NonceManager {
    private usedNonces: Map<string, NonceRecord>;
    private readonly expirationTime = 3600000; // 1 hour
    
    constructor() {
        this.usedNonces = new Map();
        
        // Cleanup expired nonces every 10 minutes
        setInterval(() => this.cleanup(), 600000);
    }
    
    /**
     * Generate a new cryptographically secure nonce
     */
    generateNonce(publicKey: string): string {
        const nonce = crypto.randomBytes(32).toString('hex');
        const nonceId = this.getNonceId(publicKey, nonce);
        
        // Store nonce as available (not yet used)
        this.usedNonces.set(nonceId, {
            publicKey,
            nonce,
            timestamp: Date.now(),
            used: false
        });
        
        return nonce;
    }
    
    /**
     * Verify nonce is valid and mark as used
     * Returns true if nonce is valid and unused
     * Returns false if nonce is already used or expired
     */
    verifyAndMarkNonce(publicKey: string, nonce: string): boolean {
        const nonceId = this.getNonceId(publicKey, nonce);
        const record = this.usedNonces.get(nonceId);
        
        // Nonce doesn't exist - could be forged
        if (!record) {
            return false;
        }
        
        // Check if already used (replay attack)
        if (record.used) {
            console.warn('Replay attack detected:', {publicKey, nonce});
            return false;
        }
        
        // Check if expired
        const age = Date.now() - record.timestamp;
        if (age > this.expirationTime) {
            console.warn('Expired nonce:', {publicKey, nonce, age});
            this.usedNonces.delete(nonceId);
            return false;
        }
        
        // Mark as used
        record.used = true;
        this.usedNonces.set(nonceId, record);
        
        return true;
    }
    
    /**
     * Check if nonce is valid without marking as used
     */
    isValid(publicKey: string, nonce: string): boolean {
        const nonceId = this.getNonceId(publicKey, nonce);
        const record = this.usedNonces.get(nonceId);
        
        if (!record || record.used) {
            return false;
        }
        
        const age = Date.now() - record.timestamp;
        return age <= this.expirationTime;
    }
    
    /**
     * Verify nonce is valid (alias for isValid)
     */
    verifyNonce(publicKey: string, nonce: string): boolean {
        return this.isValid(publicKey, nonce);
    }
    
    /**
     * Get nonce statistics
     */
    getStats(): {
        total: number;
        used: number;
        available: number;
        expired: number;
    } {
        let used = 0;
        let available = 0;
        let expired = 0;
        
        const now = Date.now();
        
        for (const record of this.usedNonces.values()) {
            const age = now - record.timestamp;
            
            if (age > this.expirationTime) {
                expired++;
            } else if (record.used) {
                used++;
            } else {
                available++;
            }
        }
        
        return {
            total: this.usedNonces.size,
            used,
            available,
            expired
        };
    }
    
    /**
     * Get nonce statistics for specific public key
     */
    getNonceStats(publicKey: string): {
        total: number;
        used: number;
        available: number;
    } {
        let used = 0;
        let available = 0;
        
        const now = Date.now();
        
        for (const record of this.usedNonces.values()) {
            if (record.publicKey !== publicKey) continue;
            
            const age = now - record.timestamp;
            if (age > this.expirationTime) continue;
            
            if (record.used) {
                used++;
            } else {
                available++;
            }
        }
        
        return {
            total: used + available,
            used,
            available
        };
    }
    
    /**
     * Clean up expired nonces
     */
    cleanup(): void {
        const now = Date.now();
        const toDelete: string[] = [];
        
        for (const [nonceId, record] of this.usedNonces.entries()) {
            const age = now - record.timestamp;
            
            // Remove expired nonces
            if (age > this.expirationTime) {
                toDelete.push(nonceId);
            }
        }
        
        for (const nonceId of toDelete) {
            this.usedNonces.delete(nonceId);
        }
        
        if (toDelete.length > 0) {
            console.log(`Cleaned up ${toDelete.length} expired nonces`);
        }
    }
    
    /**
     * Get unique nonce ID
     */
    private getNonceId(publicKey: string, nonce: string): string {
        return `${publicKey}:${nonce}`;
    }
    
    /**
     * Save nonce records to database (for persistence)
     */
    async saveToDatabase(db: any): Promise<void> {
        const records = Array.from(this.usedNonces.values());
        
        for (const record of records) {
            await db.run(`
                INSERT OR REPLACE INTO nonces (public_key, nonce, timestamp, used)
                VALUES (?, ?, ?, ?)
            `, [record.publicKey, record.nonce, record.timestamp, record.used ? 1 : 0]);
        }
    }
    
    /**
     * Persist nonce records to database (alias for saveToDatabase)
     */
    async persistToDatabase(db: any): Promise<void> {
        return this.saveToDatabase(db);
    }
    
    /**
     * Load nonce records from database
     */
    async loadFromDatabase(db: any): Promise<void> {
        const rows = await db.all(`
            SELECT public_key, nonce, timestamp, used
            FROM nonces
            WHERE timestamp > ?
        `, [Date.now() - this.expirationTime]);
        
        for (const row of rows) {
            const nonceId = this.getNonceId(row.public_key, row.nonce);
            this.usedNonces.set(nonceId, {
                publicKey: row.public_key,
                nonce: row.nonce,
                timestamp: row.timestamp,
                used: row.used === 1
            });
        }
    }
}

/**
 * Create database schema for nonce storage
 */
export function createNonceSchema(db: any): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS nonces (
            public_key TEXT NOT NULL,
            nonce TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            used INTEGER NOT NULL,
            PRIMARY KEY (public_key, nonce)
        );
        
        CREATE INDEX IF NOT EXISTS idx_nonces_timestamp ON nonces(timestamp);
        CREATE INDEX IF NOT EXISTS idx_nonces_used ON nonces(used);
    `);
}
