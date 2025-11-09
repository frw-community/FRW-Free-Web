// Phase 1: Challenge CLI Commands

import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import ora from 'ora';
import path from 'path';
import os from 'os';
import { MetricsCollector, MetricsDatabase } from '@frw/name-registry';

export async function challengeCreateCommand(
    name: string,
    options: {
        reason: string;
        bond: string;
        evidence?: string;
    }
): Promise<void> {
    logger.section(`Create Challenge: ${name}`);
    
    const spinner = ora('Creating challenge...').start();
    
    try {
        // Initialize system
        const frwDir = (config.get('frwDir') as string) || path.join(os.homedir(), '.frw');
        const dbPath = path.join(frwDir, 'metrics.db');
        const db = new MetricsDatabase(dbPath);
        
        const ipfsApi = process.env.FRW_IPFS_API || 'http://127.0.0.1:5001';
        const collector = new MetricsCollector(ipfsApi, db);
        const { ChallengeSystem } = await import('@frw/name-registry');
        const challenges = new ChallengeSystem(collector, db);
        
        // Resolve name to owner
        const registeredNames = config.get('registeredNames') || {};
        const currentOwner = registeredNames[name];
        
        if (!currentOwner) {
            throw new Error(`Name "${name}" not found in registry`);
        }
        
        // Get challenger (current user's key)
        const keys = (config.get('keys') as Record<string, any>) || {};
        const defaultKey = config.get('defaultKeyPath') as string;
        if (!defaultKey || !keys[defaultKey]) {
            throw new Error('No keypair found. Run frw init first');
        }
        
        const challenger = keys[defaultKey].publicKey as string;
        
        // Parse bond
        const bondAmount = BigInt(options.bond);
        
        // Create evidence array
        const evidence = options.evidence ? [{
            type: 'ipfs_cid' as const,
            content: options.evidence,
            description: 'Challenge evidence',
            timestamp: Date.now()
        }] : [];
        
        // Create challenge
        const challenge = await challenges.createChallenge(
            name,
            currentOwner,
            challenger,
            options.reason as any,
            evidence,
            bondAmount
        );
        
        spinner.succeed('Challenge created');
        
        logger.section('Challenge Created');
        logger.info('');
        logger.info('Challenge ID: ' + logger.code(challenge.challengeId));
        logger.info('Name: ' + logger.code(name));
        logger.info('Reason: ' + options.reason);
        logger.info('Bond: ' + options.bond);
        logger.info('');
        logger.info('Response Deadline: ' + new Date(challenge.timestamps.responseDeadline).toLocaleString());
        logger.info('Evaluation Deadline: ' + new Date(challenge.timestamps.evaluationDeadline).toLocaleString());
        logger.info('');
        logger.info('The current owner has 30 days to respond.');
        logger.info('');
        logger.info('Check status: ' + logger.code(`frw challenge status ${challenge.challengeId}`));
        
        db.close();
        
    } catch (error) {
        spinner.fail('Challenge creation failed');
        
        if (error instanceof Error) {
            logger.error(error.message);
        } else {
            logger.error(String(error));
        }
        
        process.exit(1);
    }
}

