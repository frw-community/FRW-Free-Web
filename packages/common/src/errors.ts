import type { FRWErrorCode } from './types.js';

export class FRWError extends Error {
  constructor(
    message: string,
    public readonly code: FRWErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'FRWError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProtocolError extends FRWError {
  constructor(message: string, details?: unknown) {
    super(message, 'PROTOCOL_ERROR', details);
    this.name = 'ProtocolError';
  }
}

export class SignatureError extends FRWError {
  constructor(message: string, details?: unknown) {
    super(message, 'SIGNATURE_ERROR', details);
    this.name = 'SignatureError';
  }
}

export class ContentNotFoundError extends FRWError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONTENT_NOT_FOUND', details);
    this.name = 'ContentNotFoundError';
  }
}

export class IPFSError extends FRWError {
  constructor(message: string, details?: unknown) {
    super(message, 'IPFS_ERROR', details);
    this.name = 'IPFSError';
  }
}

export class SandboxError extends FRWError {
  constructor(message: string, details?: unknown) {
    super(message, 'SANDBOX_ERROR', details);
    this.name = 'SandboxError';
  }
}

export class ValidationError extends FRWError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}
