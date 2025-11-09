#!/usr/bin/env node

/**
 * FRW Gateway Server
 * HTTP gateway for accessing FRW content via standard browsers
 * Allows accessing frw:// URLs through HTTP
 */

import http from 'http';
import { create } from 'ipfs-http-client';

const PORT = process.env.PORT || 3000;
const IPFS_API = process.env.FRW_IPFS_API || '/ip4/127.0.0.1/tcp/5001';

let ipfs;

// Initialize IPFS client
async function initIPFS() {
  try {
    ipfs = create(IPFS_API);
    const version = await ipfs.version();
    console.log(`✓ Connected to IPFS ${version.version}`);
  } catch (error) {
    console.error('Failed to connect to IPFS:', error.message);
    process.exit(1);
  }
}

// Load FRW configuration
let frwConfig = {};
try {
  const configPath = process.env.FRW_CONFIG_PATH || '/root/.frw/config.json';
  const fs = await import('fs/promises');
  const configData = await fs.readFile(configPath, 'utf-8');
  frwConfig = JSON.parse(configData);
  console.log('✓ Loaded FRW configuration');
} catch (error) {
  console.log('⚠ No FRW configuration found, using defaults');
}

// Resolve FRW name to public key
function resolveNameToKey(name) {
  // Check registered names
  const registeredNames = frwConfig.registeredNames || {};
  if (registeredNames[name]) {
    return registeredNames[name];
  }
  
  // Check if it's already a public key
  if (name.length > 40) {
    return name;
  }
  
  return null;
}

// Resolve domain to FRW name
function resolveDomainToName(domain) {
  const domainMappings = frwConfig.domainMappings || {};
  const mapping = domainMappings[domain.toLowerCase()];
  
  if (mapping && mapping.verified) {
    return mapping.frwName;
  }
  
  return null;
}

// Resolve FRW URL to content
async function resolveFRWURL(url) {
  // Parse frw://name/path or frw://pubkey/path
  const match = url.match(/^frw:\/\/([^\/]+)(\/.*)?$/);
  if (!match) {
    throw new Error('Invalid FRW URL format');
  }

  const [, identifier, path = '/'] = match;
  
  // Try to resolve name to public key
  let publicKey = resolveNameToKey(identifier);
  
  if (!publicKey) {
    throw new Error(`Name not found: ${identifier}`);
  }
  
  // Build IPNS path
  const ipnsPath = `/ipns/${publicKey}${path}`;
  
  return ipnsPath;
}

// Fetch content from IPFS
async function fetchContent(ipfsPath) {
  const chunks = [];
  for await (const chunk of ipfs.cat(ipfsPath)) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// HTTP request handler
async function handleRequest(req, res) {
  const url = req.url;
  const host = req.headers.host?.split(':')[0]; // Remove port

  // Health check endpoint
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'frw-gateway' }));
    return;
  }

  // Check if this is a custom domain
  if (host && host !== 'localhost' && !host.startsWith('127.')) {
    const frwName = resolveDomainToName(host);
    if (frwName) {
      // Redirect to FRW content for this domain
      const frwUrl = `frw://${frwName}${url}`;
      try {
        const ipfsPath = await resolveFRWURL(frwUrl);
        const content = await fetchContent(ipfsPath);
        
        const contentType = url.endsWith('.html') ? 'text/html' : 
                           url.endsWith('.css') ? 'text/css' :
                           url.endsWith('.js') ? 'application/javascript' :
                           url.endsWith('.json') ? 'application/json' :
                           'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        return;
      } catch (error) {
        console.error('Domain resolution error:', error.message);
      }
    }
  }

  // Home page
  if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>FRW Gateway</title>
        <style>
          body { font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px; }
          h1 { color: #2563eb; }
          code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
          .example { background: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>🚀 FRW Gateway</h1>
        <p>HTTP gateway for accessing FRW decentralized content.</p>
        
        <h2>Usage</h2>
        <div class="example">
          <strong>Access FRW content via HTTP:</strong><br>
          <code>http://localhost:${PORT}/frw/{name-or-pubkey}/{path}</code>
        </div>

        <div class="example">
          <strong>Examples:</strong><br>
          • <code>/frw/alice/index.html</code><br>
          • <code>/frw/12D3KooW.../page.html</code><br>
          • <code>/ipfs/Qm.../file.html</code>
        </div>

        <h2>Status</h2>
        <p>✅ Gateway is running and connected to IPFS</p>
        
        <p><a href="/health">Check health</a></p>
      </body>
      </html>
    `);
    return;
  }

  try {
    // Handle FRW URLs: /frw/name/path
    if (url.startsWith('/frw/')) {
      const frwUrl = url.replace(/^\/frw\//, 'frw://');
      const ipfsPath = await resolveFRWURL(frwUrl);
      const content = await fetchContent(ipfsPath);
      
      // Detect content type
      const contentType = url.endsWith('.html') ? 'text/html' : 
                         url.endsWith('.css') ? 'text/css' :
                         url.endsWith('.js') ? 'application/javascript' :
                         url.endsWith('.json') ? 'application/json' :
                         'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    }

    // Handle direct IPFS paths: /ipfs/CID or /ipns/name
    if (url.startsWith('/ipfs/') || url.startsWith('/ipns/')) {
      const content = await fetchContent(url);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }

    // 404 for other paths
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');

  } catch (error) {
    console.error('Request error:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Error: ${error.message}`);
  }
}

// Start server
async function start() {
  await initIPFS();

  const server = http.createServer(handleRequest);
  
  server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║       FRW Gateway Server               ║
╚════════════════════════════════════════╝

✓ Server running on http://localhost:${PORT}
✓ IPFS API: ${IPFS_API}

Access FRW content:
  http://localhost:${PORT}/frw/{name}/{path}
  http://localhost:${PORT}/ipfs/{cid}
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
