import { readFile } from 'fs/promises';
import ora from 'ora';
import { KeyManager, SignatureManager } from '@frw/crypto';
import { FRWNamingSystem } from '@frw/protocol';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import inquirer from 'inquirer';
import { DNSVerifier, requiresDNSVerification, ProofOfWorkGenerator, getRequiredDifficulty } from '@frw/name-registry';
import { DistributedNameRegistry, createDistributedNameRecord } from '@frw/ipfs';

interface RegisterOptions {
  key?: string;
  verifyDns?: boolean;  // Optional: Verify DNS ownership for official status
}

export async function registerCommand(name: string, options: RegisterOptions): Promise<void> {
  logger.section(`Register Name: ${name}`);

  // Validate name format
  const nameRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
  if (!nameRegex.test(name)) {
    logger.error('Invalid name format');
    logger.info('Names must be:');
    logger.info('  - 3-63 characters');
    logger.info('  - Lowercase letters, numbers, hyphens');
    logger.info('  - Start and end with letter/number');
    process.exit(1);
  }

  // Get key path
  const keyPath = options.key || config.get('defaultKeyPath');
  if (!keyPath) {
    logger.error('No key found. Run ' + logger.code('frw init') + ' first');
    process.exit(1);
  }
  
  // Optional DNS verification for domain-like names
  const isDomainLike = requiresDNSVerification(name);
  let dnsVerified = false;
  
  if (isDomainLike && options.verifyDns) {
    logger.section('Optional DNS Verification');
    logger.info('');
    logger.info(`"${name}" appears to be a domain name or reserved brand.`);
    logger.info('Verify ownership via DNS to get "Official" status.');
    logger.info('');
    
    // Load public key for DNS instructions
    const spinner = ora('Loading keypair...').start();
    let publicKeyForDNS: string;
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
      const tempKeyPair = KeyManager.importKeyPair(keyData, password);
      publicKeyForDNS = SignatureManager.encodePublicKey(tempKeyPair.publicKey);
      spinner.succeed('Keypair loaded');
    } catch (error) {
      spinner.fail('Failed to load keypair');
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    
    // Show DNS instructions
    logger.info(logger.code('DNS Configuration:'));
    logger.info('');
    logger.info('Add this TXT record to your DNS:');
    logger.info('');
    logger.info('  Record Type: TXT');
    logger.info('  Name: _frw (or @)');
    logger.info(`  Value: frw-key=${publicKeyForDNS}`);
    logger.info('  TTL: 3600');
    logger.info('');
    logger.info('For example.com, add TXT record at:');
    logger.info('  _frw.example.com  OR  example.com');
    logger.info('');
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Ready to verify DNS?',
        default: false
      }
    ]);
    
    if (confirm) {
      // Verify DNS
      logger.info('');
      const verifySpinner = ora('Verifying DNS...').start();
      const verifier = new DNSVerifier();
      const result = await verifier.verifyDomainOwnership(name, publicKeyForDNS);
      
      if (result.verified) {
        verifySpinner.succeed('DNS verification passed');
        dnsVerified = true;
        logger.info('');
      } else {
        verifySpinner.fail('DNS verification failed');
        logger.warn('');
        if (result.error) {
          logger.warn(result.error);
        }
        logger.info('');
        logger.info('Continuing without DNS verification.');
        logger.info('You can verify later with: frw verify-dns ' + name);
        logger.info('');
      }
    } else {
      logger.info('');
      logger.info('Skipping DNS verification.');
      logger.info('You can verify later with: frw verify-dns ' + name);
      logger.info('');
    }
  }

  // Load key
  const spinner = ora('Loading keypair...').start();
  let keyPair;
  try {
    const keyData = JSON.parse(await readFile(keyPath, 'utf-8'));
    
    // Check if encrypted
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
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const publicKeyEncoded = SignatureManager.encodePublicKey(keyPair.publicKey);
  const ipnsName = `/ipns/${publicKeyEncoded}`;

  // Generate Proof of Work (anti-spam)
  logger.info('');
  logger.info('Generating Proof of Work (anti-spam protection)...');
  const difficulty = getRequiredDifficulty(name);
  logger.info(`Required difficulty: ${difficulty} leading zeros`);
  logger.info('This may take 1-60 minutes depending on name length...');
  logger.info('');
  
  const powGenerator = new ProofOfWorkGenerator();
  const powSpinner = ora('Generating proof...').start();
  const startTime = Date.now();
  
  const proof = await powGenerator.generate(name, publicKeyEncoded, difficulty);
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  
  powSpinner.succeed(`Proof of Work generated in ${elapsed} seconds`);
  logger.info(`  Nonce: ${proof.nonce}`);
  logger.info(`  Hash: ${proof.hash}`);
  logger.info('');

  // Create distributed name record
  spinner.start('Creating distributed name record...');
  const record = createDistributedNameRecord(
    name,
    publicKeyEncoded,
    '', // Content CID (empty for now, will be set on first publish)
    ipnsName,
    keyPair.privateKey,
    proof,
    365 * 24 * 60 * 60 * 1000 // 1 year expiration
  );
  spinner.succeed('Name record created');

  // Publish to distributed network (DHT + Pubsub + IPNS)
  spinner.start('Publishing to global distributed network...');
  try {
    const registry = new DistributedNameRegistry();
    await registry.registerName(record);
    spinner.succeed('✓ Published to global network!');
    logger.info('');
    logger.success('Your name is now globally resolvable!');
    logger.info('Anyone in the world can now access frw://' + name);
    logger.info('');
  } catch (error) {
    spinner.fail('Failed to publish to network');
    logger.error(error instanceof Error ? error.message : String(error));
    logger.warn('');
    logger.warn('Name saved locally but not published globally.');
    logger.warn('Make sure IPFS daemon is running: ipfs daemon');
    logger.info('');
  }

  // Save to config
  const registeredNames = config.get('registeredNames') || {};
  registeredNames[name] = publicKeyEncoded;
  config.set('registeredNames', registeredNames);

  logger.section('Registration Complete');
  logger.success(`Name "${name}" registered successfully!`);
  
  if (dnsVerified) {
    logger.success('✓ DNS Verified - Official status granted');
    logger.info('  Users will see this as the verified site');
  } else if (isDomainLike) {
    logger.warn('⚠ Not DNS verified');
    logger.info('  Users will see an unverified warning');
    logger.info('  To verify: frw verify-dns ' + name);
  }
  
  logger.info('');
  logger.info('Name: ' + logger.code(name));
  logger.info('Public key: ' + logger.code(publicKeyEncoded));
  logger.info('IPNS: ' + logger.code(ipnsName));
  
  if (dnsVerified) {
    logger.info('Status: ' + logger.code('✓ DNS Verified'));
  } else if (isDomainLike) {
    logger.info('Status: ' + logger.code('⚠ Unverified'));
  }
  
  logger.info('');
  logger.info('Your site will be accessible at:');
  logger.info('  ' + logger.url(`frw://${name}/`));
  logger.info('  ' + logger.url(`frw://${publicKeyEncoded}/`));
  logger.info('');
  logger.info('Next: Create content and run ' + logger.code('frw publish'));
}
