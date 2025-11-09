import { readFile } from 'fs/promises';
import { SignatureManager } from '@frw/crypto';
import { FRWValidator } from '@frw/protocol';
import { logger } from '../utils/logger.js';

interface VerifyOptions {
  key?: string;
}

export async function verifyCommand(file: string, options: VerifyOptions): Promise<void> {
  logger.section(`Verify: ${file}`);

  // Read file
  let content: string;
  try {
    content = await readFile(file, 'utf-8');
  } catch (error) {
    logger.error('Failed to read file');
    process.exit(1);
  }

  // Validate structure
  logger.info('Validating page structure...');
  const validation = FRWValidator.validatePage(content);
  
  if (!validation.valid) {
    logger.error('Page validation failed:');
    validation.errors.forEach(err => logger.error('  ' + err));
    process.exit(1);
  }
  logger.success('Page structure valid');

  // Extract metadata
  const metadata = FRWValidator.extractMetadata(content);
  logger.info('');
  logger.info('Metadata:');
  logger.info('  Version: ' + (metadata.version || 'N/A'));
  logger.info('  Author: ' + (metadata.author || 'N/A'));
  logger.info('  Date: ' + (metadata.date || 'N/A'));
  logger.info('  Signature: ' + (metadata.signature ? '✓ Present' : '✗ Missing'));

  // Verify signature
  if (metadata.signature) {
    logger.info('');
    logger.info('Verifying signature...');

    let publicKey: Uint8Array;
    if (options.key) {
      try {
        publicKey = SignatureManager.decodePublicKey(options.key);
      } catch (error) {
        logger.error('Invalid public key format');
        process.exit(1);
      }
    } else if (metadata.author) {
      try {
        publicKey = SignatureManager.decodePublicKey(metadata.author.replace('@', ''));
      } catch (error) {
        logger.error('Cannot decode author public key');
        process.exit(1);
      }
    } else {
      logger.error('No public key available for verification');
      process.exit(1);
    }

    const valid = SignatureManager.verifyPage(content, publicKey);
    
    if (valid) {
      logger.success('✓ Signature verified successfully!');
      logger.info('Content is authentic and unmodified');
    } else {
      logger.error('✗ Signature verification failed!');
      logger.error('Content may have been tampered with');
      process.exit(1);
    }
  } else {
    logger.warn('No signature found - content cannot be verified');
  }
}
