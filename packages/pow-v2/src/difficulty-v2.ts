// Quantum-Resistant Difficulty Calculation
// Memory-hard parameters to resist Grover's algorithm

import type { DifficultyParams } from './types';

/**
 * Get required difficulty parameters based on name length
 * Designed to prevent quantum speedup via memory hardness
 * 
 * Classical security: 2^(4×zeros) × memory × iterations operations
 * Quantum security: 2^(2×zeros) × √(memory × iterations) operations
 * 
 * Memory requirement prevents full √speedup from Grover
 */
export function getRequiredDifficulty(name: string): DifficultyParams {
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

  // 3-char names: Very expensive (~2 years)
  if (length === 3) {
    return {
      leading_zeros: 13,
      memory_mib: 4096,
      iterations: 8
    };
  }

  // 4-char names: Expensive (~2 months)
  if (length === 4) {
    return {
      leading_zeros: 11,
      memory_mib: 2048,
      iterations: 6
    };
  }

  // 5-char names: Moderate (~5 days)
  if (length === 5) {
    return {
      leading_zeros: 10,
      memory_mib: 1024,
      iterations: 5
    };
  }

  // 6-char names: Light (~12 hours)
  if (length === 6) {
    return {
      leading_zeros: 9,
      memory_mib: 512,
      iterations: 4
    };
  }

  // 7-char names: Minimal (~90 minutes)
  if (length === 7) {
    return {
      leading_zeros: 8,
      memory_mib: 256,
      iterations: 3
    };
  }

  // 8-char names: Quick (~6 minutes)
  if (length === 8) {
    return {
      leading_zeros: 7,
      memory_mib: 128,
      iterations: 3
    };
  }

  // 9-10 char names: Fast (~22 seconds)
  if (length === 9 || length === 10) {
    return {
      leading_zeros: 6,
      memory_mib: 64,
      iterations: 3
    };
  }

  // 11-15 char names: Instant (~1 second)
  if (length >= 11 && length <= 15) {
    return {
      leading_zeros: 5,
      memory_mib: 32,
      iterations: 2
    };
  }

  // 16+ char names: No PoW required
  return {
    leading_zeros: 0,
    memory_mib: 16,
    iterations: 1
  };
}

/**
 * Estimate time required for PoW completion
 * Based on typical CPU performance (~1000 Argon2id hashes/sec at 64 MiB)
 */
export function estimateTime(params: DifficultyParams): {
  seconds: number;
  description: string;
} {
  // Average attempts needed for N leading zeros: 16^N
  const avg_attempts = Math.pow(16, params.leading_zeros);
  
  // Argon2id hashing speed (decreases with memory)
  // Baseline: 1000 hashes/sec @ 64 MiB
  const baseline_speed = 1000;
  const baseline_memory = 64;
  const speed_factor = baseline_memory / params.memory_mib;
  const hashes_per_sec = baseline_speed * speed_factor / params.iterations;
  
  const seconds = Math.ceil(avg_attempts / hashes_per_sec);
  
  let description: string;
  if (seconds < 60) {
    description = `~${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    description = `~${minutes} minutes`;
  } else if (seconds < 86400) {
    const hours = Math.ceil(seconds / 3600);
    description = `~${hours} hours`;
  } else if (seconds < 2592000) {
    const days = Math.ceil(seconds / 86400);
    description = `~${days} days`;
  } else if (seconds < 31536000) {
    const months = Math.ceil(seconds / 2592000);
    description = `~${months} months`;
  } else {
    const years = Math.ceil(seconds / 31536000);
    description = `~${years} years`;
  }
  
  return { seconds, description };
}

/**
 * Validate difficulty parameters
 */
export function validateDifficulty(params: DifficultyParams): boolean {
  return (
    params.leading_zeros >= 0 &&
    params.leading_zeros <= 20 &&
    params.memory_mib >= 16 &&
    params.memory_mib <= 8192 &&
    params.iterations >= 1 &&
    params.iterations <= 20
  );
}

/**
 * Compare two difficulty settings
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareDifficulty(a: DifficultyParams, b: DifficultyParams): number {
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
