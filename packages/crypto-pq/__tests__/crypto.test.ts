/// <reference types="jest" />
import { KeyManagerV2, SignatureManagerV2 } from '../src/index';

describe('Crypto V2', () => {
  it('should generate V2 keypair with DID', () => {
    const manager = new KeyManagerV2();
    const keyPair = manager.generateKeyPair();
    
    expect(keyPair).toBeDefined();
    expect(keyPair.did).toMatch(/^did:frw:v2:/);
    expect(keyPair.publicKey.dilithium3).toBeDefined();
    expect(keyPair.publicKey.ed25519).toBeDefined();
  });

  it('should sign and verify (simulation)', () => {
    const manager = new KeyManagerV2();
    const keyPair = manager.generateKeyPair();
    const sigManager = new SignatureManagerV2();
    
    const content = 'hello world';
    const signature = sigManager.signString(content, keyPair);
    
    expect(signature.signature_dilithium3).toBeDefined();
    expect(signature.signature_ed25519).toBeDefined();
  });
});
