import { describe, test, expect } from '@jest/globals';
import {
  FRWError,
  ProtocolError,
  SignatureError,
  ContentNotFoundError,
  IPFSError,
  SandboxError,
  ValidationError
} from '../src/errors';

describe('Errors', () => {
  describe('FRWError', () => {
    test('creates error with message and code', () => {
      const error = new FRWError('Test error', 'PROTOCOL_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('PROTOCOL_ERROR');
      expect(error.name).toBe('FRWError');
    });

    test('includes details if provided', () => {
      const details = { info: 'additional context' };
      const error = new FRWError('Test', 'PROTOCOL_ERROR', details);
      expect(error.details).toEqual(details);
    });

    test('has stack trace', () => {
      const error = new FRWError('Test', 'PROTOCOL_ERROR');
      expect(error.stack).toBeTruthy();
    });

    test('is instance of Error', () => {
      const error = new FRWError('Test', 'PROTOCOL_ERROR');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ProtocolError', () => {
    test('creates protocol error', () => {
      const error = new ProtocolError('Protocol issue');
      expect(error.message).toBe('Protocol issue');
      expect(error.code).toBe('PROTOCOL_ERROR');
      expect(error.name).toBe('ProtocolError');
    });

    test('extends FRWError', () => {
      const error = new ProtocolError('Test');
      expect(error).toBeInstanceOf(FRWError);
      expect(error).toBeInstanceOf(Error);
    });

    test('includes details', () => {
      const details = { url: 'frw://test' };
      const error = new ProtocolError('Failed', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('SignatureError', () => {
    test('creates signature error', () => {
      const error = new SignatureError('Invalid signature');
      expect(error.message).toBe('Invalid signature');
      expect(error.code).toBe('SIGNATURE_ERROR');
      expect(error.name).toBe('SignatureError');
    });

    test('extends FRWError', () => {
      const error = new SignatureError('Test');
      expect(error).toBeInstanceOf(FRWError);
    });
  });

  describe('ContentNotFoundError', () => {
    test('creates content not found error', () => {
      const error = new ContentNotFoundError('Content missing');
      expect(error.message).toBe('Content missing');
      expect(error.code).toBe('CONTENT_NOT_FOUND');
      expect(error.name).toBe('ContentNotFoundError');
    });

    test('extends FRWError', () => {
      const error = new ContentNotFoundError('Test');
      expect(error).toBeInstanceOf(FRWError);
    });
  });

  describe('IPFSError', () => {
    test('creates IPFS error', () => {
      const error = new IPFSError('IPFS connection failed');
      expect(error.message).toBe('IPFS connection failed');
      expect(error.code).toBe('IPFS_ERROR');
      expect(error.name).toBe('IPFSError');
    });

    test('extends FRWError', () => {
      const error = new IPFSError('Test');
      expect(error).toBeInstanceOf(FRWError);
    });
  });

  describe('SandboxError', () => {
    test('creates sandbox error', () => {
      const error = new SandboxError('Sandbox execution failed');
      expect(error.message).toBe('Sandbox execution failed');
      expect(error.code).toBe('SANDBOX_ERROR');
      expect(error.name).toBe('SandboxError');
    });

    test('extends FRWError', () => {
      const error = new SandboxError('Test');
      expect(error).toBeInstanceOf(FRWError);
    });
  });

  describe('ValidationError', () => {
    test('creates validation error', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    test('extends FRWError', () => {
      const error = new ValidationError('Test');
      expect(error).toBeInstanceOf(FRWError);
    });
  });

  describe('Error catching', () => {
    test('can be caught and inspected', () => {
      try {
        throw new ProtocolError('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(ProtocolError);
        expect(error).toBeInstanceOf(FRWError);
        if (error instanceof FRWError) {
          expect(error.code).toBe('PROTOCOL_ERROR');
        }
      }
    });

    test('preserves error details through catch', () => {
      const details = { key: 'value' };
      try {
        throw new IPFSError('Test', details);
      } catch (error) {
        if (error instanceof FRWError) {
          expect(error.details).toEqual(details);
        }
      }
    });
  });
});
