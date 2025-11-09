import { readFile } from 'fs/promises';
import ora from 'ora';
import { KeyManager, SignatureManager } from '@frw/crypto';
import { FRWNamingSystem } from '@frw/protocol';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import inquirer from 'inquirer';
import { DNSVerifier, requiresDNSVerification } from '@frw/name-registry';

interface RegisterOptions {
  key?: string;
  skipDns?: boolean;  // For testing only
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
  
  // Check if DNS verification required
  const needsDNS = requiresDNSVerification(name);
  let dnsVerified = false;
  
  if (needsDNS && !options.skipDns) {
    logger.section('DNS Verification Required');
    logger.info('');
    logger.warn(`"${name}" requires DNS verification to prevent squatting`);
    logger.info('');
    logger.info('This name is either:');
    logger.info('  - A domain name (e.g., example.com)');
    logger.info('  - A reserved brand name (e.g., google, microsoft)');
    logger.info('');
    logger.info('You must prove ownership via DNS TXT record.');
    logger.info('');
    
    // Load public key first to show in instructions
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
    logger.info(logger.code('Required DNS Configuration:'));
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
        message: 'Have you added the DNS TXT record?',
        default: false
      }
    ]);
    
    if (!confirm) {
      logger.info('');
      logger.info('Registration cancelled. Add the DNS record and try again.');
      process.exit(0);
    }
    
    // Verify DNS
    logger.info('');
    const verifySpinner = ora('Verifying DNS...').start();
    const verifier = new DNSVerifier();
    const result = await verifier.verifyDomainOwnership(name, publicKeyForDNS);
    
    if (!result.verified) {
      verifySpinner.fail('DNS verification failed');
      logger.error('');
      if (result.error) {
        logger.error(result.error);
      }
      if (result.dnsKey && result.dnsKey !== publicKeyForDNS) {
        logger.error('DNS public key does not match:');
        logger.error(`  Expected: ${publicKeyForDNS}`);
        logger.error(`  Found:    ${result.dnsKey}`);
      }
      logger.info('');
      logger.info('Please check:');
      logger.info('  1. DNS record is correctly added');
      logger.info('  2. DNS has propagated (wait 5-10 minutes)');
      logger.info('  3. Public key matches exactly');
      logger.info('');
      logger.info('Test DNS manually:');
      logger.info(`  dig _frw.${name} TXT`);
      logger.info(`  nslookup -type=TXT _frw.${name}`);
      process.exit(1);
    }
    
    verifySpinner.succeed('DNS verification passed');
    dnsVerified = true;
    logger.info('');
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

  // Create name record
  spinner.start('Creating name record...');
  const namingSystem = new FRWNamingSystem();
  const ipnsName = `/ipns/${publicKeyEncoded}`;
  
  const record = namingSystem.createNameRecord(
    name,
    publicKeyEncoded,
    ipnsName,
    keyPair.privateKey,
    {
      description: `FRW site for ${name}`,
    }
  );
  spinner.succeed('Name record created');

  // Publish to DHT (placeholder - requires IPFS)
  spinner.start('Publishing to network...');
  try {
    await namingSystem.publishNameRecord(record);
    spinner.succeed('Published to network');
  } catch (error) {
    spinner.warn('Network publish not yet implemented');
    logger.debug('Name record created locally');
  }

  // Save to config
  const registeredNames = config.get('registeredNames') || {};
  registeredNames[name] = publicKeyEncoded;
  config.set('registeredNames', registeredNames);

  logger.section('Registration Complete');
  logger.success(`Name "${name}" registered successfully!`);
  if (dnsVerified) {
    logger.success('✓ DNS verified - Protected from squatting');
  }
  logger.info('');
  logger.info('Name: ' + logger.code(name));
  logger.info('Public key: ' + logger.code(publicKeyEncoded));
  logger.info('IPNS: ' + logger.code(ipnsName));
  logger.info('');
  logger.info('Your site will be accessible at:');
  logger.info('  ' + logger.url(`frw://${name}/`));
  logger.info('  ' + logger.url(`frw://${publicKeyEncoded}/`));
  logger.info('');
  logger.info('Next: Create content and run ' + logger.code('frw publish'));
}
