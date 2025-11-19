"use strict";
// Quantum-Resistant Difficulty Calculation
// Memory-hard parameters to resist Grover's algorithm
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequiredDifficulty = getRequiredDifficulty;
exports.estimateTime = estimateTime;
exports.validateDifficulty = validateDifficulty;
exports.compareDifficulty = compareDifficulty;
/**
 * Get required difficulty parameters based on name length
 * Designed to prevent quantum speedup via memory hardness
 *
 * Classical security: 2^(4×zeros) × memory × iterations operations
 * Quantum security: 2^(2×zeros) × √(memory × iterations) operations
 *
 * Memory requirement prevents full √speedup from Grover
 */
function getRequiredDifficulty(name) {
    const length = name.length;
    // 1-char names: Effectively impossible (~1000 years)
    if (length === 1) {
        return {
            leading_zeros: 16,
            memory_mib: 8192,
            iterations: 10
        };
    }
    // 2-char names: Extremely expensive (~62 years)
    if (length === 2) {
        return {
            leading_zeros: 15,
            memory_mib: 8192,
            iterations: 10
        };
    }
    // 3-char names: Very expensive (~2.5 days)
    if (length === 3) {
        return {
            leading_zeros: 5,
            memory_mib: 256,
            iterations: 3
        };
    }
    // 4-char names: Expensive (~1 day)
    if (length === 4) {
        return {
            leading_zeros: 5,
            memory_mib: 128,
            iterations: 3
        };
    }
    // 5-char names: Moderate (~2 hours)
    if (length === 5) {
        return {
            leading_zeros: 4,
            memory_mib: 128,
            iterations: 3
        };
    }
    // 6-char names: Light (~1 hour)
    if (length === 6) {
        return {
            leading_zeros: 4,
            memory_mib: 64,
            iterations: 3
        };
    }
    // 7-char names: Minimal (~2.5 minutes)
    if (length === 7) {
        return {
            leading_zeros: 3,
            memory_mib: 64,
            iterations: 2
        };
    }
    // 8-char names: Quick (~1 minute)
    if (length === 8) {
        return {
            leading_zeros: 3,
            memory_mib: 32,
            iterations: 2
        };
    }
    // 9-10 char names: Fast (~5 seconds)
    if (length === 9 || length === 10) {
        return {
            leading_zeros: 2,
            memory_mib: 32,
            iterations: 2
        };
    }
    // 11-15 char names: Instant (~0.3 seconds)
    if (length >= 11 && length <= 15) {
        return {
            leading_zeros: 1,
            memory_mib: 16,
            iterations: 2
        };
    }
    // 16+ char names: No PoW required (minimal work)
    return {
        leading_zeros: 0,
        memory_mib: 16,
        iterations: 2 // Argon2 requires minimum 2
    };
}
/**
 * Estimate time required for PoW completion
 * Based on typical CPU performance (~10 Argon2id hashes/sec at 128 MiB, 3 iterations)
 */
function estimateTime(params) {
    // Average attempts needed for N leading zeros: 16^N
    const avg_attempts = Math.pow(16, params.leading_zeros);
    // Argon2id hashing speed (realistic estimate)
    // Baseline: ~10 hashes/sec @ 128 MiB, 3 iterations
    const baseline_speed = 10;
    const baseline_memory = 128;
    const baseline_iterations = 3;
    // Adjust for memory and iterations
    const memory_factor = baseline_memory / params.memory_mib;
    const iteration_factor = baseline_iterations / params.iterations;
    const hashes_per_sec = baseline_speed * memory_factor * iteration_factor;
    const seconds = Math.ceil(avg_attempts / Math.max(hashes_per_sec, 0.1));
    let description;
    if (seconds < 60) {
        description = `~${seconds} seconds`;
    }
    else if (seconds < 3600) {
        const minutes = Math.ceil(seconds / 60);
        description = `~${minutes} minutes`;
    }
    else if (seconds < 86400) {
        const hours = Math.ceil(seconds / 3600);
        description = `~${hours} hours`;
    }
    else if (seconds < 2592000) {
        const days = Math.ceil(seconds / 86400);
        description = `~${days} days`;
    }
    else if (seconds < 31536000) {
        const months = Math.ceil(seconds / 2592000);
        description = `~${months} months`;
    }
    else {
        const years = Math.ceil(seconds / 31536000);
        description = `~${years} years`;
    }
    return { seconds, description };
}
/**
 * Validate difficulty parameters
 */
function validateDifficulty(params) {
    return (params.leading_zeros >= 0 &&
        params.leading_zeros <= 20 &&
        params.memory_mib >= 16 &&
        params.memory_mib <= 8192 &&
        params.iterations >= 1 &&
        params.iterations <= 20);
}
/**
 * Compare two difficulty settings
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareDifficulty(a, b) {
    // Primary comparison: leading zeros
    if (a.leading_zeros !== b.leading_zeros) {
        return a.leading_zeros - b.leading_zeros;
    }
    // Secondary: memory cost
    if (a.memory_mib !== b.memory_mib) {
        return a.memory_mib - b.memory_mib;
    }
    // Tertiary: iterations
    return a.iterations - b.iterations;
}
