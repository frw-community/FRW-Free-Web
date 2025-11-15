import { readFile, readdir, stat, writeFile } from 'fs/promises';
import { join, relative, basename } from 'path';
import ora from 'ora';
import inquirer from 'inquirer';
import { KeyManager, SignatureManager } from '@frw/crypto';
import { IPFSClient, DistributedNameRegistry, createDistributedNameRecord } from '@frw/ipfs';
import { ProofOfWorkGenerator, getRequiredDifficulty } from '@frw/name-registry';
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
  const ipfsHost = config.get('ipfsHost') || '127.0.0.1';
  const ipfsPort = config.get('ipfsPort') || 5001;
  const ipfsUrl = `http://${ipfsHost}:${ipfsPort}`;
  
  spinner.start(`Connecting to IPFS at ${ipfsUrl}...`);
  const ipfsClient = new IPFSClient({
    host: ipfsHost,
    port: ipfsPort,
    protocol: 'http'
  });

  try {
    await ipfsClient.init();
    spinner.succeed(`Connected to IPFS at ${ipfsUrl}`);
  } catch (error) {
    spinner.fail('Failed to connect to IPFS');
    logger.error('Connection details:');
    logger.error('  URL: ' + ipfsUrl);
    logger.error('  Error: ' + (error instanceof Error ? error.message : String(error)));
    if (error && typeof error === 'object' && 'details' in error) {
      logger.error('  Details: ' + JSON.stringify(error.details, null, 2));
    }
    if (error instanceof Error && error.stack) {
      logger.debug('Stack: ' + error.stack);
    }
    logger.error('');
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

  // Update distributed registry if name specified
  if (options.name) {
    spinner.start('Updating name registry...');
    try {
      // Get registered name info from config
      const registeredNames = config.get('registeredNames') || {};
      if (!registeredNames[options.name]) {
        spinner.warn(`Name "${options.name}" not registered. Run: frw register ${options.name}`);
      } else {
        // Create updated record with new contentCID
        const ipnsKey = `/ipns/${publicKeyEncoded}`;
        const record = createDistributedNameRecord(
          options.name,
          publicKeyEncoded,
          rootCID, // NEW contentCID
          ipnsKey,
          keyPair.privateKey,
          { nonce: 0, hash: '', difficulty: 0, timestamp: Date.now() }, // Dummy PoW for update
          365 * 24 * 60 * 60 * 1000
        );
        
        // Submit to bootstrap nodes
        const registry = new DistributedNameRegistry({
          bootstrapNodes: [
            'http://83.228.214.189:3100',  // Swiss Bootstrap #1
            'http://83.228.213.45:3100',   // Swiss Bootstrap #2
            'http://83.228.213.240:3100',  // Swiss Bootstrap #3
            'http://83.228.214.72:3100',   // Swiss Bootstrap #4
            'http://localhost:3100'         // Local dev
          ]
        });
        
        // Use direct submission (simpler than updateContent which needs resolution)
        const nodes = [
          'http://83.228.214.189:3100',
          'http://83.228.213.45:3100',
          'http://83.228.213.240:3100',
          'http://83.228.214.72:3100'
        ];
        for (const node of nodes) {
          try {
            const response = await fetch(`${node}/api/submit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(record)
            });
            if (response.ok) {
              spinner.succeed('Name registry updated');
              break;
            }
          } catch (err) {
            // Continue to next node
          }
        }
      }
    } catch (error) {
      spinner.warn('Registry update failed');
      logger.debug(error instanceof Error ? error.message : String(error));
    }
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
