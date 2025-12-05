import type { DifficultyParams } from './types.js';
/**
 * Get required difficulty parameters based on name length
 * Designed to prevent quantum speedup via memory hardness
 *
 * Classical security: 2^(4×zeros) × memory × iterations operations
 * Quantum security: 2^(2×zeros) × √(memory × iterations) operations
 *
 * Memory requirement prevents full √speedup from Grover
 */
export declare function getRequiredDifficulty(name: string): DifficultyParams;
/**
 * Estimate time required for PoW completion
 * Based on typical CPU performance (~10 Argon2id hashes/sec at 128 MiB, 3 iterations)
 */
export declare function estimateTime(params: DifficultyParams): {
    seconds: number;
    description: string;
};
/**
 * Validate difficulty parameters
 */
export declare function validateDifficulty(params: DifficultyParams): boolean;
/**
 * Compare two difficulty settings
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export declare function compareDifficulty(a: DifficultyParams, b: DifficultyParams): number;
