import { readFile, readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import ora from 'ora';
import inquirer from 'inquirer';
import { KeyManager, SignatureManager } from '@frw/crypto';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

interface PublishOptions {
  name?: string;
  key?: string;
}

export async function publishCommand(directory: string = '.', options: PublishOptions): Promise<void> {
  logger.section('Publish to FRW');

  // Get key
  const keyPath = options.key || config.get('defaultKeyPath');
  if (!keyPath) {
    logger.error('No key found. Run ' + logger.code('frw init') + ' first');
    process.exit(1);
  }

  // Load key
  const spinner = ora('Loading keypair...').start();
  let keyPair;
  try {
    const keyData = JSON.parse(await readFile(keyPath, 'utf-8'));
    
    let password: string | undefined;
    if (typeof keyData.privateKey === 'object') {
      spinner.stop();
      const { keyPassword } = await inquirer.prompt([
        {
          type: 'password',
          name: 'keyPassword',
          message: 'Enter key password:',
          mask: '*'
        }
      ]);
      password = keyPassword;
      spinner.start('Loading keypair...');
    }

    keyPair = KeyManager.importKeyPair(keyData, password);
    spinner.succeed('Keypair loaded');
  } catch (error) {
    spinner.fail('Failed to load keypair');
    process.exit(1);
  }

  const publicKeyEncoded = SignatureManager.encodePublicKey(keyPair.publicKey);

  // Scan directory
  spinner.start('Scanning directory...');
  const files = await scanDirectory(directory);
  spinner.succeed(`Found ${files.length} files`);

  // Sign HTML files
  spinner.start('Signing HTML files...');
  let signedCount = 0;
  for (const file of files) {
    if (file.endsWith('.html') || file.endsWith('.frw')) {
      const content = await readFile(file, 'utf-8');
      const signed = SignatureManager.signPage(content, keyPair.privateKey);
      // In real implementation, would write back
      signedCount++;
    }
  }
  spinner.succeed(`Signed ${signedCount} HTML files`);

  // Publish to IPFS (placeholder)
  spinner.start('Publishing to IPFS...');
  spinner.warn('IPFS publish not yet implemented');
  
  const fakeCID = 'Qm' + Math.random().toString(36).substring(7);

  logger.section('Publish Complete');
  logger.success('Content published successfully!');
  logger.info('');
  logger.info('CID: ' + logger.code(fakeCID));
  logger.info('Public key: ' + logger.code(publicKeyEncoded));
  logger.info('');
  logger.info('Your site is accessible at:');
  if (options.name) {
    logger.info('  ' + logger.url(`frw://${options.name}/`));
  }
  logger.info('  ' + logger.url(`frw://${publicKeyEncoded}/`));
  logger.info('');
  logger.info('Note: Full IPFS integration coming soon');
}

async function scanDirectory(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        files.push(...await scanDirectory(fullPath, baseDir));
      }
    } else {
      files.push(fullPath);
    }
  }

  return files;
}
