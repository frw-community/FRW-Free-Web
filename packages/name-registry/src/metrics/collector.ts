// Phase 1: Content Metrics Collection from IPFS

import { create } from 'ipfs-http-client';
import type { ContentMetrics, ActivitySnapshot } from '../types.js';

export class MetricsCollector {
    private ipfs: any;
    private db: any;
    
    constructor(ipfsApiUrl: string, db: any) {
        this.ipfs = create({ url: ipfsApiUrl });
        this.db = db;
    }
    
    async collectMetrics(publicKey: string): Promise<ContentMetrics> {
        try {
            // Initialize metrics object
            const metrics: ContentMetrics = {
                name: publicKey,
                publicKey,
                totalPeerConnections: 0,
                uniquePeerIds: new Set<string>(),
                contentFetches: 0,
                ipnsUpdates: 1,
                contentSize: 0,
                dagDepth: 0,
                inboundLinks: [],
                verificationCount: 0,
                lastActivity: Date.now(),
                activityHistory: [],
                legitimacyScore: 0,
                usageScore: 0
            };
            
            // Try to resolve IPNS to get current content
            try {
                const ipnsPath = `/ipns/${publicKey}`;
                const resolveIterator = this.ipfs.name.resolve(ipnsPath);
                
                // Get the resolved path
                let resolvedPath = '';
                for await (const path of resolveIterator) {
                    resolvedPath = path;
                }
                
                if (resolvedPath) {
                    const cid = this.extractCID(resolvedPath);
                    
                    // Get content statistics
                    const stats = await this.ipfs.object.stat(cid);
                    metrics.contentSize = stats.CumulativeSize || 0;
                    metrics.dagDepth = stats.NumLinks || 0;
                    
                    // Count IPNS updates from history (if available)
                    metrics.ipnsUpdates = await this.countIPNSUpdates(publicKey);
                }
            } catch (resolveError) {
                // Name not published yet or not found
                const message = resolveError instanceof Error ? resolveError.message : String(resolveError);
                console.warn(`Could not resolve IPNS for ${publicKey}: ${message}`);
            }
            
            // Get peer connection statistics
            try {
                const peers = await this.ipfs.swarm.peers();
                metrics.totalPeerConnections = peers.length;
                metrics.uniquePeerIds = new Set(peers.map((p: any) => p.peer.toString()));
            } catch (peerError) {
                const message = peerError instanceof Error ? peerError.message : String(peerError);
                console.warn(`Could not get peer info: ${message}`);
            }
            
            // Calculate scores
            metrics.legitimacyScore = this.calculateLegitimacyScore(metrics);
            metrics.usageScore = this.calculateUsageScore(metrics);
            
            // Save to database
            this.db.saveMetrics(metrics);
            
            return metrics;
            
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to collect metrics for ${publicKey}: ${message}`);
        }
    }
    
    private extractCID(ipfsPath: string): string {
        // Extract CID from paths like /ipfs/QmXXX or /ipfs/bafy...
        const match = ipfsPath.match(/\/ipfs\/([^\/]+)/);
        return match ? match[1] : ipfsPath.replace('/ipfs/', '');
    }
    
    private async countIPNSUpdates(publicKey: string): Promise<number> {
        // For now, return 1 (at least one update to be resolvable)
        // TODO: Implement IPNS update history tracking
        return 1;
    }
    
    private calculateLegitimacyScore(metrics: ContentMetrics): number {
        const weights = {
            uniquePeers: 5,
            fetches: 1,
            updates: 10,
            contentSize: 0.001,
            inboundLinks: 20,
            verifications: 2,
            dagDepth: 3
        };
        
        return (
            metrics.uniquePeerIds.size * weights.uniquePeers +
            metrics.contentFetches * weights.fetches +
            metrics.ipnsUpdates * weights.updates +
            metrics.contentSize * weights.contentSize +
            metrics.inboundLinks.length * weights.inboundLinks +
            metrics.verificationCount * weights.verifications +
            metrics.dagDepth * weights.dagDepth
        );
    }
    
    private calculateUsageScore(metrics: ContentMetrics): number {
        const now = Date.now();
        const daysSinceActivity = (now - metrics.lastActivity) / 86400000;
        const decayFactor = Math.exp(-daysSinceActivity / 30);
        
        return metrics.legitimacyScore * decayFactor;
    }
}
