# FRW V2 QUANTUM-RESISTANT PACKAGES

## PACKAGE STRUCTURE

```
packages/
├── crypto-pq/          Post-quantum cryptography
├── pow-v2/             Argon2id-based proof of work
└── protocol-v2/        V2 protocol implementation
```

## INSTALLATION

```bash
# Install all V2 packages
cd packages/crypto-pq && npm install && npm run build
cd ../pow-v2 && npm install && npm run build
cd ../protocol-v2 && npm install && npm run build
```

## USAGE

### Generate V2 Keypair

```typescript
import { generateKeyPairV2 } from '@frw/crypto-pq';

const keyPair = generateKeyPairV2();
// Returns: {
//   publicKey_ed25519: Uint8Array(32),
//   privateKey_ed25519: Uint8Array(64),
//   publicKey_dilithium3: Uint8Array(1952),
//   privateKey_dilithium3: Uint8Array(4000),
//   did: 'did:frw:v2:...'
// }
```

### Sign Message

```typescript
import { signV2 } from '@frw/crypto-pq';

const message = new TextEncoder().encode('Hello, quantum world!');
const signature = signV2(message, keyPair);
// Returns: {
//   version: 2,
//   signature_ed25519: Uint8Array(64),
//   signature_dilithium3: Uint8Array(3293),
//   timestamp: number,
//   algorithm: 'hybrid-v2'
// }
```

### Generate Proof of Work

```typescript
import { generatePOWV2 } from '@frw/pow-v2';

const proof = await generatePOWV2(
  'myname',
  keyPair.publicKey_dilithium3,
  (progress) => {
    console.log(`${progress.attempts} attempts, ${progress.hashes_per_sec} H/s`);
  }
);
// Returns: {
//   version: 2,
//   nonce: bigint,
//   timestamp: number,
//   hash: Uint8Array(32),
//   difficulty: number,
//   memory_cost_mib: number,
//   time_cost: number,
//   parallelism: 4
// }
```

### Create V2 Record

```typescript
import { createRecordV2 } from '@frw/protocol-v2';

const record = createRecordV2(
  'myname',
  'bafybeigdyrzt5...',  // content CID
  'k51qzi5uqu5...',     // IPNS key
  keyPair,
  proof
);
// Returns: DistributedNameRecordV2
```

### Verify V2 Record

```typescript
import { verifyRecordV2 } from '@frw/protocol-v2';

const verification = await verifyRecordV2(record);
// Returns: {
//   valid: boolean,
//   pqSecure: boolean,
//   errors: string[],
//   checks: {
//     pow: boolean,
//     signature_ed25519: boolean,
//     signature_dilithium3: boolean,
//     hash_chain: boolean,
//     expiration: boolean,
//     name_format: boolean
//   }
// }
```

## DEPENDENCIES

```json
{
  "@noble/post-quantum": "^0.2.0",
  "@noble/hashes": "^1.4.0",
  "argon2": "^0.31.0",
  "cbor-x": "^1.5.0",
  "tweetnacl": "^1.0.3",
  "bs58": "^5.0.0"
}
```

## TESTING

```bash
# Run tests for each package
cd packages/crypto-pq && npm test
cd ../pow-v2 && npm test
cd ../protocol-v2 && npm test
```

## DOCUMENTATION

- Full specification: `docs/protocol/FRW_PROTOCOL_V2_SPEC.md`
- Test vectors: `docs/protocol/TEST_VECTORS_V2.md`
- Security proofs: `docs/protocol/FORMAL_PROOFS_V2.md`
- Migration guide: `docs/protocol/MIGRATION_PATH_V2.md`

## NOTES

- Lint errors for missing dependencies are expected until `npm install` is run
- Packages are TypeScript-only, compile to JavaScript with `npm run build`
- V2 protocol is backward-compatible with V1 until 2035