export async function challengeRespondCommand(
    challengeId: string,
    options: {
        counterBond: string;
        evidence?: string;
    }
): Promise<void> {
    logger.section(`Respond to Challenge: ${challengeId}`);
    
    const spinner = ora('Responding to challenge...').start();
    
    try {
        // Initialize system
        const frwDir = (config.get('frwDir') as string) || path.join(os.homedir(), '.frw');
        const dbPath = path.join(frwDir, 'metrics.db');
        const db = new MetricsDatabase(dbPath);
        
        const ipfsApi = process.env.FRW_IPFS_API || 'http://127.0.0.1:5001';
        const collector = new MetricsCollector(ipfsApi, db);
        const { ChallengeSystem } = await import('@frw/name-registry');
        const challenges = new ChallengeSystem(collector, db);
        
        // Get responder (current user's key)
        const keys = (config.get('keys') as Record<string, any>) || {};
        const defaultKey = config.get('defaultKeyPath') as string;
        if (!defaultKey || !keys[defaultKey]) {
            throw new Error('No keypair found. Run frw init first');
        }
        
        const responder = keys[defaultKey].publicKey as string;
        
        // Parse counter-bond
        const counterBond = BigInt(options.counterBond);
        
        // Create evidence array
        const evidence = options.evidence ? [{
            type: 'ipfs_cid' as const,
            content: options.evidence,
            description: 'Response evidence',
            timestamp: Date.now()
        }] : [];
        
        // Respond to challenge
        const challenge = await challenges.respondToChallenge(
            challengeId,
            responder,
            evidence,
            counterBond
        );
        
        spinner.succeed('Response submitted');
        
        logger.section('Challenge Response');
        logger.info('');
        logger.info('Challenge ID: ' + logger.code(challengeId));
        logger.info('Counter-Bond: ' + options.counterBond);
        logger.info('Status: ' + challenge.status);
        logger.info('');
        logger.info('Evaluation Deadline: ' + new Date(challenge.timestamps.evaluationDeadline).toLocaleString());
        logger.info('');
        logger.info('Challenge will be automatically resolved after the evaluation period.');
        
        db.close();
        
    } catch (error) {
        spinner.fail('Response failed');
        
        if (error instanceof Error) {
            logger.error(error.message);
        } else {
            logger.error(String(error));
        }
        
        process.exit(1);
    }
}

export async function challengeStatusCommand(challengeId: string): Promise<void> {
    logger.section(`Challenge Status: ${challengeId}`);
    
    try {
        // Initialize system
        const frwDir = (config.get('frwDir') as string) || path.join(os.homedir(), '.frw');
        const dbPath = path.join(frwDir, 'metrics.db');
        const db = new MetricsDatabase(dbPath);
        
        const ipfsApi = process.env.FRW_IPFS_API || 'http://127.0.0.1:5001';
        const collector = new MetricsCollector(ipfsApi, db);
        const { ChallengeSystem } = await import('@frw/name-registry');
        const challenges = new ChallengeSystem(collector, db);
        
        // Get challenge status
        const challenge = challenges.getChallengeStatus(challengeId);
        
        if (!challenge) {
            logger.error('Challenge not found');
            process.exit(1);
        }
        
        // Display status
        logger.info('');
        logger.info('Challenge ID: ' + logger.code(challenge.challengeId));
        logger.info('Name: ' + logger.code(challenge.name));
        logger.info('Status: ' + challenge.status);
        logger.info('');
        logger.info('Challenger: ' + challenge.challenger);
        logger.info('Current Owner: ' + challenge.currentOwner);
        logger.info('');
        logger.info('Challenge Bond: ' + challenge.challengerBond.toString());
        logger.info('Reason: ' + challenge.challengeReason);
        logger.info('');
        logger.info('Created: ' + new Date(challenge.timestamps.created).toLocaleString());
        logger.info('Response Deadline: ' + new Date(challenge.timestamps.responseDeadline).toLocaleString());
        logger.info('Evaluation Deadline: ' + new Date(challenge.timestamps.evaluationDeadline).toLocaleString());
        
        if (challenge.response) {
            logger.info('');
            logger.info('Response:');
            logger.info('  Counter-Bond: ' + challenge.response.counterBond.toString());
            logger.info('  Submitted: ' + new Date(challenge.response.timestamp).toLocaleString());
        }
        
        if (challenge.resolution) {
            logger.info('');
            logger.info('Resolution:');
            logger.info('  Winner: ' + challenge.resolution.winner);
            logger.info('  Method: ' + challenge.resolution.method);
            logger.info('  Resolved: ' + new Date(challenge.timestamps.resolved!).toLocaleString());
            logger.info('');
            logger.info('Final Scores:');
            logger.info('  Owner: ' + challenge.resolution.finalMetrics.owner.usageScore.toFixed(2));
            logger.info('  Challenger: ' + challenge.resolution.finalMetrics.challenger.usageScore.toFixed(2));
        }
        
        db.close();
        
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error.message);
        } else {
            logger.error(String(error));
        }
        
        process.exit(1);
    }
}

