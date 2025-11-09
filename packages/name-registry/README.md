# @frw/name-registry

Decentralized name registry with anti-squatting mechanisms for FRW protocol.

## Features

### Phase 1 (Implemented)
- Content metrics collection from IPFS
- Time-locked challenge system
- Automatic dispute resolution
- Economic bonding mechanism

### Phase 2 (Planned - 6 months)
- Trust graph and reputation system
- Community voting with reputation weighting
- Social verification layer

### Phase 3 (Planned - 1 year)
- Cryptographic sortition for jury selection
- Zero-knowledge proofs for usage verification
- Advanced privacy-preserving mechanisms

## Installation

```bash
npm install @frw/name-registry
```

## Usage

```typescript
import { MetricsCollector, ChallengeSystem } from '@frw/name-registry';

// Initialize metrics collector
const collector = new MetricsCollector(ipfs, db);

// Collect metrics for a name
const metrics = await collector.collectMetrics(publicKey);

// Create challenge system
const challenges = new ChallengeSystem(collector, registry, bondManager);

// Challenge a name
const challenge = await challenges.createChallenge(
    'alice',
    challengerKey,
    privateKey,
    'squatting',
    evidence,
    1000000n
);
```

## Documentation

See `docs/NAME_REGISTRY_SPEC.md` for complete specification.

## License

MIT
