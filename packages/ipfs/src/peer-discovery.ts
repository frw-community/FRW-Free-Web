/**
 * P2P Peer Discovery for FRW
 * 
 * Nodes discover each other via:
 * 1. IPFS DHT (automatic via IPFS)
 * 2. Pubsub announcements
 * 3. Bootstrap nodes (only for cold start)
 * 
 * Once connected to ANY peer, you can discover the whole network!
 */

import type { IPFSHTTPClient } from 'ipfs-http-client';

export interface FRWPeer {
  peerId: string;
  addresses: string[];
  nodeType: 'bootstrap' | 'resolver' | 'client';
  capabilities: string[];
  lastSeen: number;
}

export class PeerDiscovery {
  private ipfs: IPFSHTTPClient;
  private knownPeers: Map<string, FRWPeer>;
  private readonly DISCOVERY_TOPIC = 'frw/peer/discovery/v1';
  private readonly ANNOUNCE_INTERVAL = 300000; // 5 minutes
  private announceTimer?: NodeJS.Timeout;

  constructor(ipfs: IPFSHTTPClient) {
    this.ipfs = ipfs;
    this.knownPeers = new Map();
  }

  /**
   * Start peer discovery
   */
  async start(): Promise<void> {
    console.log('[PeerDiscovery] Starting P2P peer discovery...');

    // Subscribe to discovery topic
    await this.ipfs.pubsub.subscribe(this.DISCOVERY_TOPIC, (msg: any) => {
      this.handlePeerAnnouncement(msg);
    });

    // Announce ourselves
    await this.announceSelf();

    // Periodic announcements
    this.announceTimer = setInterval(() => {
      this.announceSelf();
    }, this.ANNOUNCE_INTERVAL);

    // Query IPFS for connected peers
    await this.discoverIPFSPeers();

    console.log('[PeerDiscovery] ✓ Peer discovery active');
  }

  /**
   * Stop peer discovery
   */
  stop(): void {
    if (this.announceTimer) {
      clearInterval(this.announceTimer);
    }
  }

  /**
   * Announce ourselves to the network
   */
  private async announceSelf(): Promise<void> {
    try {
      const id = await this.ipfs.id();

      const announcement = {
        type: 'peer-announce',
        peerId: id.id.toString(),
        addresses: id.addresses.map((addr: any) => addr.toString()),
        nodeType: 'resolver' as const,
        capabilities: ['name-resolution', 'content-serving'],
        timestamp: Date.now()
      };

      await this.ipfs.pubsub.publish(
        this.DISCOVERY_TOPIC,
        Buffer.from(JSON.stringify(announcement))
      );

      console.log(`[PeerDiscovery] 📡 Announced to network`);
    } catch (error) {
      console.warn('[PeerDiscovery] Failed to announce:', error);
    }
  }

  /**
   * Handle peer announcement from pubsub
   */
  private handlePeerAnnouncement(msg: any): void {
    try {
      const data = JSON.parse(msg.data.toString());

      if (data.type === 'peer-announce') {
        const peer: FRWPeer = {
          peerId: data.peerId,
          addresses: data.addresses,
          nodeType: data.nodeType,
          capabilities: data.capabilities,
          lastSeen: Date.now()
        };

        this.knownPeers.set(peer.peerId, peer);
        console.log(`[PeerDiscovery] 📥 Discovered peer: ${peer.peerId.substring(0, 8)}... (${peer.nodeType})`);
      }
    } catch (error) {
      console.warn('[PeerDiscovery] Failed to parse announcement:', error);
    }
  }

  /**
   * Discover peers via IPFS swarm
   */
  private async discoverIPFSPeers(): Promise<void> {
    try {
      const peers = await this.ipfs.swarm.peers();
      console.log(`[PeerDiscovery] Connected to ${peers.length} IPFS peers`);

      // These are raw IPFS peers, not necessarily FRW nodes
      // FRW nodes will announce themselves via pubsub
    } catch (error) {
      console.warn('[PeerDiscovery] Failed to query IPFS peers:', error);
    }
  }

  /**
   * Get all known FRW peers
   */
  getKnownPeers(): FRWPeer[] {
    // Clean up stale peers (not seen in 15 minutes)
    const now = Date.now();
    const staleThreshold = 15 * 60 * 1000;

    for (const [peerId, peer] of this.knownPeers.entries()) {
      if (now - peer.lastSeen > staleThreshold) {
        this.knownPeers.delete(peerId);
      }
    }

    return Array.from(this.knownPeers.values());
  }

  /**
   * Get bootstrap peers only
   */
  getBootstrapPeers(): FRWPeer[] {
    return this.getKnownPeers().filter(p => p.nodeType === 'bootstrap');
  }

  /**
   * Get resolver peers
   */
  getResolverPeers(): FRWPeer[] {
    return this.getKnownPeers().filter(p => p.nodeType === 'resolver');
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(peerId: string): Promise<void> {
    const peer = this.knownPeers.get(peerId);
    if (!peer || peer.addresses.length === 0) {
      throw new Error(`Unknown peer: ${peerId}`);
    }

    // Try to connect via IPFS swarm
    for (const addr of peer.addresses) {
      try {
        // Note: Addresses are already in multiaddr format from IPFS
        await this.ipfs.swarm.connect(addr as any);
        console.log(`[PeerDiscovery] ✓ Connected to ${peerId.substring(0, 8)}...`);
        return;
      } catch (error) {
        // Try next address
      }
    }

    throw new Error(`Failed to connect to ${peerId}`);
  }
}
