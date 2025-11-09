# FRW Quantum Resistance Plan

**Date:** November 9, 2025  
**Status:** Critical for long-term security

---

## The Quantum Threat

### Timeline

**Current Consensus:**
- **2030-2035:** First practical quantum computers capable of breaking current crypto
- **2040:** Quantum computers widely available
- **Risk:** "Harvest now, decrypt later" attacks happening TODAY

### What's at Risk

**Vulnerable:**
- [FAILED] Ed25519 signatures (current FRW)
- [FAILED] ECDSA
- [FAILED] RSA
- [FAILED] Diffie-Hellman key exchange

**Safe:**
- [DONE] SHA-256/SHA-3 hashing
- [DONE] AES-256 symmetric encryption
- [DONE] Post-quantum algorithms (CRYSTALS, SPHINCS+)

### FRW's Exposure

```
Every piece of FRW content is signed with Ed25519
↓
Quantum computer breaks Ed25519
↓
Attacker can forge any signature
↓
Can publish fake content as anyone
↓
TOTAL SYSTEM COMPROMISE
```

**This is why quantum resistance is CRITICAL.**

---

## NIST Post-Quantum Standards

### Approved Algorithms (2024)

**Digital Signatures:**
1. **CRYSTALS-Dilithium** (Recommended)
   - Lattice-based
   - Fast verification
   - Small signatures (~2.4KB)
   - NIST Primary Standard

2. **Falcon**
   - Lattice-based
   - Smaller signatures (~1.3KB)
   - Slower key generation
   - NIST Alternative

3. **SPHINCS+**
   - Hash-based
   - Larger signatures (~17KB)
   - No mathematical assumptions
   - NIST Backup

**Key Encapsulation:**
4. **CRYSTALS-Kyber**
   - For encryption/key exchange
   - Fast and efficient
   - Small keys and ciphertexts

---

## FRW Hybrid Cryptography Strategy

### Phase 1: Dual Signatures (Immediate)

```typescript
interface HybridSignature {
    // Classical signature (for backward compatibility)
    classical: {
        algorithm: 'Ed25519';
        publicKey: Buffer;  // 32 bytes
        signature: Buffer;  // 64 bytes
    };
    
    // Post-quantum signature (for future security)
    postQuantum: {
        algorithm: 'CRYSTALS-Dilithium';
        publicKey: Buffer;  // ~1952 bytes
        signature: Buffer;  // ~2420 bytes
    };
    
    // Metadata
    timestamp: number;
    version: number;
}

// Both signatures must be valid
function verifyHybrid(content: Buffer, sig: HybridSignature): boolean {
    const ed25519Valid = ed25519.verify(
        content,
        sig.classical.signature,
        sig.classical.publicKey
    );
    
    const dilithiumValid = dilithium.verify(
        content,
        sig.postQuantum.signature,
        sig.postQuantum.publicKey
    );
    
    // BOTH must pass
    return ed25519Valid && dilithiumValid;
}
```

**Benefits:**
- [DONE] Backward compatible (old clients still work)
- [DONE] Quantum-safe from day 1
- [DONE] Gradual migration path
- [DONE] No flag day required

**Costs:**
- [FAILED] Larger signatures (~2.5KB vs 64 bytes)
- [FAILED] Slower signing (~2x time)
- [FAILED] More bandwidth

**Decision:** Worth it for long-term security

---

## Implementation Plan

### Month 1: Foundation

**Week 1-2: Library Integration**

```bash
# Install post-quantum library
npm install @noble/post-quantum
npm install liboqs-node

# Or use WebAssembly for browser
npm install pqc-wasm
```

