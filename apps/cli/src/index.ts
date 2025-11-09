#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { registerCommand } from './commands/register.js';
import { publishCommand } from './commands/publish.js';
import { verifyCommand } from './commands/verify.js';
import { serveCommand } from './commands/serve.js';
import { keysCommand } from './commands/keys.js';
import { ipfsStatusCommand } from './commands/ipfs-status.js';

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

program.parse();
