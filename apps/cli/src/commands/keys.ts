import { readdir, readFile, copyFile, stat } from 'fs/promises';
import { join, basename, resolve } from 'path';
import { SignatureManager } from '@frw/crypto';
import { getKeysPath } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

interface KeysOptions {
  list?: boolean;
  export?: string;
  import?: string;
}

export async function keysCommand(options: KeysOptions): Promise<void> {
  if (options.list || (!options.export && !options.import)) {
    await listKeys();
  } else if (options.export) {
    await exportKey(options.export);
  } else if (options.import) {
    await importKey(options.import);
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
      const isEncrypted = typeof keyData.privateKey === 'object' || keyData.encrypted;
      const isV2 = !!keyData.did;
      
      logger.info('');
      logger.info(`Name: ${logger.code(file.replace('.json', ''))} ${isV2 ? chalk.cyan('(V2)') : chalk.dim('(V1)')}`);
      if (isV2) {
        logger.info('DID: ' + logger.code(keyData.did));
      } else {
        logger.info('Public key: ' + logger.code(keyData.publicKey));
      }
      logger.info('Protected: ' + (isEncrypted ? '✓ Yes' : '✗ No'));
    }
  } catch (error) {
    logger.error('Failed to list keys');
  }
}

async function exportKey(name: string): Promise<void> {
  const keysPath = getKeysPath();
  // Handle case where user provides 'mykey' or 'mykey.json'
  const fileName = name.endsWith('.json') ? name : `${name}.json`;
  const sourcePath = join(keysPath, fileName);
  
  try {
    await stat(sourcePath);
  } catch {
    logger.error(`Key "${name}" not found.`);
    return;
  }

  // Export to current directory by default
  const targetPath = resolve(process.cwd(), fileName);
  
  try {
    await copyFile(sourcePath, targetPath);
    logger.success(`Key exported to: ${logger.code(targetPath)}`);
    logger.warn('Keep this file safe! It contains your private key.');
  } catch (error) {
    logger.error(`Failed to export key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function importKey(path: string): Promise<void> {
  const keysPath = getKeysPath();
  const sourcePath = resolve(process.cwd(), path);
  const fileName = basename(sourcePath);
  const targetPath = join(keysPath, fileName);

  try {
    // Verify it's a valid key file
    const content = await readFile(sourcePath, 'utf-8');
    const keyData = JSON.parse(content);
    
    if (!keyData.privateKey && !keyData.privateKey_dilithium3) {
      throw new Error('Invalid key file format');
    }

    await copyFile(sourcePath, targetPath);
    logger.success(`Key imported successfully: ${logger.code(fileName.replace('.json', ''))}`);
  } catch (error) {
    logger.error(`Failed to import key: ${error instanceof Error ? error.message : String(error)}`);
  }
}