```typescript
// packages/crypto/src/post-quantum/dilithium.ts
import { dilithium } from '@noble/post-quantum';

export class DilithiumSigner {
    /**
     * Generate post-quantum keypair
     */
    static generateKeyPair(): {
        publicKey: Uint8Array;
        privateKey: Uint8Array;
    } {
        return dilithium.keygen();
    }
    
    /**
     * Sign content with Dilithium
     */
    static sign(content: Uint8Array, privateKey: Uint8Array): Uint8Array {
        return dilithium.sign(content, privateKey);
    }
    
    /**
     * Verify Dilithium signature
     */
    static verify(
        content: Uint8Array,
        signature: Uint8Array,
        publicKey: Uint8Array
    ): boolean {
        return dilithium.verify(signature, content, publicKey);
    }
}
```

**Week 3-4: Hybrid System**

```typescript
// packages/crypto/src/hybrid/signer.ts
export class HybridSigner {
    private ed25519PrivateKey: Buffer;
    private dilithiumPrivateKey: Buffer;
    
    constructor(keys: {
        ed25519: Buffer;
        dilithium: Buffer;
    }) {
        this.ed25519PrivateKey = keys.ed25519;
        this.dilithiumPrivateKey = keys.dilithium;
    }
    
    /**
     * Sign with both algorithms
     */
    async signHybrid(content: Buffer): Promise<HybridSignature> {
        // Sign with Ed25519
        const ed25519Sig = await SignatureManager.sign(
            content,
            this.ed25519PrivateKey
        );
        
        // Sign with Dilithium
        const dilithiumSig = DilithiumSigner.sign(
            content,
            this.dilithiumPrivateKey
        );
        
        return {
            classical: {
                algorithm: 'Ed25519',
                publicKey: derivePublicKey(this.ed25519PrivateKey),
                signature: ed25519Sig
            },
            postQuantum: {
                algorithm: 'CRYSTALS-Dilithium',
                publicKey: DilithiumSigner.derivePublicKey(this.dilithiumPrivateKey),
                signature: dilithiumSig
            },
            timestamp: Date.now(),
            version: 1
        };
    }
    
    /**
     * Verify hybrid signature
     */
    static async verifyHybrid(
        content: Buffer,
        signature: HybridSignature
    ): Promise<{
        valid: boolean;
        details: {
            ed25519: boolean;
            dilithium: boolean;
        };
    }> {
        const ed25519Valid = await SignatureManager.verify(
            content,
            signature.classical.signature,
            signature.classical.publicKey
        );
        
        const dilithiumValid = DilithiumSigner.verify(
            content,
            signature.postQuantum.signature,
            signature.postQuantum.publicKey
        );
        
        return {
            valid: ed25519Valid && dilithiumValid,
            details: {
                ed25519: ed25519Valid,
                dilithium: dilithiumValid
            }
        };
    }
}
```

### Month 2: CLI Integration

```typescript
// apps/cli/src/commands/init.ts

// Generate hybrid keypair
async function generateHybridKeys(password?: string) {
    logger.info('Generating quantum-resistant keypair...');
    logger.info('This may take a few seconds...');
    
    // Generate Ed25519 (fast)
    const ed25519Keys = KeyManager.generateKeyPair();
    
    // Generate Dilithium (slower)
    const dilithiumKeys = DilithiumSigner.generateKeyPair();
    
    // Encrypt both with same password
    const encrypted = await encryptHybridKeys({
        ed25519: ed25519Keys,
        dilithium: dilithiumKeys
    }, password);
    
    // Save
    await saveHybridKeys(encrypted);
    
    logger.success('[x] Quantum-resistant keypair generated');
    logger.info('  Ed25519: ' + encodePublicKey(ed25519Keys.publicKey));
    logger.info('  Dilithium: ' + encodeDilithiumKey(dilithiumKeys.publicKey));
}
```

### Month 3: Protocol Update

```typescript
// Update FRW protocol to support hybrid signatures

interface FRWContent {
    version: 2;  // Bump version for hybrid support
    name: string;
    timestamp: number;
    content: Buffer;
    signature: HybridSignature;  // NEW: Hybrid instead of single
}

// Backward compatibility
function verifyContent(content: FRWContent): boolean {
    if (content.version === 1) {
        // Old single signature
        return SignatureManager.verify(
            content.content,
            content.signature,
            content.publicKey
        );
    }
    
    if (content.version === 2) {
        // New hybrid signature
        return HybridSigner.verifyHybrid(
            content.content,
            content.signature
        ).valid;
    }
    
    throw new Error('Unsupported version');
}
```

