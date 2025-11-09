import { readFile, writeFile } from 'fs/promises';
import ora from 'ora';
import { SignatureManager } from '@frw/crypto';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import dns from 'dns/promises';

interface DomainMapping {
  domain: string;
  frwName: string;
  publicKey: string;
  verified: boolean;
  addedAt: string;
  lastChecked?: string;
}

export async function domainAddCommand(domain: string, frwName: string): Promise<void> {
  logger.section(`Add Domain: ${domain}`);

  // Validate domain format
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
  if (!domainRegex.test(domain.toLowerCase())) {
    logger.error('Invalid domain format');
    process.exit(1);
  }

  // Get registered names
  const registeredNames: Record<string, string> = config.get('registeredNames') || {};
  const publicKey = registeredNames[frwName];

  if (!publicKey) {
    logger.error(`Name "${frwName}" is not registered`);
    logger.info('Register it first: ' + logger.code(`frw register ${frwName}`));
    process.exit(1);
  }

  // Get or create domain mappings
  const domainMappings: Record<string, DomainMapping> = config.get('domainMappings') || {};

  // Add domain mapping
  const mapping: DomainMapping = {
    domain: domain.toLowerCase(),
    frwName,
    publicKey,
    verified: false,
    addedAt: new Date().toISOString(),
  };

  domainMappings[domain.toLowerCase()] = mapping;
  config.set('domainMappings', domainMappings);

  logger.success(`Domain "${domain}" linked to "${frwName}"`);
  logger.info('');

  // Generate DNS record instructions
  logger.section('DNS Configuration Required');
  logger.info('Add the following TXT record to your DNS:');
  logger.info('');
  logger.info('Type:  ' + logger.code('TXT'));
  logger.info('Name:  ' + logger.code('_frw') + ' or ' + logger.code('@'));
  logger.info('Value: ' + logger.code(`frw-key=${publicKey};frw-name=${frwName}`));
  logger.info('TTL:   ' + logger.code('3600'));
  logger.info('');

  logger.info('After adding the DNS record, verify with:');
  logger.info('  ' + logger.code(`frw domain verify ${domain}`));
}

export async function domainVerifyCommand(domain: string): Promise<void> {
  logger.section(`Verify Domain: ${domain}`);

  const domainMappings: Record<string, DomainMapping> = config.get('domainMappings') || {};
  const mapping = domainMappings[domain.toLowerCase()];

  if (!mapping) {
    logger.error(`Domain "${domain}" not found`);
    logger.info('Add it first: ' + logger.code(`frw domain add ${domain} <name>`));
    process.exit(1);
  }

  const spinner = ora('Checking DNS records...').start();

  try {
    // Query DNS TXT records
    const records = await dns.resolveTxt(domain);
    const frwRecords = records
      .flat()
      .filter(record => record.includes('frw-key=') || record.includes('frw-name='));

    if (frwRecords.length === 0) {
      spinner.fail('No FRW DNS records found');
      logger.info('');
      logger.info('Expected TXT record:');
      logger.info(`  frw-key=${mapping.publicKey};frw-name=${mapping.frwName}`);
      process.exit(1);
    }

    // Parse FRW record
    const frwRecord = frwRecords[0];
    const keyMatch = frwRecord.match(/frw-key=([^;]+)/);
    const nameMatch = frwRecord.match(/frw-name=([^;]+)/);

    if (!keyMatch || !nameMatch) {
      spinner.fail('Invalid FRW DNS record format');
      process.exit(1);
    }

    const dnsKey = keyMatch[1];
    const dnsName = nameMatch[1];

    // Verify key and name match
    if (dnsKey !== mapping.publicKey) {
      spinner.fail('Public key mismatch');
      logger.error(`Expected: ${mapping.publicKey}`);
      logger.error(`Found:    ${dnsKey}`);
      process.exit(1);
    }

    if (dnsName !== mapping.frwName) {
      spinner.fail('Name mismatch');
      logger.error(`Expected: ${mapping.frwName}`);
      logger.error(`Found:    ${dnsName}`);
      process.exit(1);
    }

    // Mark as verified
    mapping.verified = true;
    mapping.lastChecked = new Date().toISOString();
    domainMappings[domain.toLowerCase()] = mapping;
    config.set('domainMappings', domainMappings);

    spinner.succeed('Domain verified successfully!');
    logger.info('');
    logger.success(`✓ ${domain} → frw://${mapping.frwName}/`);
    logger.info('');
    logger.info('Your site is now accessible at both:');
    logger.info('  • ' + logger.url(`https://${domain}`));
    logger.info('  • ' + logger.url(`frw://${mapping.frwName}/`));

  } catch (error: any) {
    spinner.fail('DNS verification failed');
    
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      logger.error('DNS record not found');
      logger.info('Make sure you have added the TXT record and it has propagated');
      logger.info('DNS propagation can take up to 48 hours');
    } else {
      logger.error(error.message);
    }
    process.exit(1);
  }
}

export async function domainListCommand(): Promise<void> {
  logger.section('Domain Mappings');

  const domainMappings: Record<string, DomainMapping> = config.get('domainMappings') || {};
  const domains = Object.values(domainMappings) as DomainMapping[];

  if (domains.length === 0) {
    logger.info('No domains configured');
    logger.info('');
    logger.info('Add a domain: ' + logger.code('frw domain add example.com myname'));
    return;
  }

  logger.info('');
  for (const mapping of domains) {
    const status = mapping.verified ? '✓' : '⚠';
    const statusColor = mapping.verified ? 'success' : 'warn';
    
    logger.info(`${status} ${mapping.domain}`);
    logger.info(`  → frw://${mapping.frwName}/`);
    logger.info(`  Status: ${mapping.verified ? 'Verified' : 'Not verified'}`);
    
    if (!mapping.verified) {
      logger.info(`  Action: Run ${logger.code(`frw domain verify ${mapping.domain}`)}`);
    }
    logger.info('');
  }
}

export async function domainRemoveCommand(domain: string): Promise<void> {
  logger.section(`Remove Domain: ${domain}`);

  const domainMappings: Record<string, DomainMapping> = config.get('domainMappings') || {};
  
  if (!domainMappings[domain.toLowerCase()]) {
    logger.error(`Domain "${domain}" not found`);
    process.exit(1);
  }

  delete domainMappings[domain.toLowerCase()];
  config.set('domainMappings', domainMappings);

  logger.success(`Domain "${domain}" removed`);
}

export async function domainInfoCommand(domain: string): Promise<void> {
  logger.section(`Domain Info: ${domain}`);

  const domainMappings: Record<string, DomainMapping> = config.get('domainMappings') || {};
  const mapping = domainMappings[domain.toLowerCase()];

  if (!mapping) {
    logger.error(`Domain "${domain}" not found`);
    process.exit(1);
  }

  logger.info('');
  logger.info('Domain:     ' + logger.code(mapping.domain));
  logger.info('FRW Name:   ' + logger.code(mapping.frwName));
  logger.info('Public Key: ' + logger.code(mapping.publicKey));
  logger.info('Status:     ' + (mapping.verified ? '✓ Verified' : '⚠ Not verified'));
  logger.info('Added:      ' + new Date(mapping.addedAt).toLocaleString());
  
  if (mapping.lastChecked) {
    logger.info('Last Check: ' + new Date(mapping.lastChecked).toLocaleString());
  }

  logger.info('');
  logger.info('URLs:');
  logger.info('  • ' + logger.url(`https://${mapping.domain}`));
  logger.info('  • ' + logger.url(`frw://${mapping.frwName}/`));
  logger.info('  • ' + logger.url(`frw://${mapping.publicKey}/`));
}
