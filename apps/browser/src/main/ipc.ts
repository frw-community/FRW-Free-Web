import { ipcMain } from 'electron';
import { IPFSClient } from '@frw/ipfs';
import { SignatureManager } from '@frw/crypto';
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

  // Verify page signature
  ipcMain.handle('verify:page', async (_, content: string, publicKey: string) => {
    try {
      const publicKeyBytes = SignatureManager.decodePublicKey(publicKey);
      const isValid = SignatureManager.verifyPage(content, publicKeyBytes);
      return { valid: isValid };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get page metadata
  ipcMain.handle('page:metadata', async (_, content: string) => {
    try {
      // Extract metadata from HTML
      const versionMatch = content.match(/<meta name="frw-version" content="([^"]+)"/);
      const authorMatch = content.match(/<meta name="frw-author" content="([^"]+)"/);
      const dateMatch = content.match(/<meta name="frw-date" content="([^"]+)"/);
      const signatureMatch = content.match(/<meta name="frw-signature" content="([^"]+)"/);

      return {
        version: versionMatch?.[1],
        author: authorMatch?.[1],
        date: dateMatch?.[1],
        signature: signatureMatch?.[1]
      };
    } catch (error) {
      return null;
    }
  });
}
