import ora from 'ora';
import { IPFSClient } from '@frw/ipfs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export async function ipfsStatusCommand(): Promise<void> {
  logger.section('IPFS Connection Status');

  const spinner = ora('Checking IPFS connection...').start();
  
  const ipfsClient = new IPFSClient({
    host: config.get('ipfsHost') || 'localhost',
    port: config.get('ipfsPort') || 5001,
    protocol: 'http'
  });

  try {
    await ipfsClient.init();
    const info = await ipfsClient.getNodeInfo();
    spinner.succeed('Connected to IPFS');
    
    logger.info('');
    logger.info('Node Info:');
    if (typeof info === 'object' && info !== null) {
      const nodeInfo = info as Record<string, unknown>;
      logger.info('  ID: ' + logger.code(String(nodeInfo.id || 'unknown')));
      logger.info('  Agent: ' + (nodeInfo.agentVersion || 'unknown'));
      logger.info('  Protocol: ' + (nodeInfo.protocolVersion || 'unknown'));
    }
    
    logger.info('');
    logger.info('Connection:');
    logger.info('  Host: ' + config.get('ipfsHost'));
    logger.info('  Port: ' + config.get('ipfsPort'));
    logger.info('  URL: ' + logger.url(`http://${config.get('ipfsHost')}:${config.get('ipfsPort')}`));
    
  } catch (error) {
    spinner.fail('Failed to connect to IPFS');
    logger.error('');
    logger.error('IPFS daemon is not running or not accessible');
    logger.info('');
    logger.info('To start IPFS:');
    logger.info('  1. Install IPFS: https://docs.ipfs.tech/install/');
    logger.info('  2. Initialize: ' + logger.code('ipfs init'));
    logger.info('  3. Start daemon: ' + logger.code('ipfs daemon'));
    logger.info('');
    logger.info('Or install IPFS Desktop for easier setup');
    process.exit(1);
  }
}
