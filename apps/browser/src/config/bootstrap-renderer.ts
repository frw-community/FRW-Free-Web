/**
 * Bootstrap Configuration for FRW Browser - Renderer Process
 * 
 * Browser-safe utilities for the renderer process.
 * Does NOT import any Node.js modules.
 */

/**
 * Bootstrap node URLs for distributed name registry
 * These are HTTP endpoints that maintain the global name index
 */
export function getBootstrapUrls(): string[] {
  return [
    'http://83.228.214.189:3100',  // Swiss Bootstrap #1
    'http://83.228.213.45:3100',   // Swiss Bootstrap #2
    'http://83.228.213.240:3100',  // Swiss Bootstrap #3
    'http://83.228.214.72:3100',   // Swiss Bootstrap #4
  ];
}

/**
 * Query name from distributed registry
 * Used by renderer process (ContentViewer component)
 * 
 * @param name - The name to resolve (e.g., 'example')
 * @returns Name record with content CID, public key, timestamp, etc.
 */
export async function queryName(name: string): Promise<{
  name: string;
  publicKey: string;
  contentCID: string;
  timestamp: number;
  signature: string;
}> {
  // Try bootstrap nodes directly (fast HTTP queries)
  const bootstrapNodes = getBootstrapUrls();
  
  for (const node of bootstrapNodes) {
    try {
      const response = await fetch(`${node}/api/resolve/${name}`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout per node
      });
      
      if (response.ok) {
        const data = await response.json() as {
          name: string;
          publicKey: string;
          contentCID: string;
          timestamp: number;
          signature: string;
        };
        return {
          name: data.name,
          publicKey: data.publicKey,
          contentCID: data.contentCID,
          timestamp: data.timestamp,
          signature: data.signature,
        };
      }
    } catch (error) {
      console.warn(`[Bootstrap] Failed to query ${node}:`, error);
      // Continue to next bootstrap node
    }
  }
  
  // All bootstrap nodes failed
  throw new Error(`Name '${name}' not found in distributed registry`);
}
