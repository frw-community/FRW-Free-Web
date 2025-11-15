// Verify DNS Ownership Command
// Adds official verification status to registered names

import { readFile } from 'fs/promises';
import ora from 'ora';
import { DNSVerifier } from '@frw/name-registry';
import { KeyManager, SignatureManager } from '@frw/crypto';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';

export async function verifyDnsCommand(name: string): Promise<void> {
  logger.section(`Verify DNS Ownership: ${name}`);

  // Check if name is registered locally
  const registrations = config.get('registrations') || {};
  const registration = registrations[name];
  
  if (!registration) {
    logger.error(`Name '${name}' not found in local registrations.`);
    logger.info('');
    logger.info('You can only verify names you have registered.');
    logger.info(`Run ${logger.code(`frw register ${name}`)} first.`);
    process.exit(1);
  }
  
  // Get key path
  const keyPath = config.get('defaultKeyPath');
  if (!keyPath) {
    logger.error('No key found. Run ' + logger.code('frw init') + ' first');
    process.exit(1);
  }

  // Load keypair
  const spinner = ora('Loading keypair...').start();
  let publicKey: string;
  
  try {
    const keyData = JSON.parse(await readFile(keyPath as string, 'utf-8'));
    const keyPair = KeyManager.importKeyPair(keyData);
    publicKey = SignatureManager.encodePublicKey(keyPair.publicKey);
    spinner.succeed('Keypair loaded');
  } catch (error) {
    spinner.fail('Failed to load keypair');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Show DNS instructions
  logger.info('');
  logger.info('To verify ownership, add this DNS TXT record:');
  logger.info('');
  logger.info('  Record Type: TXT');
  logger.info('  Name: _frw (recommended) or @ (root)');
  logger.info(`  Value: frw-key=${publicKey}`);
  logger.info('  TTL: 3600');
  logger.info('');
  logger.info('Examples:');
  logger.info(`  _frw.${name}  →  "frw-key=${publicKey}"`);
  logger.info(`  ${name}       →  "frw-key=${publicKey}"`);
  logger.info('');
  logger.info('DNS propagation may take 5-10 minutes.');
  logger.info('');

  // Verify DNS
  const verifySpinner = ora('Verifying DNS...').start();
  const verifier = new DNSVerifier();
  
  try {
    const result = await verifier.verifyDomainOwnership(name, publicKey);
    
    if (result.verified) {
      verifySpinner.succeed('DNS verification successful!');
      
      // Save verification status to config
      const registrations = config.get('registrations') || {};
      registrations[name] = {
        ...registrations[name],
        dnsVerified: true,
        dnsVerifiedAt: Date.now(),
        domain: name
      };
      config.set('registrations', registrations);
      
      logger.info('');
      logger.success('✓ Domain ownership confirmed');
      logger.success('✓ Official status granted');
      logger.success('✓ Verification saved locally');
      logger.info('');
      logger.info('Your site will now show as verified:');
      logger.info('  frw://' + name + '/ ✓ Verified');
      logger.info('');
      logger.info('Next step: Publish your site to propagate the verification.');
      logger.info(`  ${logger.code(`frw publish ./your-site --name ${name}`)}`);
      
    } else {
      verifySpinner.fail('DNS verification failed');
      logger.error('');
      
      if (result.error) {
        logger.error('Error: ' + result.error);
      }
      
      if (result.dnsKey && result.dnsKey !== publicKey) {
        logger.error('DNS public key mismatch:');
        logger.error(`  Expected: ${publicKey}`);
        logger.error(`  Found:    ${result.dnsKey}`);
        logger.info('');
        logger.info('Make sure the DNS record contains the correct public key.');
      }
      
      logger.info('');
      logger.info('Troubleshooting:');
      logger.info('  1. Check DNS record is correctly added');
      logger.info('  2. Wait 5-10 minutes for DNS propagation');
      logger.info('  3. Verify public key matches exactly');
      logger.info('');
      logger.info('Test DNS manually:');
      logger.info(`  dig _frw.${name} TXT +short`);
      logger.info(`  nslookup -type=TXT _frw.${name}`);
      logger.info('');
      
      process.exit(1);
    }
    
  } catch (error) {
    verifySpinner.fail('DNS verification error');
    logger.error('');
    logger.error(error instanceof Error ? error.message : String(error));
    logger.info('');
    logger.info('DNS verification failed. Check your DNS configuration.');
    process.exit(1);
  }
}
