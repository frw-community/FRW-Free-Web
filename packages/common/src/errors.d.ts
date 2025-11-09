import type { FRWErrorCode } from './types.js';
export declare class FRWError extends Error {
    readonly code: FRWErrorCode;
    readonly details?: unknown | undefined;
    constructor(message: string, code: FRWErrorCode, details?: unknown | undefined);
}
export declare class ProtocolError extends FRWError {
    constructor(message: string, details?: unknown);
}
export declare class SignatureError extends FRWError {
    constructor(message: string, details?: unknown);
}
export declare class ContentNotFoundError extends FRWError {
    constructor(message: string, details?: unknown);
}
export declare class IPFSError extends FRWError {
    constructor(message: string, details?: unknown);
}
export declare class SandboxError extends FRWError {
    constructor(message: string, details?: unknown);
}
export declare class ValidationError extends FRWError {
    constructor(message: string, details?: unknown);
}
//# sourceMappingURL=errors.d.ts.map