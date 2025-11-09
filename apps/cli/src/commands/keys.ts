import { readdir, readFile } from 'fs/promises';
import { SignatureManager } from '@frw/crypto';
import { getKeysPath } from '../utils/config.js';
import { logger } from '../utils/logger.js';

interface KeysOptions {
  list?: boolean;
  export?: string;
  import?: string;
}

export async function keysCommand(options: KeysOptions): Promise<void> {
  if (options.list || (!options.export && !options.import)) {
    await listKeys();
  } else if (options.export) {
    logger.info('Export not yet implemented');
  } else if (options.import) {
    logger.info('Import not yet implemented');
  }
}

async function listKeys(): Promise<void> {
  logger.section('Registered Keys');

  const keysPath = getKeysPath();
  
  try {
    const files = await readdir(keysPath);
    const keyFiles = files.filter(f => f.endsWith('.json'));

    if (keyFiles.length === 0) {
      logger.info('No keys found');
      logger.info('Run ' + logger.code('frw init') + ' to create a key');
      return;
    }

    for (const file of keyFiles) {
      const keyData = JSON.parse(await readFile(`${keysPath}/${file}`, 'utf-8'));
      const isEncrypted = typeof keyData.privateKey === 'object';
      
      logger.info('');
      logger.info('Name: ' + logger.code(file.replace('.json', '')));
      logger.info('Public key: ' + logger.code(keyData.publicKey));
      logger.info('Protected: ' + (isEncrypted ? '✓ Yes' : '✗ No'));
    }
  } catch (error) {
    logger.error('Failed to list keys');
  }
}
