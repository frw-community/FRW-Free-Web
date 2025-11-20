import { describe, test, expect } from '@jest/globals';
import { FRWValidator } from '../src/validator';

describe('FRWValidator', () => {
  describe('validatePage', () => {
    test('should accept valid HTML with all required metadata', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="frw-version" content="1.0">
          <meta name="frw-author" content="test-author-key">
          <meta name="frw-date" content="2024-01-15T10:30:00Z">
        </head>
        <body>Content</body>
        </html>
      `;

      const result = FRWValidator.validatePage(html);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject non-HTML content', () => {
      const result = FRWValidator.validatePage('Not HTML content');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content is not valid HTML');
    });

    test('should reject HTML missing version metadata', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="frw-author" content="test-author">
          <meta name="frw-date" content="2024-01-15T10:30:00Z">
        </head>
        <body>Content</body>
        </html>
      `;

      const result = FRWValidator.validatePage(html);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required metadata: frw-version');
    });

    test('should reject HTML missing author metadata', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="frw-version" content="1.0">
          <meta name="frw-date" content="2024-01-15T10:30:00Z">
        </head>
        <body>Content</body>
        </html>
      `;

      const result = FRWValidator.validatePage(html);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required metadata: frw-author');
    });

    test('should reject HTML missing date metadata', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="frw-version" content="1.0">
          <meta name="frw-author" content="test-author">
        </head>
        <body>Content</body>
        </html>
      `;

      const result = FRWValidator.validatePage(html);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required metadata: frw-date');
    });

    test('should reject invalid version format', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="frw-version" content="invalid">
          <meta name="frw-author" content="test-author">
          <meta name="frw-date" content="2024-01-15T10:30:00Z">
        </head>
        <body>Content</body>
        </html>
      `;

      const result = FRWValidator.validatePage(html);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid version format (expected: X.Y)');
    });

    test('should reject invalid date format', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="frw-version" content="1.0">
          <meta name="frw-author" content="test-author">
          <meta name="frw-date" content="not-a-date">
        </head>
        <body>Content</body>
        </html>
      `;

      const result = FRWValidator.validatePage(html);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid date format (expected: ISO 8601)');
    });

    test('should collect multiple errors', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="frw-version" content="invalid">
        </head>
        <body>Content</body>
        </html>
      `;

      const result = FRWValidator.validatePage(html);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('extractMetadata', () => {
    test('should extract all metadata fields', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="frw-version" content="1.0">
          <meta name="frw-author" content="test-author">
          <meta name="frw-date" content="2024-01-15T10:30:00Z">
          <meta name="frw-signature" content="test-signature">
          <meta name="frw-keywords" content="test,keywords">
          <meta name="frw-license" content="MIT">
          <meta name="frw-permissions" content="read,write">
        </head>
        <body>Content</body>
        </html>
      `;

      const metadata = FRWValidator.extractMetadata(html);
      
      expect(metadata.version).toBe('1.0');
      expect(metadata.author).toBe('test-author');
      expect(metadata.date).toBe('2024-01-15T10:30:00Z');
      expect(metadata.signature).toBe('test-signature');
      expect(metadata.keywords).toBe('test,keywords');
      expect(metadata.license).toBe('MIT');
      expect(metadata.permissions).toEqual(['read', 'write']);
    });

    test('should handle missing optional metadata', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="frw-version" content="1.0">
          <meta name="frw-author" content="test-author">
          <meta name="frw-date" content="2024-01-15T10:30:00Z">
        </head>
        <body>Content</body>
        </html>
      `;

      const metadata = FRWValidator.extractMetadata(html);
      
      expect(metadata.version).toBe('1.0');
      expect(metadata.signature).toBeUndefined();
      expect(metadata.keywords).toBeUndefined();
    });

    test('should handle empty permissions', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="frw-version" content="1.0">
          <meta name="frw-author" content="test-author">
          <meta name="frw-date" content="2024-01-15T10:30:00Z">
          <meta name="frw-permissions" content="">
        </head>
        <body>Content</body>
        </html>
      `;

      const metadata = FRWValidator.extractMetadata(html);
      // Empty string content is treated as no value, so permissions will be undefined
      expect(metadata.permissions).toBeUndefined();
    });
  });

  describe('validateMetadata', () => {
    test('should accept valid metadata object', () => {
      const metadata = {
        version: '1.0',
        author: 'test-author',
        date: '2024-01-15T10:30:00Z'
      };

      const result = FRWValidator.validateMetadata(metadata);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject metadata without version', () => {
      const metadata = {
        author: 'test-author',
        date: '2024-01-15T10:30:00Z'
      };

      const result = FRWValidator.validateMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing version');
    });

    test('should reject metadata with invalid version format', () => {
      const metadata = {
        version: 'invalid',
        author: 'test-author',
        date: '2024-01-15T10:30:00Z'
      };

      const result = FRWValidator.validateMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid version format');
    });

    test('should reject metadata without author', () => {
      const metadata = {
        version: '1.0',
        date: '2024-01-15T10:30:00Z'
      };

      const result = FRWValidator.validateMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing author');
    });

    test('should reject metadata without date', () => {
      const metadata = {
        version: '1.0',
        author: 'test-author'
      };

      const result = FRWValidator.validateMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing date');
    });

    test('should reject metadata with invalid date format', () => {
      const metadata = {
        version: '1.0',
        author: 'test-author',
        date: 'not-a-date'
      };

      const result = FRWValidator.validateMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid date format');
    });

    test('should collect multiple validation errors', () => {
      const metadata = {
        version: 'invalid',
        date: 'not-a-date'
      };

      const result = FRWValidator.validateMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });
  });
});
