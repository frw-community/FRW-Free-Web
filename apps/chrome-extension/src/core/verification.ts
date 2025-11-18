/**
 * Content Signature Verification
 * Supports V1 (Ed25519) and V2 (Dilithium3 + Ed25519) signatures
 */

import { SignatureManager } from '@frw/crypto';
import { SignatureManagerV2 } from '@frw/crypto-pq';
import type { NameRecord } from './resolver';

export interface VerificationResult {
  valid: boolean;
  version: 1 | 2;
  error?: string;
  did?: string;
  quantumSafe?: boolean;
}

/**
 * Verify content signature (V1 or V2)
 */
export async function verifyContent(
  content: string,
  record: NameRecord
): Promise<VerificationResult> {
  try {
    // Detect V2 signature
    const versionMatch = content.match(/<meta name="frw-version" content="2"/);
    const isV2 = !!versionMatch;

    if (isV2) {
      return await verifyV2Content(content, record);
    } else {
      return verifyV1Content(content, record);
    }
  } catch (error) {
    return {
      valid: false,
      version: 1,
      error: error instanceof Error ? error.message : 'Unknown verification error'
    };
  }
}

/**
 * Verify V1 content (Ed25519)
 */
function verifyV1Content(content: string, record: NameRecord): VerificationResult {
  try {
    // V1 signatures are embedded differently - check if it's a signed page
    const signatureMatch = content.match(/<meta name="frw-signature" content="([^"]+)"/);
    
    if (!signatureMatch) {
      // No signature in content, assume valid (content-addressed via CID)
      return {
        valid: true,
        version: 1,
        quantumSafe: false
      };
    }

    const publicKeyBytes = SignatureManager.decodePublicKey(record.publicKey);
    const isValid = SignatureManager.verifyPage(content, publicKeyBytes);
    
    return {
      valid: isValid,
      version: 1,
      quantumSafe: false
    };
  } catch (error) {
    return {
      valid: false,
      version: 1,
      error: error instanceof Error ? error.message : 'V1 verification failed'
    };
  }
}

/**
 * Verify V2 content (Dilithium3 + Ed25519)
 */
async function verifyV2Content(content: string, record: NameRecord): Promise<VerificationResult> {
  try {
    // Extract V2 signatures from content
    const didMatch = content.match(/<meta name="frw-did" content="([^"]+)"/);
    const sig_dilithium3Match = content.match(/<meta name="frw-signature-dilithium3" content="([^"]+)"/);
    const sig_ed25519Match = content.match(/<meta name="frw-signature-ed25519" content="([^"]+)"/);

    if (!sig_dilithium3Match || !sig_ed25519Match) {
      return {
        valid: false,
        version: 2,
        error: 'V2 signatures not found in content'
      };
    }

    // Check if record has V2 public keys
    if (!record.publicKey_dilithium3 || !record.publicKey_ed25519) {
      return {
        valid: false,
        version: 2,
        error: 'V2 public keys not found in record'
      };
    }

    // Remove signature meta tags to get original content
    let originalContent = content
      .replace(/<meta name="frw-version" content="2">\s*/g, '')
      .replace(/<meta name="frw-did" content="[^"]+"\s*>\s*/g, '')
      .replace(/<meta name="frw-signature-dilithium3" content="[^"]+"\s*>\s*/g, '')
      .replace(/<meta name="frw-signature-ed25519" content="[^"]+"\s*>\s*/g, '');

    // Reconstruct signature object
    const signature = {
      version: 2 as const,
      signature_dilithium3: base64ToUint8Array(sig_dilithium3Match[1]),
      signature_ed25519: base64ToUint8Array(sig_ed25519Match[1]),
      timestamp: Date.now(),
      algorithm: 'hybrid-v2' as const
    };

    // Create keypair object for verification (only public keys needed)
    const keyPair = {
      publicKey_ed25519: base64ToUint8Array(record.publicKey_ed25519!),
      publicKey_dilithium3: base64ToUint8Array(record.publicKey_dilithium3!),
      did: record.did!,
      privateKey_ed25519: new Uint8Array(64), // Not needed for verification
      privateKey_dilithium3: new Uint8Array(4032) // Not needed for verification
    };

    // Verify signature
    const signatureManager = new SignatureManagerV2();
    const isValid = signatureManager.verifyString(originalContent, signature, keyPair);
    
    return {
      valid: isValid,
      version: 2,
      did: record.did,
      quantumSafe: true
    };
  } catch (error) {
    return {
      valid: false,
      version: 2,
      error: error instanceof Error ? error.message : 'V2 verification failed'
    };
  }
}

/**
 * Convert base64 to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
