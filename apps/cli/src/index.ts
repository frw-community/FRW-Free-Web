#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { initV2Command } from './commands/init-v2.js';
import { publishCommand } from './commands/publish.js';
import { verifyCommand } from './commands/verify.js';
import { serveCommand } from './commands/serve.js';
import { keysCommand } from './commands/keys.js';
import { registerCommand } from './commands/register.js';
import { registerV2Command } from './commands/register-v2.js';
import { migrateV2Command } from './commands/migrate-v2.js';
import { verifyDnsCommand } from './commands/verify-dns.js';
import { ipfsStatusCommand } from './commands/ipfs-status.js';
import { 
  challengeCreateCommand,
  challengeRespondCommand,
  challengeStatusCommand,
  challengeListCommand,
  metricsShowCommand
} from './commands/challenge.js';
import { configureCommand, configShowCommand } from './commands/configure.js';
import { domainAddCommand, domainVerifyCommand, domainListCommand, domainRemoveCommand, domainInfoCommand } from './commands/domain.js';
import { bootstrapRegistryCommand } from './commands/bootstrap-registry.js';
import { lookupCommand, listNamesCommand, infoCommand } from './commands/lookup.js';

const program = new Command();

// Version info
const VERSION = '1.0.0';

program
  .name('frw')
  .description(chalk.bold('FRW - Free Resilient Web CLI') + '\n' +
    'Publish and browse a censorship-resistant, cryptographically-verified web.\n\n' +
    chalk.dim('Examples:') + '\n' +
    '  $ frw init                         # Initialize FRW configuration\n' +
    '  $ frw init-v2                      # Initialize V2 quantum-resistant identity\n' +
    '  $ frw register myname              # Register a human-readable name\n' +
    '  $ frw register-v2 myname           # Register with V2 (quantum-resistant)\n' +
    '  $ frw migrate myname               # Upgrade V1 name to V2 (preserves content)\n' +
    '  $ frw publish ./my-site --name myname  # Publish your site\n' +
    '  $ frw lookup myname                # Look up a name in the registry\n' +
    '  $ frw list                         # List all registered names\n\n' +
    chalk.dim('Learn more:') + ' https://github.com/frw-community/FRW-Free-Web'
  )
  .version(VERSION, '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText('after', '\n' + 
    chalk.dim('Need help? Report issues at:') + '\n' +
    chalk.cyan('https://github.com/frw-community/FRW-Free-Web/issues')
  );

program
  .command('init')
  .description('Initialize FRW configuration and generate keypair')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(initCommand);

program
  .command('init-v2')
  .description('Initialize V2 quantum-resistant identity (Dilithium3)')
  .option('-f, --force', 'Overwrite existing V2 keypair')
  .action(initV2Command);

program
  .command('register <name>')
  .description('Register a human-readable name')
  .option('-k, --key <path>', 'Path to private key')
  .option('--verify-dns', 'Verify DNS ownership for official status')
  .action(registerCommand);

program
  .command('register-v2 <name>')
  .description('Register name with V2 quantum-resistant signature (Dilithium3)')
  .option('-k, --key <path>', 'Path to V2 private key')
  .action(registerV2Command);

program
  .command('migrate <name>')
  .description('Migrate V1 name to V2 quantum-resistant (preserves content)')
  .option('--v1-key <path>', 'Path to V1 private key')
  .option('--v2-key <path>', 'Path to V2 private key')
  .option('-f, --force', 'Force re-migration')
  .action(migrateV2Command);

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

program
  .command('verify-dns <name>')
  .description('Verify DNS ownership for official status')
  .action(verifyDnsCommand);

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

// Admin commands
program
  .command('bootstrap-registry')
  .description('[ADMIN] Bootstrap global FRW registry (run once)')
  .option('--ipfs <url>', 'IPFS API URL', 'http://localhost:5001')
  .option('--save', 'Save configuration to file')
  .action(bootstrapRegistryCommand);

// Name lookup and inspection commands
program
  .command('lookup <name>')
  .description('Look up a name in the registry')
  .action(lookupCommand);

program
  .command('resolve <name>')
  .description('Alias for lookup')
  .action(lookupCommand);

program
  .command('get <name>')
  .description('Alias for lookup')
  .action(lookupCommand);

program
  .command('list')
  .description('List all registered names')
  .action(listNamesCommand);

program
  .command('info <name>')
  .description('Show detailed information about a name')
  .action(infoCommand);

// Global error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n✗ Fatal error:'), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  } else {
    console.error(chalk.dim('\nRun with DEBUG=1 for full error details'));
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  console.error(chalk.red('\n✗ Unhandled promise rejection:'), reason?.message || reason);
  if (process.env.DEBUG) {
    console.error(reason?.stack || reason);
  } else {
    console.error(chalk.dim('\nRun with DEBUG=1 for full error details'));
  }
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nInterrupted by user'));
  process.exit(0);
});

// Parse arguments
program.parse();
