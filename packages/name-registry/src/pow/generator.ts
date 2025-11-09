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
            
            // Safety: prevent infinite loop
            if (nonce > 100_000_000) {
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
}

/**
 * Get required difficulty based on name characteristics
 */
export function getRequiredDifficulty(name: string): number {
    const length = name.length;
    
    // Shorter names = higher difficulty
    if (length === 3) return 6;  // ~10-15 minutes
    if (length === 4) return 5;  // ~5-8 minutes
    if (length === 5) return 4;  // ~2-3 minutes
    if (length === 6) return 3;  // ~30-60 seconds
    
    return 2;  // 7+ chars: ~5-10 seconds
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
    
    // Verify difficulty
    const target = '0'.repeat(proof.difficulty);
    if (!hash.startsWith(target)) {
        return false;
    }
    
    // Verify proof is recent (not older than 1 hour)
    const age = Date.now() - proof.timestamp;
    if (age > 3600000) {
        return false;
    }
    
    return true;
}
