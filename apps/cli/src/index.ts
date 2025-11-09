#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { registerCommand } from './commands/register.js';
import { publishCommand } from './commands/publish.js';
import { verifyCommand } from './commands/verify.js';
import { serveCommand } from './commands/serve.js';
import { keysCommand } from './commands/keys.js';
import { ipfsStatusCommand } from './commands/ipfs-status.js';
import { domainAddCommand, domainVerifyCommand, domainListCommand, domainRemoveCommand, domainInfoCommand } from './commands/domain.js';
import { configureCommand, configShowCommand } from './commands/configure.js';
import { challengeCreateCommand, challengeRespondCommand, challengeStatusCommand, challengeListCommand, metricsShowCommand } from './commands/challenge.js';

const program = new Command();

program
  .name('frw')
  .description('FRW - Free Web Modern CLI')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize FRW configuration and generate keypair')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initCommand);

program
  .command('register <name>')
  .description('Register a human-readable name')
  .option('-k, --key <path>', 'Path to private key')
  .action(registerCommand);

program
  .command('publish [directory]')
  .description('Publish directory to IPFS/IPNS')
  .option('-n, --name <name>', 'Use registered name')
  .option('-k, --key <path>', 'Path to private key')
  .action(publishCommand);

program
  .command('verify <file>')
  .description('Verify FRW page signature')
  .option('-k, --key <publicKey>', 'Public key to verify against')
  .action(verifyCommand);

program
  .command('serve [directory]')
  .description('Start local preview server')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(serveCommand);

program
  .command('keys')
  .description('Manage keypairs')
  .option('-l, --list', 'List all keys')
  .option('-e, --export <name>', 'Export key')
  .option('-i, --import <file>', 'Import key')
  .action(keysCommand);

program
  .command('ipfs')
  .description('Check IPFS connection status')
  .action(ipfsStatusCommand);

// Domain management commands
const domain = program
  .command('domain')
  .description('Manage domain name mappings');

domain
  .command('add <domain> <frwName>')
  .description('Link a domain to your FRW name')
  .action(domainAddCommand);

domain
  .command('verify <domain>')
  .description('Verify domain DNS configuration')
  .action(domainVerifyCommand);

domain
  .command('list')
  .description('List all domain mappings')
  .action(domainListCommand);

domain
  .command('remove <domain>')
  .description('Remove a domain mapping')
  .action(domainRemoveCommand);

domain
  .command('info <domain>')
  .description('Show domain information')
  .action(domainInfoCommand);

// Site configuration commands
program
  .command('configure [directory]')
  .description('Configure a site with interactive prompts')
  .action(configureCommand);

program
  .command('config [directory]')
  .description('Show site configuration')
  .action(configShowCommand);

// Challenge system commands (Phase 1)
const challenge = program
  .command('challenge')
  .description('Name challenge and dispute system');

challenge
  .command('create <name>')
  .description('Challenge name ownership')
  .option('-r, --reason <reason>', 'Challenge reason')
  .option('-b, --bond <amount>', 'Bond amount')
  .option('-e, --evidence <cid>', 'Evidence IPFS CID')
  .action(challengeCreateCommand);

challenge
  .command('respond <challengeId>')
  .description('Respond to challenge')
  .option('-b, --counter-bond <amount>', 'Counter-bond amount')
  .option('-e, --evidence <cid>', 'Evidence IPFS CID')
  .action(challengeRespondCommand);

challenge
  .command('status <challengeId>')
  .description('Check challenge status')
  .action(challengeStatusCommand);

challenge
  .command('list')
  .description('List challenges')
  .option('--owner', 'Show challenges against your names')
  .option('--challenger', 'Show challenges you created')
  .action(challengeListCommand);

// Metrics commands
program
  .command('metrics <name>')
  .description('Show content metrics for name')
  .action(metricsShowCommand);

program.parse();
