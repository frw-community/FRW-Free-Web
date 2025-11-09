import { describe, test, expect } from '@jest/globals';
import {
  isValidFRWURL,
  isValidPublicKey,
  extractMetadata,
  canonicalize,
  formatBytes,
  sleep,
  sanitizePath,
  extractAllMetadata,
  isHTML,
  validateDateISO,
  validateVersion
} from '../src/utils';

describe('Utils', () => {
  describe('isValidFRWURL', () => {
    test('validates correct FRW URLs', () => {
      expect(isValidFRWURL('frw://abc123/index.html')).toBe(true);
      expect(isValidFRWURL('frw://ABC123xyz/path/to/file.html')).toBe(true);
      expect(isValidFRWURL('frw://key123/')).toBe(true);
    });

    test('rejects invalid URLs', () => {
      expect(isValidFRWURL('http://example.com')).toBe(false);
      expect(isValidFRWURL('frw://')).toBe(false);
      expect(isValidFRWURL('frw://key')).toBe(false);
      expect(isValidFRWURL('frw://key-with-dash/file')).toBe(false);
      expect(isValidFRWURL('not-a-url')).toBe(false);
    });
  });

  describe('isValidPublicKey', () => {
    test('validates correct public keys', () => {
      expect(isValidPublicKey('abcdef1234567890abcdef1234567890')).toBe(true);
      expect(isValidPublicKey('ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234')).toBe(true);
    });

    test('rejects invalid public keys', () => {
      expect(isValidPublicKey('short')).toBe(false);
      expect(isValidPublicKey('contains-dash-invalid')).toBe(false);
      expect(isValidPublicKey('has spaces invalid')).toBe(false);
      expect(isValidPublicKey('')).toBe(false);
    });
  });

  describe('extractMetadata', () => {
    test('extracts metadata from HTML', () => {
      const html = '<meta name="frw-version" content="1.0">';
      expect(extractMetadata(html, 'frw-version')).toBe('1.0');
    });

    test('extracts metadata case-insensitively', () => {
      const html = '<META NAME="frw-author" CONTENT="alice">';
      expect(extractMetadata(html, 'frw-author')).toBe('alice');
    });

    test('returns null for non-existent metadata', () => {
      const html = '<meta name="frw-version" content="1.0">';
      expect(extractMetadata(html, 'frw-nonexistent')).toBeNull();
    });

    test('handles metadata with special characters', () => {
      const html = '<meta name="frw-keywords" content="test, demo, example">';
      expect(extractMetadata(html, 'frw-keywords')).toBe('test, demo, example');
    });
  });

  describe('canonicalize', () => {
    test('removes signature meta tag', () => {
      const html = `<html>
<head>
  <meta name="frw-version" content="1.0">
  <meta name="frw-signature" content="abc123signature">
</head>
<body>Content</body>
</html>`;
      
      const canonical = canonicalize(html);
      expect(canonical).not.toContain('frw-signature');
      expect(canonical).toContain('frw-version');
    });

    test('preserves document structure without signature', () => {
      const html = `<html>
<head>
  <title>Test</title>
  <meta name="frw-signature" content="sig123">
</head>
<body>Test</body>
</html>`;
      
      const canonical = canonicalize(html);
      // Should preserve newlines and structure
      expect(canonical).toContain('<title>Test</title>');
      expect(canonical).toContain('</head>');
    });

    test('handles content without signature', () => {
      const html = '<html><body>No signature here</body></html>';
      const canonical = canonicalize(html);
      expect(canonical).toBe(html.trim());
    });

    test('removes multiple signatures if present', () => {
      const html = `<meta name="frw-signature" content="sig1">
<meta name="frw-signature" content="sig2">
Content`;
      
      const canonical = canonicalize(html);
      expect(canonical).not.toContain('frw-signature');
      expect(canonical).toContain('Content');
    });

    test('trims whitespace', () => {
      const html = '   <html><body>Test</body></html>   ';
      const canonical = canonicalize(html);
      expect(canonical).toBe('<html><body>Test</body></html>');
    });
  });

  describe('formatBytes', () => {
    test('formats bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1023)).toBe('1023.00 B');
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1536)).toBe('1.50 KB');
      expect(formatBytes(1048576)).toBe('1.00 MB');
      expect(formatBytes(1073741824)).toBe('1.00 GB');
    });

    test('handles large numbers', () => {
      expect(formatBytes(5368709120)).toBe('5.00 GB');
      expect(formatBytes(2621440)).toBe('2.50 MB');
    });

    test('rounds to two decimal places', () => {
      expect(formatBytes(1234)).toBe('1.21 KB');
      expect(formatBytes(123456)).toBe('120.56 KB');
    });
  });

  describe('sleep', () => {
    test('delays execution', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow small margin
      expect(elapsed).toBeLessThan(200);
    });

    test('resolves after specified time', async () => {
      const result = await sleep(10);
      expect(result).toBeUndefined();
    });
  });

  describe('sanitizePath', () => {
    test('adds leading slash if missing', () => {
      expect(sanitizePath('index.html')).toBe('/index.html');
      expect(sanitizePath('path/to/file.txt')).toBe('/path/to/file.txt');
    });

    test('preserves leading slash if present', () => {
      expect(sanitizePath('/index.html')).toBe('/index.html');
      expect(sanitizePath('/path/to/file.txt')).toBe('/path/to/file.txt');
    });

    test('handles empty path', () => {
      expect(sanitizePath('')).toBe('/');
    });

    test('handles root path', () => {
      expect(sanitizePath('/')).toBe('/');
    });
  });

  describe('extractAllMetadata', () => {
    test('extracts all metadata fields', () => {
      const html = `
        <meta name="frw-version" content="1.0">
        <meta name="frw-author" content="alice">
        <meta name="frw-date" content="2024-01-01">
        <meta name="frw-keywords" content="test">
      `;
      
      const metadata = extractAllMetadata(html);
      expect(metadata['frw-version']).toBe('1.0');
      expect(metadata['frw-author']).toBe('alice');
      expect(metadata['frw-date']).toBe('2024-01-01');
      expect(metadata['frw-keywords']).toBe('test');
    });

    test('only includes present fields', () => {
      const html = '<meta name="frw-version" content="1.0">';
      const metadata = extractAllMetadata(html);
      
      expect(metadata['frw-version']).toBe('1.0');
      expect(metadata['frw-author']).toBeUndefined();
      expect(Object.keys(metadata)).toHaveLength(1);
    });

    test('returns empty object for no metadata', () => {
      const html = '<html><body>No metadata</body></html>';
      const metadata = extractAllMetadata(html);
      expect(metadata).toEqual({});
    });
  });

  describe('isHTML', () => {
    test('detects HTML with html tag', () => {
      expect(isHTML('<html><body>Test</body></html>')).toBe(true);
      expect(isHTML('<HTML><BODY>Test</BODY></HTML>')).toBe(true);
      expect(isHTML('<html lang="en"><body></body></html>')).toBe(true);
    });

    test('detects HTML with DOCTYPE', () => {
      expect(isHTML('<!DOCTYPE html><html></html>')).toBe(true);
      expect(isHTML('<!doctype html><html></html>')).toBe(true);
    });

    test('rejects non-HTML content', () => {
      expect(isHTML('Just plain text')).toBe(false);
      expect(isHTML('{ "json": "data" }')).toBe(false);
      expect(isHTML('<div>Partial HTML</div>')).toBe(false);
    });

    test('handles empty string', () => {
      expect(isHTML('')).toBe(false);
    });
  });

  describe('validateDateISO', () => {
    test('validates correct ISO dates', () => {
      expect(validateDateISO('2024-01-15T10:30:00Z')).toBe(true);
      expect(validateDateISO('2024-01-15')).toBe(true);
      expect(validateDateISO('2024-01-15T10:30:00.000Z')).toBe(true);
    });

    test('rejects invalid dates', () => {
      expect(validateDateISO('not-a-date')).toBe(false);
      expect(validateDateISO('2024-13-01')).toBe(false); // Invalid month
      expect(validateDateISO('invalid')).toBe(false);
    });

    test('handles various date formats', () => {
      expect(validateDateISO('01/15/2024')).toBe(true); // US format
      expect(validateDateISO('January 15, 2024')).toBe(true);
    });

    test('handles empty string', () => {
      expect(validateDateISO('')).toBe(false);
    });
  });

  describe('validateVersion', () => {
    test('validates correct version strings', () => {
      expect(validateVersion('1.0')).toBe(true);
      expect(validateVersion('2.5')).toBe(true);
      expect(validateVersion('10.99')).toBe(true);
    });

    test('rejects invalid version strings', () => {
      expect(validateVersion('1')).toBe(false);
      expect(validateVersion('1.0.0')).toBe(false); // Semantic versioning
      expect(validateVersion('v1.0')).toBe(false);
      expect(validateVersion('1.x')).toBe(false);
      expect(validateVersion('invalid')).toBe(false);
    });

    test('requires exactly two parts', () => {
      expect(validateVersion('1.2.3')).toBe(false);
      expect(validateVersion('1')).toBe(false);
      expect(validateVersion('.1')).toBe(false);
    });

    test('handles empty string', () => {
      expect(validateVersion('')).toBe(false);
    });
  });
});
