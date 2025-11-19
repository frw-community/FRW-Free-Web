export interface ProofOfWorkV2 {
    version: 2;
    nonce: bigint;
    timestamp: number;
    hash: Uint8Array;
    difficulty: number;
    memory_cost_mib: number;
    time_cost: number;
    parallelism: number;
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
export declare class POWError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
