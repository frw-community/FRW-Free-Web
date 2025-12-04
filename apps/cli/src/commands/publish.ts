import { readFile, readdir, stat, writeFile } from 'fs/promises';
import { join, relative, basename } from 'path';
import ora from 'ora';
import inquirer from 'inquirer';
import { KeyManager, SignatureManager } from '@frw/crypto';
import { KeyManagerV2, SignatureManagerV2 } from '@frw/crypto-pq';
import { IPFSClient } from '@frw/ipfs';
import { createRecordV2, toJSON } from '@frw/protocol-v2';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { BOOTSTRAP_NODES } from '../utils/constants.js';

interface PublishOptions {
  name?: string;
  key?: string;
}

export async function publishCommand(directory: string = '.', options: PublishOptions): Promise<void> {
  logger.section('Publish to FRW');

  // Detect if publishing to V2 name
  let isV2 = false;
  if (options.name) {
    const registeredV2Names: Record<string, string> = config.get('registeredV2Names') || {};
    isV2 = !!registeredV2Names[options.name];
  }

  // Get key (V2 or V1)
  let keyPath = options.key;
  if (!keyPath) {
    keyPath = isV2 ? config.get('defaultKeyPathV2') : config.get('defaultKeyPath');
  }
  if (!keyPath) {
    logger.error(`No ${isV2 ? 'V2' : ''} key found. Run ${logger.code(isV2 ? 'frw init-v2' : 'frw init')} first`);
    process.exit(1);
  }

  // Load key
  const spinner = ora(isV2 ? 'Loading V2 keypair...' : 'Loading keypair...').start();
  let keyPair: any;
  let keyPairV2: any;
  let publicKeyEncoded: string;
  
  try {
    const keyData = JSON.parse(await readFile(keyPath, 'utf-8'));
    
    let password: string | undefined;
    if (typeof keyData.privateKey === 'object' || typeof keyData.privateKey_ed25519 === 'object') {
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
      spinner.start(isV2 ? 'Loading V2 keypair...' : 'Loading keypair...');
    }

    if (isV2) {
      const keyManager = new KeyManagerV2();
      keyPairV2 = keyManager.importKeyPair(keyData, password);
      publicKeyEncoded = keyPairV2.did;
      spinner.succeed('V2 Keypair loaded');
    } else {
      keyPair = KeyManager.importKeyPair(keyData, password);
      publicKeyEncoded = SignatureManager.encodePublicKey(keyPair.publicKey);
      spinner.succeed('Keypair loaded');
    }
  } catch (error) {
    spinner.fail('Failed to load keypair');
    process.exit(1);
  }

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
      let signed: string;
      
      if (isV2) {
        // V2 signing with Dilithium3
        const signatureManager = new SignatureManagerV2();
        const signature = signatureManager.signString(content, keyPairV2);
        // Inject V2 signature into HTML
        signed = content.replace('</head>', `
<meta name="frw-version" content="2">
<meta name="frw-did" content="${keyPairV2.did}">
<meta name="frw-signature-dilithium3" content="${Buffer.from(signature.signature_dilithium3).toString('base64')}">
<meta name="frw-signature-ed25519" content="${Buffer.from(signature.signature_ed25519).toString('base64')}">
</head>`);
      } else {
        logger.error('V1 publishing is deprecated. Please register a V2 name using "frw register <name>".');
        process.exit(1);
      }
      
      signedFiles.push({
        path: relativePath,
        content: Buffer.from(signed!, 'utf-8')
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
      // Detect if V2 name
      const registeredV2Names: Record<string, any> = config.get('registeredV2Names') || {};
      const isV2 = !!registeredV2Names[options.name];
      
      if (isV2) {
        // V2 publishing - create and submit V2 record
        const v2Registrations: Record<string, any> = config.get('v2Registrations') || {};
        const registration = v2Registrations[options.name];
        
        if (!registration || !registration.pow) {
          spinner.fail(`V2 registration incomplete. Run: frw register-v2 ${options.name}`);
        } else {
          // Convert config PoW format to ProofOfWorkV2 format
          const pow = registration.pow;
          const proofV2 = {
            version: 2 as const,
            nonce: BigInt(pow.nonce),
            timestamp: pow.timestamp,
            hash: Buffer.from(pow.hash, 'hex'),
            difficulty: pow.leading_zeros,
            memory_cost_mib: pow.memory_mib,
            time_cost: pow.iterations,
            parallelism: 4
          };
          
          // Create V2 record with updated content CID
          const recordV2 = createRecordV2(
            options.name,
            rootCID,
            ipnsName || `/ipns/${publicKeyEncoded}`,
            keyPairV2!,
            proofV2
          );
          
          // Submit to V2 bootstrap endpoints
          const nodes = BOOTSTRAP_NODES;
          
          // Use official protocol serialization
          const recordJSON = toJSON(recordV2);
          
          spinner.text = `Pushing to ${nodes.length} bootstrap nodes...`;
          
          const pushPromises = nodes.map(async (node) => {
            try {
              const response = await fetch(`${node}/api/submit/v2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: recordJSON,
                signal: AbortSignal.timeout(5000)
              });
              
              if (response.ok) {
                return true;
              } else {
                const errorText = await response.text();
                logger.debug(`Bootstrap node ${node} rejected V2 record: ${errorText}`);
                return false;
              }
            } catch (err) {
              logger.debug(`Bootstrap node ${node} unreachable: ${err}`);
              return false;
            }
          });

          const results = await Promise.all(pushPromises);
          const successCount = results.filter(s => s).length;

          if (successCount > 0) {
            spinner.succeed(`V2 registry updated on ${successCount}/${nodes.length} nodes`);
          } else {
            spinner.warn('V2 registry update failed - content still published to IPFS');
          }
        }
      } else {
        logger.error('V1 publishing is deprecated. Please register a V2 name using "frw register <name>".');
        process.exit(1);
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