---

## Performance Impact

### Signature Sizes

| Algorithm | Public Key | Signature | Total |
|-----------|------------|-----------|-------|
| Ed25519 | 32 bytes | 64 bytes | 96 bytes |
| Dilithium | 1952 bytes | 2420 bytes | 4372 bytes |
| **Hybrid** | **1984 bytes** | **2484 bytes** | **4468 bytes** |

**Impact:** ~46x larger signatures

**Mitigation:**
- Compress signatures (gzip reduces to ~2KB)
- Only transmit full signatures once, use hashes after
- Use Falcon for size-critical applications (smaller)

### Speed Comparison

| Operation | Ed25519 | Dilithium | Slowdown |
|-----------|---------|-----------|----------|
| Key Gen | 0.05ms | 0.5ms | 10x |
| Sign | 0.02ms | 0.15ms | 7x |
| Verify | 0.05ms | 0.10ms | 2x |

**Impact:** Signing 7x slower

**Mitigation:**
- Sign content once, publish many times
- Use worker threads for signing
- Cache signatures

---

## Migration Strategy

### Phase 1: Opt-In (Months 1-6)

```bash
# Users can choose quantum-resistant keys
frw init --quantum-safe

# Or migrate existing keys
frw keys migrate-quantum
```

- Old keys still work
- New signatures use hybrid
- No breaking changes

### Phase 2: Default (Months 7-12)

```bash
# New users get hybrid keys by default
frw init
# Generates hybrid keypair automatically

# Old users warned to upgrade
frw status
# [!] Warning: Using legacy keys, not quantum-safe
#   Run: frw keys migrate-quantum
```

- Hybrid is default for new users
- Old users see warnings
- Grace period for migration

### Phase 3: Required (Year 2+)

```bash
# Legacy keys deprecated
frw publish
# ✗ Error: Legacy keys no longer supported
#   Run: frw keys migrate-quantum
```

- All signatures must be hybrid
- Legacy content still verifiable (backward compat)
- Network fully quantum-resistant

---

## Key Management

### Dual Keypairs

```typescript
interface QuantumSafeKeys {
    // User identity
    userId: string;
    
    // Classical keys (legacy)
    ed25519: {
        public: Buffer;
        private: Buffer;  // Encrypted
    };
    
    // Post-quantum keys
    dilithium: {
        public: Buffer;
        private: Buffer;  // Encrypted
    };
    
    // Metadata
    created: number;
    version: number;
    algorithm: {
        classical: 'Ed25519';
        postQuantum: 'CRYSTALS-Dilithium';
    };
}
```

### Key Rotation

```typescript
// Rotate to quantum-safe keys
async function rotateToQuantumSafe(
    oldKeys: ClassicalKeys,
    password: string
): Promise<QuantumSafeKeys> {
    // Generate new quantum-safe keys
    const dilithiumKeys = DilithiumSigner.generateKeyPair();
    
    // Create rotation certificate
    const cert: KeyRotationCert = {
        oldPublicKey: oldKeys.publicKey,
        newClassicalKey: oldKeys.publicKey,  // Same for compatibility
        newQuantumKey: dilithiumKeys.publicKey,
        signedByOld: sign(dilithiumKeys.publicKey, oldKeys.privateKey),
        signedByNew: dilithiumSign(oldKeys.publicKey, dilithiumKeys.privateKey),
        timestamp: Date.now()
    };
    
    // Publish rotation
    await publishRotation(cert);
    
    // Return hybrid keys
    return {
        userId: deriveUserId(oldKeys.publicKey),
        ed25519: oldKeys,
        dilithium: dilithiumKeys,
        created: Date.now(),
        version: 2,
        algorithm: {
            classical: 'Ed25519',
            postQuantum: 'CRYSTALS-Dilithium'
        }
    };
}
```

