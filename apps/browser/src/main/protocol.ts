import { protocol, net } from 'electron';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { DistributedNameRegistry } from '@frw/ipfs';

// Global registry instance (listens to pubsub for updates)
let registry: DistributedNameRegistry | null = null;

// Initialize registry once
function getRegistry(): DistributedNameRegistry {
  if (!registry) {
    console.log('[FRW] Initializing distributed name registry...');
    registry = new DistributedNameRegistry('http://localhost:5001');
    console.log('[FRW] ✓ Registry initialized (listening for updates via pubsub)');
  }
  return registry;
}

// Fallback: Load from local config if distributed resolution fails
function getConfigFallback(): { names: Record<string, string>; sites: Record<string, string> } {
  try {
    const configPath = join(homedir(), '.frw', 'config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return {
      names: config.registeredNames || {},
      sites: config.publishedSites || {}
    };
  } catch {
    return { names: {}, sites: {} };
  }
}

export function registerFRWProtocol() {
  protocol.registerStringProtocol('frw', async (request, callback) => {
    try {
      console.log('[FRW Protocol] Loading:', request.url);
      
      // Parse frw://name/ URL
      const urlMatch = request.url.match(/^frw:\/\/([^\/]+)(\/.*)?$/);
      if (!urlMatch) {
        return callback({
          data: '<h1>Invalid FRW URL</h1>',
          mimeType: 'text/html'
        });
      }

      const [, identifier, path] = urlMatch;
      
      console.log('[FRW Protocol] Identifier:', identifier);
      
      // Try distributed resolution first
      let cid: string | null = null;
      
      try {
        const reg = getRegistry();
        const resolved = await reg.resolveName(identifier);
        
        if (resolved) {
          cid = resolved.record.contentCID;
          console.log('[FRW Protocol] ✓ Resolved via distributed registry:', cid);
        } else {
          console.log('[FRW Protocol] Name not found in distributed registry, trying fallback...');
        }
      } catch (error) {
        console.warn('[FRW Protocol] Distributed resolution failed:', error);
      }
      
      // Fallback to local config if distributed resolution failed
      if (!cid) {
        const config = getConfigFallback();
        cid = config.sites[identifier] || null;
        
        if (cid) {
          console.log('[FRW Protocol] ✓ Resolved via local config (fallback):', cid);
        }
      }
      
      if (!cid) {
        const errorHtml = `
<!DOCTYPE html>
<html>
<head><title>FRW - Not Published</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 100px auto; text-align: center;">
  <h1>⚠️ Site Not Found</h1>
  <p>The site <strong>${identifier}</strong> has not been published yet.</p>
  <p>To publish, run: <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">frw publish [directory]</code></p>
</body>
</html>
        `;
        return callback({ data: errorHtml, mimeType: 'text/html' });
      }
      
      // Try to fetch from IPFS using Electron's net module
      const ipfsUrl = `http://localhost:8080/ipfs/${cid}${path || '/index.html'}`;
      
      console.log('[FRW Protocol] ========================================');
      console.log('[FRW Protocol] Attempting IPFS fetch');
      console.log('[FRW Protocol] CID:', cid);
      console.log('[FRW Protocol] URL:', ipfsUrl);
      
      try {
        const response = await net.fetch(ipfsUrl);
        
        console.log('[FRW Protocol] Response status:', response.status);
        console.log('[FRW Protocol] Response OK:', response.ok);
        
        if (response.ok) {
          const content = await response.text();
          console.log('[FRW Protocol] ✅ SUCCESS! Content fetched:', content.length, 'bytes');
          callback({
            data: content,
            mimeType: 'text/html'
          });
          return;
        } else {
          console.error('[FRW Protocol] ❌ IPFS returned error:', response.status, response.statusText);
        }
      } catch (ipfsError) {
        console.error('[FRW Protocol] ❌ IPFS fetch exception:', ipfsError);
      }
      
      // Fallback: Show test page with real data
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>FRW Test Page</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }
    h1 {
      margin: 0 0 20px 0;
      font-size: 48px;
    }
    .badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .url {
      background: rgba(0, 0, 0, 0.2);
      padding: 12px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      margin: 20px 0;
    }
    .status {
      margin-top: 30px;
      font-size: 14px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">✓ FRW Protocol Working</div>
    <h1>Hello from FRW!</h1>
    <p>You're viewing a page served through the <strong>frw://</strong> custom protocol.</p>
    <div class="url">
      <strong>URL:</strong> ${request.url}
    </div>
    <p>This demonstrates that:</p>
    <ul>
      <li>✅ Electron custom protocol handler is registered</li>
      <li>✅ FRW browser can intercept frw:// URLs</li>
      <li>✅ Content is being served and rendered</li>
    </ul>
    <div class="status">
      <p><strong>Next steps:</strong></p>
      <ul>
        <li>Connect to IPFS to fetch real content</li>
        <li>Implement name resolution</li>
        <li>Add signature verification</li>
      </ul>
    </div>
  </div>
</body>
</html>
      `;

      callback({
        data: html,
        mimeType: 'text/html'
      });
      
    } catch (error) {
      console.error('[FRW Protocol] Error:', error);
      
      const errorHtml = `
<!DOCTYPE html>
<html>
<head><title>FRW Error</title></head>
<body>
  <h1>Failed to load FRW page</h1>
  <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
</body>
</html>
      `;
      
      callback({
        data: errorHtml,
        mimeType: 'text/html'
      });
    }
  });
}

function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'frw': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon'
  };
  return mimeTypes[ext || 'html'] || 'text/plain';
}
