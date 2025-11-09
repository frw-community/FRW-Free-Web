import { describe, test, expect } from '@jest/globals';
import { FRWParser } from '../src/parser';
import { ProtocolError } from '@frw/common';

describe('FRWParser', () => {
  describe('parse', () => {
    test('parses valid FRW URL', () => {
      const url = 'frw://abc123/index.frw';
      const result = FRWParser.parse(url);
      
      expect(result.protocol).toBe('frw');
      expect(result.publicKey).toBe('abc123');
      expect(result.path).toBe('/index.frw');
    });

    test('adds leading slash to path', () => {
      const url = 'frw://abc123/page.frw';
      const result = FRWParser.parse(url);
      expect(result.path).toBe('/page.frw');
    });

    test('defaults to /index.frw', () => {
      const url = 'frw://abc123';
      const result = FRWParser.parse(url);
      expect(result.path).toBe('/index.frw');
    });

    test('throws on invalid protocol', () => {
      expect(() => FRWParser.parse('http://example.com')).toThrow(ProtocolError);
    });

    test('throws on invalid format', () => {
      expect(() => FRWParser.parse('frw://')).toThrow(ProtocolError);
    });
  });

  describe('build', () => {
    test('builds FRW URL', () => {
      const url = FRWParser.build('abc123', '/page.frw');
      expect(url).toBe('frw://abc123/page.frw');
    });

    test('adds leading slash', () => {
      const url = FRWParser.build('abc123', 'page.frw');
      expect(url).toBe('frw://abc123/page.frw');
    });
  });

  describe('validate', () => {
    test('validates correct URL', () => {
      expect(FRWParser.validate('frw://abc123/page.frw')).toBe(true);
    });

    test('rejects invalid URL', () => {
      expect(FRWParser.validate('http://example.com')).toBe(false);
    });
  });

  describe('extractPublicKey', () => {
    test('extracts public key', () => {
      const key = FRWParser.extractPublicKey('frw://abc123/page.frw');
      expect(key).toBe('abc123');
    });
  });

  describe('extractPath', () => {
    test('extracts path', () => {
      const path = FRWParser.extractPath('frw://abc123/blog/post.frw');
      expect(path).toBe('/blog/post.frw');
    });
  });
});
