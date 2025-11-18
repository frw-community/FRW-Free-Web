import { ipcMain } from 'electron';
import { IPFSClient } from '@frw/ipfs';
import { SignatureManager } from '@frw/crypto';
import { SignatureManagerV2 } from '@frw/crypto-pq';
import { FRWNamingSystem } from '@frw/protocol';

const ipfsClient = new IPFSClient({
  host: 'localhost',
  port: 5001,
  protocol: 'http'
});

const namingSystem = new FRWNamingSystem();

export function setupIPC() {
  // Check IPFS connection
  ipcMain.handle('ipfs:check', async () => {
    try {
      await ipfsClient.init();
      return { connected: true };
    } catch {
      return { connected: false };
    }
  });

  // Resolve name to public key
  ipcMain.handle('name:resolve', async (_, name: string) => {
    try {
      const record = await namingSystem.resolveName(name);
      return record;
    } catch (error) {
      return null;
    }
  });

  // Verify page signature (V1 or V2)
  ipcMain.handle('verify:page', async (_, content: string, publicKeyOrRecord: string | any) => {
    try {
      // Detect V2 signature
      const versionMatch = content.match(/<meta name="frw-version" content="2"/);
      const isV2 = !!versionMatch;

      if (isV2) {
        // V2 verification (Dilithium3 + Ed25519)
        const didMatch = content.match(/<meta name="frw-did" content="([^"]+)"/);
        const sig_dilithium3Match = content.match(/<meta name="frw-signature-dilithium3" content="([^"]+)"/);
        const sig_ed25519Match = content.match(/<meta name="frw-signature-ed25519" content="([^"]+)"/);

        if (!sig_dilithium3Match || !sig_ed25519Match) {
          return { valid: false, error: 'V2 signatures not found in content' };
        }

        // Remove signature meta tags to get original content
        let originalContent = content
          .replace(/<meta name="frw-version" content="2">\s*/g, '')
          .replace(/<meta name="frw-did" content="[^"]+"\s*>\s*/g, '')
          .replace(/<meta name="frw-signature-dilithium3" content="[^"]+"\s*>\s*/g, '')
          .replace(/<meta name="frw-signature-ed25519" content="[^"]+"\s*>\s*/g, '');

        const signature = {
          version: 2 as const,
          signature_dilithium3: new Uint8Array(Buffer.from(sig_dilithium3Match[1], 'base64')),
          signature_ed25519: new Uint8Array(Buffer.from(sig_ed25519Match[1], 'base64')),
          timestamp: Date.now(),
          algorithm: 'hybrid-v2' as const
        };

        // Extract public keys from resolved record
        let publicKey_ed25519: Uint8Array;
        let publicKey_dilithium3: Uint8Array;
        let did: string;

        if (typeof publicKeyOrRecord === 'string') {
          return { valid: false, error: 'V2 verification requires full record with public keys' };
        } else if (publicKeyOrRecord.record) {
          // ResolvedNameV2 format
          publicKey_ed25519 = new Uint8Array(publicKeyOrRecord.record.publicKey_ed25519);
          publicKey_dilithium3 = new Uint8Array(publicKeyOrRecord.record.publicKey_dilithium3);
          did = publicKeyOrRecord.record.did;
        } else {
          // Direct record format
          publicKey_ed25519 = new Uint8Array(publicKeyOrRecord.publicKey_ed25519);
          publicKey_dilithium3 = new Uint8Array(publicKeyOrRecord.publicKey_dilithium3);
          did = publicKeyOrRecord.did;
        }

        // Create keypair object for verification (only public keys needed)
        const keyPair = {
          publicKey_ed25519,
          publicKey_dilithium3,
          did,
          privateKey_ed25519: new Uint8Array(64), // Not needed for verification
          privateKey_dilithium3: new Uint8Array(4032) // Not needed for verification
        };

        const signatureManager = new SignatureManagerV2();
        const isValid = signatureManager.verifyString(originalContent, signature, keyPair);
        
        return { valid: isValid, version: 2, did };
      } else {
        // V1 verification (Ed25519 only)
        const publicKey = typeof publicKeyOrRecord === 'string' 
          ? publicKeyOrRecord 
          : (publicKeyOrRecord.record?.publicKey || publicKeyOrRecord.publicKey);
        const publicKeyBytes = SignatureManager.decodePublicKey(publicKey);
        const isValid = SignatureManager.verifyPage(content, publicKeyBytes);
        return { valid: isValid, version: 1 };
      }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get page metadata (V1 or V2)
  ipcMain.handle('page:metadata', async (_, content: string) => {
    try {
      // Extract metadata from HTML
      const versionMatch = content.match(/<meta name="frw-version" content="([^"]+)"/);
      const version = versionMatch?.[1];

      if (version === '2') {
        // V2 metadata
        const didMatch = content.match(/<meta name="frw-did" content="([^"]+)"/);
        const sig_dilithium3Match = content.match(/<meta name="frw-signature-dilithium3" content="([^"]+)"/);
        const sig_ed25519Match = content.match(/<meta name="frw-signature-ed25519" content="([^"]+)"/);
        
        return {
          version: 2,
          did: didMatch?.[1],
          signatureDilithium3: sig_dilithium3Match?.[1],
          signatureEd25519: sig_ed25519Match?.[1],
          quantumSafe: true
        };
      } else {
        // V1 metadata
        const authorMatch = content.match(/<meta name="frw-author" content="([^"]+)"/);
        const dateMatch = content.match(/<meta name="frw-date" content="([^"]+)"/);
        const signatureMatch = content.match(/<meta name="frw-signature" content="([^"]+)"/);

        return {
          version: 1,
          author: authorMatch?.[1],
          date: dateMatch?.[1],
          signature: signatureMatch?.[1],
          quantumSafe: false
        };
      }
    } catch (error) {
      return null;
    }
  });
}
