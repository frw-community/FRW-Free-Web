// Proof of Work Generator
// CPU-intensive task to rate-limit registrations

import * as crypto from 'crypto';

export interface ProofOfWork {
    nonce: number;
    hash: string;
    difficulty: number;
    timestamp: number;
}

export class ProofOfWorkGenerator {
    /**
     * Generate proof of work for name registration
     * Uses SHA-256 with leading zero requirement
     */
    async generate(
        name: string,
        publicKey: string,
        difficulty: number,
        onProgress?: (attempts: number) => void
    ): Promise<ProofOfWork> {
        const startTime = Date.now();
        let nonce = 0;
        
        // Difficulty 0 = no POW needed (long names)
        if (difficulty === 0) {
            const data = `${name}:${publicKey}:${nonce}:${startTime}`;
            const hash = crypto
                .createHash('sha256')
                .update(data)
                .digest('hex');
            
            return {
                nonce,
                hash,
                difficulty,
                timestamp: startTime
            };
        }
        
        const target = '0'.repeat(difficulty);
        
        while (true) {
            // Create challenge string
            const data = `${name}:${publicKey}:${nonce}:${startTime}`;
            
            // Calculate hash
            const hash = crypto
                .createHash('sha256')
                .update(data)
                .digest('hex');
            
            // Check if hash meets difficulty requirement
            if (hash.startsWith(target)) {
                return {
                    nonce,
                    hash,
                    difficulty,
                    timestamp: startTime
                };
            }
            
            nonce++;
            
            // Progress callback every 10k attempts
            if (onProgress && nonce % 10000 === 0) {
                onProgress(nonce);
            }
            
            // Safety: prevent infinite loop (only for low difficulty)
            // High difficulty names (9+ zeros) are intentionally hard
            if (difficulty < 9 && nonce > 100_000_000) {
                throw new Error('PoW generation timeout - difficulty too high');
            }
        }
    }
    
    /**
     * Estimate time required for proof of work
     * Based on difficulty and typical CPU speed
     */
    estimateTime(difficulty: number): {
        seconds: number;
        description: string;
    } {
        // Average attempts needed: 16^difficulty
        const avgAttempts = Math.pow(16, difficulty);
        
        // Assume ~100k hashes/second on average CPU
        const hashesPerSecond = 100000;
        const seconds = Math.ceil(avgAttempts / hashesPerSecond);
        
        let description: string;
        if (seconds < 60) {
            description = `~${seconds} seconds`;
        } else if (seconds < 3600) {
            description = `~${Math.ceil(seconds / 60)} minutes`;
        } else {
            description = `~${Math.ceil(seconds / 3600)} hours`;
        }
        
        return { seconds, description };
    }
    
    /**
     * Verify proof of work is valid
     */
    verifyProof(
        name: string,
        publicKey: string,
        proof: ProofOfWork
    ): boolean {
        // Reconstruct challenge
        const data = `${name}:${publicKey}:${proof.nonce}:${proof.timestamp}`;
        
        // Calculate hash
        const hash = crypto
            .createHash('sha256')
            .update(data)
            .digest('hex');
        
        // Verify hash matches
        if (hash !== proof.hash) {
            return false;
        }
        
        // Verify difficulty (skip for difficulty 0)
        if (proof.difficulty > 0) {
            const target = '0'.repeat(proof.difficulty);
            if (!hash.startsWith(target)) {
                return false;
            }
        }
        
        // Verify proof is recent (not older than 1 hour)
        const age = Date.now() - proof.timestamp;
        if (age > 3600000) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get required difficulty based on name characteristics
     * Goal: Prevent short name squatting, make long names easy
     */
    getRequiredDifficulty(name: string): number {
        return getRequiredDifficulty(name);
    }
}

/**
 * Get required difficulty based on name characteristics
 * Goal: Prevent short name squatting, make long names easy
 * 
 * Difficulty = leading zeros in SHA-256 hash
 * Each leading zero = 16x harder (4 bits)
 * 
 * Approximate times (modern CPU ~1M hashes/sec):
 * - 16 zeros: 2^64 attempts = ~585,000 years
 * - 15 zeros: 2^60 attempts = ~36,500 years  
 * - 14 zeros: 2^56 attempts = ~2,280 years
 * - 13 zeros: 2^52 attempts = ~142 years
 * - 12 zeros: 2^48 attempts = ~8.9 years
 * - 11 zeros: 2^44 attempts = ~6 months
 * - 10 zeros: 2^40 attempts = ~13 days
 * - 9 zeros:  2^36 attempts = ~19 hours
 * - 8 zeros:  2^32 attempts = ~72 minutes
 * - 7 zeros:  2^28 attempts = ~4.5 minutes
 * - 6 zeros:  2^24 attempts = ~17 seconds
 */
export function getRequiredDifficulty(name: string): number {
    const length = name.length;
    
    // 1-2 char names: effectively impossible (reserved for official use)
    if (length <= 2) return 15;  // ~36,500 years
    
    // 3 char names: extremely expensive (premium squatting deterrent)
    if (length === 3) return 12;  // ~8.9 years per registration
    
    // 4 char names: very expensive
    if (length === 4) return 10;  // ~13 days
    
    // 5 char names: expensive
    if (length === 5) return 9;  // ~19 hours
    
    // 6 char names: moderate cost
    if (length === 6) return 8;  // ~72 minutes
    
    // 7 char names: light cost
    if (length === 7) return 7;  // ~4.5 minutes
    
    // 8 char names: minimal cost
    if (length === 8) return 6;  // ~17 seconds
    
    // 9-10 char names: trivial
    if (length === 9 || length === 10) return 5;  // ~1 second
    
    // 11-15 char names: instant
    if (length >= 11 && length <= 15) return 4;  // ~0.06 seconds
    
    // 16+ char names: no POW
    return 0;
}

/**
 * Verify proof of work is valid
 */
export function verifyProof(
    name: string,
    publicKey: string,
    proof: ProofOfWork
): boolean {
    // Reconstruct challenge
    const data = `${name}:${publicKey}:${proof.nonce}:${proof.timestamp}`;
    
    // Calculate hash
    const hash = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
    
    // Verify hash matches
    if (hash !== proof.hash) {
        return false;
    }
    
    // Verify difficulty (skip for difficulty 0)
    if (proof.difficulty > 0) {
        const target = '0'.repeat(proof.difficulty);
        if (!hash.startsWith(target)) {
            return false;
        }
    }
    
    // Verify proof is recent (not older than 1 hour)
    const age = Date.now() - proof.timestamp;
    if (age > 3600000) {
        return false;
    }
    
    return true;
}