export async function challengeListCommand(options: {
    owner?: boolean;
    challenger?: boolean;
}): Promise<void> {
    logger.section('Challenges');
    
    try {
        // Initialize system
        const frwDir = (config.get('frwDir') as string) || path.join(os.homedir(), '.frw');
        const dbPath = path.join(frwDir, 'metrics.db');
        const db = new MetricsDatabase(dbPath);
        
        const ipfsApi = process.env.FRW_IPFS_API || 'http://127.0.0.1:5001';
        const collector = new MetricsCollector(ipfsApi, db);
        const { ChallengeSystem } = await import('@frw/name-registry');
        const challenges = new ChallengeSystem(collector, db);
        
        // Get user's public key
        const keys = (config.get('keys') as Record<string, any>) || {};
        const defaultKey = config.get('defaultKeyPath') as string;
        const userKey = defaultKey && keys[defaultKey] ? keys[defaultKey].publicKey as string : null;
        
        // Build filter
        const filter: any = {};
        if (options.owner && userKey) {
            filter.owner = userKey;
        }
        if (options.challenger && userKey) {
            filter.challenger = userKey;
        }
        
        // List challenges
        const challengeList = challenges.listChallenges(filter);
        
        if (challengeList.length === 0) {
            logger.info('');
            logger.info('No challenges found.');
            db.close();
            return;
        }
        
        logger.info('');
        logger.info(`Found ${challengeList.length} challenge(s):`);
        logger.info('');
        
        for (const challenge of challengeList) {
            logger.info('─'.repeat(50));
            logger.info('ID: ' + logger.code(challenge.challengeId));
            logger.info('Name: ' + logger.code(challenge.name));
            logger.info('Status: ' + challenge.status);
            logger.info('Created: ' + new Date(challenge.timestamps.created).toLocaleString());
            
            if (challenge.resolution) {
                logger.info('Winner: ' + challenge.resolution.winner);
            }
            
            logger.info('');
        }
        
        db.close();
        
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error.message);
        } else {
            logger.error(String(error));
        }
        
        process.exit(1);
    }
}

export async function metricsShowCommand(name: string): Promise<void> {
    logger.section(`Content Metrics: ${name}`);
    
    const spinner = ora('Collecting metrics...').start();
    
    try {
        // Initialize database
        const frwDir = (config.get('frwDir') as string) || path.join(os.homedir(), '.frw');
        const dbPath = path.join(frwDir, 'metrics.db');
        const db = new MetricsDatabase(dbPath);
        
        // Initialize collector
        const ipfsApi = process.env.FRW_IPFS_API || 'http://127.0.0.1:5001';
        const collector = new MetricsCollector(ipfsApi, db);
        
        // Resolve name to public key
        const registeredNames = config.get('registeredNames') || {};
        const publicKey = registeredNames[name] || name;
        
        spinner.text = `Collecting metrics for ${name}...`;
        
        // Collect metrics
        const metrics = await collector.collectMetrics(publicKey);
        
        spinner.succeed('Metrics collected');
        
        // Display results
        logger.info('');
        logger.info('Legitimacy Score: ' + logger.code(metrics.legitimacyScore.toFixed(2)));
        logger.info('Usage Score: ' + logger.code(metrics.usageScore.toFixed(2)));
        logger.info('');
        logger.info('Details:');
        logger.info(`  Content Size: ${(metrics.contentSize / 1024).toFixed(2)} KB`);
        logger.info(`  DAG Depth: ${metrics.dagDepth} nodes`);
        logger.info(`  IPNS Updates: ${metrics.ipnsUpdates}`);
        logger.info(`  Peer Connections: ${metrics.totalPeerConnections}`);
        logger.info(`  Unique Peers: ${metrics.uniquePeerIds.size}`);
        logger.info(`  Last Activity: ${new Date(metrics.lastActivity).toLocaleString()}`);
        logger.info('');
        
        if (metrics.contentSize === 0) {
            logger.warn('No content found. Has this name been published?');
        }
        
        db.close();
        
    } catch (error) {
        spinner.fail('Failed to collect metrics');
        
        if (error instanceof Error) {
            if (error.message.includes('connect ECONNREFUSED')) {
                logger.error('Could not connect to IPFS daemon');
                logger.info('');
                logger.info('Make sure IPFS is running:');
                logger.info('  ipfs daemon');
            } else if (error.message.includes('could not resolve')) {
                logger.error('Name not found or not published');
                logger.info('');
                logger.info('Publish content first:');
                logger.info('  frw publish <directory>');
            } else {
                logger.error(error.message);
            }
        } else {
            logger.error(String(error));
        }
        
        process.exit(1);
    }
}
