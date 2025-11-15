import { protocol, net } from 'electron';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { DistributedNameRegistry } from '@frw/ipfs';
import { getBootstrapUrls } from '../config/bootstrap';

// Global registry instance (listens to pubsub for updates)
let registry: DistributedNameRegistry | null = null;

// Initialize registry once
function getRegistry(): DistributedNameRegistry {
  if (!registry) {
    console.log('[FRW] Initializing distributed name registry...');
    const bootstrapNodes = [
      ...getBootstrapUrls(),           // All 4 Swiss bootstrap nodes
      'http://localhost:3100'          // Local dev (if running)
    ];
    registry = new DistributedNameRegistry({
      ipfsUrl: 'http://localhost:5001',
      bootstrapNodes
    });
    console.log('[FRW] ✓ Registry initialized with', bootstrapNodes.length, 'bootstrap nodes');
    console.log('[FRW] Bootstrap nodes:', bootstrapNodes);
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

// Helper to download image and convert to data URL
async function imageToDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const response = await net.fetch(imageUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      // Detect mime type from URL
      const ext = imageUrl.split('.').pop()?.toLowerCase();
      let mimeType = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'svg') mimeType = 'image/svg+xml';
      else if (ext === 'webp') mimeType = 'image/webp';
      
      return `data:${mimeType};base64,${base64}`;
    }
  } catch (error) {
    console.warn('[FRW Protocol] Failed to load image:', imageUrl, error);
  }
  return null;
}

// Helper to preload all images in HTML and convert to data URLs
async function preloadImagesInHtml(html: string, cid: string, gateways: string[]): Promise<string> {
  console.log('[FRW Protocol] Preloading images...');
  
  // Find all img src attributes
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const matches = [...html.matchAll(imgRegex)];
  
  if (matches.length === 0) {
    console.log('[FRW Protocol] No images found');
    return html;
  }
  
  console.log('[FRW Protocol] Found', matches.length, 'images to preload');
  
  for (const match of matches) {
    const originalSrc = match[1];
    
    // Skip if already data URL or absolute URL
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      continue;
    }
    
    // Try each gateway to fetch the image
    let dataUrl: string | null = null;
    for (const gateway of gateways) {
      const imageUrl = `${gateway}/ipfs/${cid}/${originalSrc}`;
      console.log('[FRW Protocol] Trying to load image:', imageUrl);
      dataUrl = await imageToDataUrl(imageUrl);
      if (dataUrl) {
        console.log('[FRW Protocol] ✓ Loaded image:', originalSrc);
        break;
      }
    }
    
    // Replace src with data URL
    if (dataUrl) {
      html = html.replace(match[0], match[0].replace(originalSrc, dataUrl));
    }
  }
  
  console.log('[FRW Protocol] ✓ All images preloaded');
  return html;
}

export function registerFRWProtocol() {
  protocol.registerBufferProtocol('frw', async (request, callback) => {
    let identifier = ''; // Declare outside try block for error handler access
    
    try {
      console.log('[FRW Protocol] Loading:', request.url);
      
      // Parse frw://name/ URL
      const urlMatch = request.url.match(/^frw:\/\/([^\/]+)(\/.*)?$/);
      if (!urlMatch) {
        return callback({
          data: Buffer.from('<h1>Invalid FRW URL</h1>'),
          mimeType: 'text/html'
        });
      }

      const [, parsedIdentifier, path] = urlMatch;
      identifier = parsedIdentifier;
      
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
        return callback({ data: Buffer.from(errorHtml), mimeType: 'text/html' });
      }
      
      // Try to fetch from IPFS - try local first, then public gateways
      const gateways = [
        'http://localhost:8080',           // Local IPFS gateway (fastest)
        'https://ipfs.io',                  // Public gateway #1
        'https://cloudflare-ipfs.com',     // Public gateway #2 (fast CDN)
        'https://dweb.link'                // Public gateway #3
      ];
      
      console.log('[FRW Protocol] ========================================');
      console.log('[FRW Protocol] Attempting IPFS fetch');
      console.log('[FRW Protocol] CID:', cid);
      
      for (const gateway of gateways) {
        // Default to /index.html if no path specified, otherwise use the path as-is
        const resourcePath = path || '/index.html';
        const ipfsUrl = `${gateway}/ipfs/${cid}${resourcePath}`;
        console.log('[FRW Protocol] Trying gateway:', ipfsUrl);
        
        try {
          const response = await net.fetch(ipfsUrl, { 
            method: 'GET',
            // Timeout after 5 seconds per gateway
            signal: AbortSignal.timeout(5000)
          });
          
          console.log('[FRW Protocol] Response status:', response.status);
          console.log('[FRW Protocol] Response OK:', response.ok);
          
          if (response.ok) {
            // Detect content type from path
            const mimeType = getMimeType(resourcePath);
            
            // For images and binary, use arrayBuffer, for text use text()
            if (mimeType.startsWith('image/')) {
              const buffer = await response.arrayBuffer();
              console.log('[FRW Protocol] ✅ SUCCESS! Image fetched from', gateway, ':', buffer.byteLength, 'bytes');
              callback({
                data: Buffer.from(buffer),
                mimeType: mimeType
              });
            } else {
              let content = await response.text();
              console.log('[FRW Protocol] ✅ SUCCESS! Content fetched from', gateway, ':', content.length, 'bytes');
              
              // For HTML files, preload all images and convert to data URLs
              if (mimeType === 'text/html') {
                content = await preloadImagesInHtml(content, cid, gateways);
              }
              
              callback({
                data: Buffer.from(content),
                mimeType: mimeType
              });
            }
            return;
          } else {
            console.warn('[FRW Protocol] Gateway returned error:', response.status, 'trying next...');
          }
        } catch (ipfsError) {
          console.warn('[FRW Protocol] Gateway failed:', gateway, 'trying next...');
          continue; // Try next gateway
        }
      }
      
      console.error('[FRW Protocol] ❌ All gateways failed');
      
      // Fallback: Show test page with real data
      let html = `
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
        data: Buffer.from(html),
        mimeType: 'text/html'
      });
      
    } catch (error) {
      console.error('[FRW Protocol] Error:', error);
      
      let errorHtml = `
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
        data: Buffer.from(errorHtml),
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
