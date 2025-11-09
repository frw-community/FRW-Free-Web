#!/usr/bin/env node
// FRW Bootstrap Index Node
// Maintains global index of FRW names for fast resolution
// Can be run by anyone in the community

import { create as createIPFSClient } from 'ipfs-http-client';
import express from 'express';
import cors from 'cors';
import type { DistributedNameRecord } from '@frw/ipfs';

interface IndexEntry {
  name: string;
  publicKey: string;
  contentCID: string;
  ipnsKey: string;
  timestamp: number;
  signature: string;
}

class BootstrapIndexNode {
  private ipfs: any;
  private index: Map<string, IndexEntry>;
  private app: express.Application;
  private nodeId: string;
  private lastPublished: number = 0;
  
  private readonly IPFS_URL = process.env.IPFS_URL || 'http://localhost:5001';
  private readonly HTTP_PORT = parseInt(process.env.HTTP_PORT || '3030');
  private readonly PUBLISH_INTERVAL = 3600000; // 1 hour
  private readonly PUBSUB_TOPIC = 'frw/names/updates/v1';

  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.index = new Map();
    this.app = express();
    this.ipfs = createIPFSClient({ url: this.IPFS_URL });

    this.setupExpress();
  }

  /**
   * Start the bootstrap node
   */
  async start(): Promise<void> {
    console.log(`[Bootstrap] Starting FRW Bootstrap Node: ${this.nodeId}`);
    console.log(`[Bootstrap] IPFS: ${this.IPFS_URL}`);
    console.log(`[Bootstrap] HTTP: ${this.HTTP_PORT}`);

    // Test IPFS connection
    try {
      const version = await this.ipfs.version();
      console.log(`[Bootstrap] ✓ Connected to IPFS ${version.version}`);
    } catch (error) {
      console.error('[Bootstrap] ✗ Failed to connect to IPFS:', error);
      process.exit(1);
    }

    // Subscribe to pubsub
    await this.subscribeToPubsub();

    // Start HTTP server
    this.app.listen(this.HTTP_PORT, () => {
      console.log(`[Bootstrap] ✓ HTTP server listening on port ${this.HTTP_PORT}`);
    });

    // Periodic index publishing
    setInterval(() => this.publishIndex(), this.PUBLISH_INTERVAL);

    // Publish initial index
    await this.publishIndex();

    console.log('[Bootstrap] ✓ Bootstrap node ready!');
    console.log(`[Bootstrap] Node ID: ${this.nodeId}`);
    console.log(`[Bootstrap] API: http://localhost:${this.HTTP_PORT}`);
  }

  /**
   * Setup Express routes
   */
  private setupExpress(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        nodeId: this.nodeId,
        indexSize: this.index.size,
        lastPublished: this.lastPublished,
        uptime: process.uptime()
      });
    });

    // Get all names
    this.app.get('/api/names', (req, res) => {
      const names = Array.from(this.index.entries()).map(([name, entry]) => ({
        name,
        publicKey: entry.publicKey,
        contentCID: entry.contentCID,
        timestamp: entry.timestamp
      }));

      res.json({
        count: names.length,
        names
      });
    });

    // Resolve single name
    this.app.get('/api/resolve/:name', (req, res): void => {
      const { name } = req.params;
      const entry = this.index.get(name.toLowerCase());

      if (!entry) {
        res.status(404).json({
          error: 'Name not found',
          name
        });
        return;
      }

      res.json({
        name: entry.name,
        publicKey: entry.publicKey,
        contentCID: entry.contentCID,
        ipnsKey: entry.ipnsKey,
        timestamp: entry.timestamp,
        signature: entry.signature,
        resolvedBy: this.nodeId
      });
    });

    // Submit new name (backup to pubsub)
    this.app.post('/api/submit', async (req, res): Promise<void> => {
      try {
        const record: DistributedNameRecord = req.body;

        // Validate record
        if (!record.name || !record.publicKey || !record.signature) {
          res.status(400).json({
            error: 'Invalid record: missing required fields'
          });
          return;
        }

        // TODO: Verify signature here

        // Add to index
        this.addToIndex(record);

        // Broadcast via pubsub
        await this.ipfs.pubsub.publish(
          this.PUBSUB_TOPIC,
          Buffer.from(JSON.stringify({
            type: 'name-register',
            record,
            submittedBy: this.nodeId,
            timestamp: Date.now()
          }))
        );

        res.json({
          success: true,
          name: record.name,
          message: 'Name registered and broadcasted'
        });

      } catch (error) {
        res.status(500).json({
          error: 'Failed to submit name',
          details: error instanceof Error ? error.message : 'Unknown'
        });
        return;
      }
    });

    // Get index CID (for IPFS fallback)
    this.app.get('/api/index/cid', (req, res) => {
      res.json({
        nodeId: this.nodeId,
        lastPublished: this.lastPublished,
        message: 'Index CID will be available after first publish'
      });
    });

    // Statistics
    this.app.get('/api/stats', (req, res) => {
      res.json({
        nodeId: this.nodeId,
        totalNames: this.index.size,
        lastPublished: this.lastPublished,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        ipfsUrl: this.IPFS_URL
      });
    });
  }

  /**
   * Subscribe to IPFS pubsub for name updates
   */
  private async subscribeToPubsub(): Promise<void> {
    try {
      await this.ipfs.pubsub.subscribe(this.PUBSUB_TOPIC, (msg: any) => {
        this.handlePubsubMessage(msg);
      });

      console.log(`[Bootstrap] ✓ Subscribed to pubsub: ${this.PUBSUB_TOPIC}`);
    } catch (error) {
      console.error('[Bootstrap] ✗ Failed to subscribe to pubsub:', error);
    }
  }

  /**
   * Handle incoming pubsub message
   */
  private handlePubsubMessage(msg: any): void {
    try {
      const data = JSON.parse(msg.data.toString());

      if (data.type === 'name-register' && data.record) {
        const record: DistributedNameRecord = data.record;
        this.addToIndex(record);
        console.log(`[Bootstrap] 📥 Received name via pubsub: ${record.name}`);
      }

    } catch (error) {
      console.warn('[Bootstrap] Failed to parse pubsub message:', error);
    }
  }

  /**
   * Add name to index
   */
  private addToIndex(record: DistributedNameRecord): void {
    const entry: IndexEntry = {
      name: record.name,
      publicKey: record.publicKey,
      contentCID: record.contentCID,
      ipnsKey: record.ipnsKey,
      timestamp: record.registered,
      signature: record.signature
    };

    this.index.set(record.name.toLowerCase(), entry);
    console.log(`[Bootstrap] ✓ Added to index: ${record.name} (${this.index.size} total)`);
  }

  /**
   * Publish index to IPFS
   */
  private async publishIndex(): Promise<void> {
    try {
      console.log(`[Bootstrap] Publishing index (${this.index.size} names)...`);

      const indexData = {
        version: 1,
        nodeId: this.nodeId,
        published: Date.now(),
        totalNames: this.index.size,
        names: Object.fromEntries(this.index)
      };

      const content = JSON.stringify(indexData, null, 2);
      const result = await this.ipfs.add(content);
      const cid = result.cid.toString();

      this.lastPublished = Date.now();

      console.log(`[Bootstrap] ✓ Index published to IPFS: ${cid}`);
      console.log(`[Bootstrap] Access via: http://localhost:8080/ipfs/${cid}`);

      // Announce on pubsub
      await this.ipfs.pubsub.publish(
        'frw/index/updates',
        Buffer.from(JSON.stringify({
          type: 'index-update',
          nodeId: this.nodeId,
          cid,
          nameCount: this.index.size,
          timestamp: Date.now()
        }))
      );

    } catch (error) {
      console.error('[Bootstrap] ✗ Failed to publish index:', error);
    }
  }
}

// Start node
const nodeId = process.env.NODE_ID || `bootstrap-${Date.now()}`;
const node = new BootstrapIndexNode(nodeId);

node.start().catch(error => {
  console.error('[Bootstrap] Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Bootstrap] Shutting down gracefully...');
  process.exit(0);
});
