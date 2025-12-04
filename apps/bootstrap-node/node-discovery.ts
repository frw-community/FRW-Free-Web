import fetch from 'node-fetch';

// Node Discovery Module
// Maintains a dynamic list of active bootstrap nodes via Gossip/PubSub

export class NodeDiscovery {
  private activeNodes: Set<string>;
  private ipfs: any;
  private readonly DISCOVERY_TOPIC = 'frw/admin/nodes';
  private readonly HEARTBEAT_INTERVAL = 60000; // 1 minute

  constructor(ipfs: any, initialNodes: string[] = []) {
    this.ipfs = ipfs;
    this.activeNodes = new Set(initialNodes);
  }

  /**
   * Start discovery service
   */
  async start(myUrl: string): Promise<void> {
    // Subscribe to node announcements
    await this.ipfs.pubsub.subscribe(this.DISCOVERY_TOPIC, (msg: any) => {
      this.handleMessage(msg);
    });

    // Announce self periodically
    setInterval(() => {
      this.announce(myUrl);
    }, this.HEARTBEAT_INTERVAL);

    // Initial announcement
    await this.announce(myUrl);
    
    console.log(`[Discovery] Service started. Tracking ${this.activeNodes.size} nodes.`);
  }

  /**
   * Get list of active nodes
   */
  getNodes(): string[] {
    return Array.from(this.activeNodes);
  }

  /**
   * Announce presence to network
   */
  private async announce(url: string): Promise<void> {
    try {
      const message = JSON.stringify({
        type: 'node-hello',
        url: url,
        timestamp: Date.now()
      });
      await this.ipfs.pubsub.publish(this.DISCOVERY_TOPIC, Buffer.from(message));
    } catch (err) {
      // Silent fail on connection issues
    }
  }

  /**
   * Handle incoming announcements
   */
  private handleMessage(msg: any): void {
    try {
      const data = JSON.parse(msg.data.toString());
      
      if (data.type === 'node-hello' && data.url) {
        const url = data.url;
        
        // Add new node
        if (!this.activeNodes.has(url)) {
          console.log(`[Discovery] 🔍 Discovered new peer: ${url}`);
          this.activeNodes.add(url);
          
          // Optional: Verify it's actually a bootstrap node
          this.verifyNode(url).catch(err => {
            console.warn(`[Discovery] Failed to verify ${url}, removing.`);
            this.activeNodes.delete(url);
          });
        }
      }
    } catch (err) {
      // Invalid message
    }
  }

  /**
   * Verify a node is legitimate (basic health check)
   */
  private async verifyNode(url: string): Promise<void> {
    const response = await fetch(`${url}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
  }
}
