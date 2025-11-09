import { readFile, readdir, stat, writeFile } from 'fs/promises';
import { join, relative, basename } from 'path';
import ora from 'ora';
import inquirer from 'inquirer';
import { KeyManager, SignatureManager } from '@frw/crypto';
import { IPFSClient } from '@frw/ipfs';
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
  const signedFiles: Array<{ path: string; content: Buffer }> = [];
  
  for (const filePath of files) {
    const relativePath = relative(directory, filePath);
    
    if (filePath.endsWith('.html') || filePath.endsWith('.frw')) {
      const content = await readFile(filePath, 'utf-8');
      const signed = SignatureManager.signPage(content, keyPair.privateKey);
      signedFiles.push({
        path: relativePath,
        content: Buffer.from(signed, 'utf-8')
      });
      signedCount++;
    } else {
      // Include other files as-is
      const content = await readFile(filePath);
      signedFiles.push({
        path: relativePath,
        content
      });
    }
  }
  spinner.succeed(`Signed ${signedCount} HTML files`);

  // Connect to IPFS
  spinner.start('Connecting to IPFS...');
  const ipfsClient = new IPFSClient({
    host: config.get('ipfsHost') || 'localhost',
    port: config.get('ipfsPort') || 5001,
    protocol: 'http'
  });

  try {
    await ipfsClient.init();
    spinner.succeed('Connected to IPFS');
  } catch (error) {
    spinner.fail('Failed to connect to IPFS');
    logger.error('Make sure IPFS daemon is running: ' + logger.code('ipfs daemon'));
    logger.info('Or install IPFS Desktop: https://docs.ipfs.tech/install/');
    process.exit(1);
  }

  // Publish to IPFS
  spinner.start('Publishing to IPFS...');
  let rootCID: string;
  try {
    rootCID = await ipfsClient.addDirectory(signedFiles);
    spinner.succeed('Published to IPFS');
  } catch (error) {
    spinner.fail('IPFS publish failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Pin content
  spinner.start('Pinning content...');
  try {
    await ipfsClient.pin(rootCID);
    spinner.succeed('Content pinned');
  } catch (error) {
    spinner.warn('Pinning failed, content may not persist');
  }

  // Publish to IPNS
  spinner.start('Publishing to IPNS...');
  let ipnsName: string | undefined;
  try {
    ipnsName = await ipfsClient.publishName(rootCID);
    spinner.succeed('Published to IPNS');
  } catch (error) {
    spinner.warn('IPNS publish failed');
    logger.debug('You can still access via CID');
  }

  // Display results
  logger.section('Publish Complete');
  logger.success('Content published successfully!');
  logger.info('');
  logger.info('IPFS CID: ' + logger.code(rootCID));
  if (ipnsName) {
    logger.info('IPNS Name: ' + logger.code(ipnsName));
  }
  logger.info('Public Key: ' + logger.code(publicKeyEncoded));
  logger.info('');
  logger.info('Your site is accessible at:');
  if (options.name) {
    logger.info('  ' + logger.url(`frw://${options.name}/`));
  }
  logger.info('  ' + logger.url(`frw://${publicKeyEncoded}/`));
  logger.info('  ' + logger.url(`https://ipfs.io/ipfs/${rootCID}/`));
  if (ipnsName) {
    logger.info('  ' + logger.url(`https://ipfs.io/ipns/${ipnsName}/`));
  }
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
