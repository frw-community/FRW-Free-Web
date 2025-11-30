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
    'http://83.228.213.240:3100',
    'http://83.228.213.45:3100',
    'http://83.228.214.189:3100',
    "http://155.117.46.244:3100",
    "http://165.73.244.107:3100",
    "http://165.73.244.74:3100",
    'http://83.228.214.72:3100'
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
  version?: number;
  pqSecure?: boolean;
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
        const data = await response.json() as any;
        
        // Handle both V1 and V2 records
        if (data.version === 2) {
          // V2 record with quantum-resistant signatures
          return {
            name: data.name,
            publicKey: data.publicKey_dilithium3 || data.publicKey_ed25519, // Use PQ key as primary
            contentCID: data.contentCID,
            timestamp: data.registered,
            signature: data.signature_dilithium3 || data.signature_ed25519,
            version: 2,
            pqSecure: true
          };
        } else {
          // V1 record (legacy)
          return {
            name: data.name,
            publicKey: data.publicKey,
            contentCID: data.contentCID,
            timestamp: data.timestamp,
            signature: data.signature,
            version: 1,
            pqSecure: false
          };
        }
      }
    } catch (error) {
      console.warn(`[Bootstrap] Failed to query ${node}:`, error);
      // Continue to next bootstrap node
    }
  }
  
  // All bootstrap nodes failed
  throw new Error(`Name '${name}' not found in distributed registry`);
}
