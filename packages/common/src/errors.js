export class FRWError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'FRWError';
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ProtocolError extends FRWError {
    constructor(message, details) {
        super(message, 'PROTOCOL_ERROR', details);
        this.name = 'ProtocolError';
    }
}
export class SignatureError extends FRWError {
    constructor(message, details) {
        super(message, 'SIGNATURE_ERROR', details);
        this.name = 'SignatureError';
    }
}
export class ContentNotFoundError extends FRWError {
    constructor(message, details) {
        super(message, 'CONTENT_NOT_FOUND', details);
        this.name = 'ContentNotFoundError';
    }
}
export class IPFSError extends FRWError {
    constructor(message, details) {
        super(message, 'IPFS_ERROR', details);
        this.name = 'IPFSError';
    }
}
export class SandboxError extends FRWError {
    constructor(message, details) {
        super(message, 'SANDBOX_ERROR', details);
        this.name = 'SandboxError';
    }
}
export class ValidationError extends FRWError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
//# sourceMappingURL=errors.js.map