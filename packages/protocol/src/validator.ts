import type { ValidationResult, FRWMetadata } from '@frw/common';
import { 
  extractMetadata, 
  extractAllMetadata,
  validateDateISO,
  validateVersion,
  isHTML,
  METADATA_FIELDS 
} from '@frw/common';

export class FRWValidator {
  static validatePage(html: string): ValidationResult {
    const errors: string[] = [];

    if (!isHTML(html)) {
      errors.push('Content is not valid HTML');
      return { valid: false, errors };
    }

    const requiredFields = [
      METADATA_FIELDS.VERSION,
      METADATA_FIELDS.AUTHOR,
      METADATA_FIELDS.DATE
    ];

    for (const field of requiredFields) {
      const value = extractMetadata(html, field);
      if (!value) {
        errors.push(`Missing required metadata: ${field}`);
      }
    }

    const version = extractMetadata(html, METADATA_FIELDS.VERSION);
    if (version && !validateVersion(version)) {
      errors.push('Invalid version format (expected: X.Y)');
    }

    const date = extractMetadata(html, METADATA_FIELDS.DATE);
    if (date && !validateDateISO(date)) {
      errors.push('Invalid date format (expected: ISO 8601)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static extractMetadata(html: string): Partial<FRWMetadata> {
    const raw = extractAllMetadata(html);
    
    return {
      version: raw[METADATA_FIELDS.VERSION],
      author: raw[METADATA_FIELDS.AUTHOR],
      date: raw[METADATA_FIELDS.DATE],
      signature: raw[METADATA_FIELDS.SIGNATURE],
      keywords: raw[METADATA_FIELDS.KEYWORDS],
      license: raw[METADATA_FIELDS.LICENSE],
      permissions: raw[METADATA_FIELDS.PERMISSIONS]?.split(',').map((p: string) => p.trim())
    };
  }

  static validateMetadata(metadata: Partial<FRWMetadata>): ValidationResult {
    const errors: string[] = [];

    if (!metadata.version) {
      errors.push('Missing version');
    } else if (!validateVersion(metadata.version)) {
      errors.push('Invalid version format');
    }

    if (!metadata.author) {
      errors.push('Missing author');
    }

    if (!metadata.date) {
      errors.push('Missing date');
    } else if (!validateDateISO(metadata.date)) {
      errors.push('Invalid date format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