---

## Browser Support

### WebAssembly Implementation

```typescript
// packages/crypto/src/wasm/dilithium.wasm.ts
import dilithiumWasm from 'pqc-wasm/dilithium';

export class DilithiumWasm {
    private static instance: any;
    
    static async init(): Promise<void> {
        if (!this.instance) {
            this.instance = await dilithiumWasm();
        }
    }
    
    static async sign(content: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
        await this.init();
        return this.instance.sign(content, privateKey);
    }
    
    static async verify(
        content: Uint8Array,
        signature: Uint8Array,
        publicKey: Uint8Array
    ): Promise<boolean> {
        await this.init();
        return this.instance.verify(signature, content, publicKey);
    }
}
```

### Performance in Browser

- Initial load: ~200KB WASM module
- Sign: ~150ms (slower than native)
- Verify: ~100ms
- Still acceptable for user-facing operations

---

## Testing & Validation

### Test Vectors

```typescript
describe('Quantum-Safe Cryptography', () => {
    it('should generate valid hybrid keypairs', async () => {
        const keys = await HybridSigner.generateKeys();
        
        expect(keys.ed25519.publicKey).toHaveLength(32);
        expect(keys.dilithium.publicKey).toHaveLength(1952);
    });
    
    it('should sign and verify with hybrid signatures', async () => {
        const keys = await HybridSigner.generateKeys();
        const content = Buffer.from('test content');
        
        const signature = await HybridSigner.signHybrid(content, keys);
        const result = await HybridSigner.verifyHybrid(content, signature);
        
        expect(result.valid).toBe(true);
        expect(result.details.ed25519).toBe(true);
        expect(result.details.dilithium).toBe(true);
    });
    
    it('should fail if either signature is invalid', async () => {
        const signature = { /* tampered */ };
        const result = await HybridSigner.verifyHybrid(content, signature);
        
        expect(result.valid).toBe(false);
    });
});
```

### Cross-Implementation Testing

```typescript
// Test against reference implementations
import { testVectors } from 'nist-pqc-test-vectors';

for (const vector of testVectors.dilithium) {
    const result = DilithiumSigner.verify(
        vector.message,
        vector.signature,
        vector.publicKey
    );
    
    expect(result).toBe(vector.valid);
}
```

---

## Timeline Summary

| Month | Milestone | Deliverable |
|-------|-----------|-------------|
| 1 | Library integration | Dilithium working |
| 2 | Hybrid system | Dual signatures |
| 3 | CLI integration | User-facing commands |
| 4 | Protocol update | Version 2 spec |
| 5 | Browser support | WASM implementation |
| 6 | Testing & audit | Security review |
| 7-12 | Migration | Gradual rollout |
| 13+ | Full adoption | Legacy deprecated |

---

## Success Criteria

[DONE] **Implementation Complete When:**
- All new content signed with hybrid signatures
- Browser and CLI both support quantum-safe keys
- <5% performance degradation
- External audit passed
- Migration path documented

[DONE] **System is Quantum-Safe When:**
- 90%+ of users on hybrid keys
- Legacy keys deprecated
- No single point of quantum vulnerability
- Regular security reviews

---

## Conclusion

**FRW will be quantum-resistant BEFORE quantum computers are a threat.**

Unlike systems that will need emergency migrations, FRW is planning ahead. By implementing hybrid cryptography now, we ensure:

1. **No emergency**: Gradual migration, not panic
2. **No breaking changes**: Backward compatible
3. **No data loss**: All content remains valid
4. **Future-proof**: Ready for post-quantum world

**Next Steps:**
1. Finalize algorithm selection (Dilithium vs Falcon)
2. Prototype implementation (2 weeks)
3. Performance testing (1 week)
4. Integration into CLI (2 weeks)
5. Public beta (Month 3)

**Investment:** 3 months of development for 20+ years of security.

**Worth it:** Absolutely.
