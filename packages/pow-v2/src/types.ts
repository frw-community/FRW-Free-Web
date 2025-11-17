// Post-Quantum Proof of Work Types

export interface ProofOfWorkV2 {
  version: 2;
  nonce: bigint;
  timestamp: number;
  hash: Uint8Array;              // SHA3-256 output
  difficulty: number;             // Required leading zeros
  memory_cost_mib: number;        // Argon2id memory parameter
  time_cost: number;              // Argon2id iterations
  parallelism: number;            // Argon2id parallelism (always 4)
}

export interface DifficultyParams {
  leading_zeros: number;
  memory_mib: number;
  iterations: number;
}

export interface POWProgress {
  attempts: bigint;
  elapsed_ms: number;
  hashes_per_sec: number;
}

export class POWError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'POWError';
  }
}
