# FRW Name Registry Anti-Squatting Specification

Technical specification for decentralized name dispute resolution.

## Overview

Multi-phase implementation combining objective IPFS metrics, economic incentives, and cryptographic verification to prevent name squatting while maintaining decentralization.

## Architecture

### Core Components

1. **Content Metrics Engine** - Measures usage from IPFS data
2. **Challenge System** - Economic bonding and disputes
3. **Trust Graph** - Social verification (Phase 2)
4. **Voting System** - Community governance (Phase 2)
5. **Jury Selection** - Cryptographic sortition (Phase 3)
6. **ZK Proofs** - Privacy-preserving verification (Phase 3)

### Data Sources

- IPFS peer connection logs
- IPNS update history
- Content statistics
- DHT query patterns
- Signature verifications

## Implementation Phases

### Phase 1: Launch (Immediate)

**Content Metrics + Time-Locked Challenges**

Metrics collected automatically from IPFS:
- Peer connections
- Content fetches
- IPNS updates
- Content size and complexity
- Inbound links
- Verification count

Challenge mechanism:
- Economic bond required
- 30-day response period
- Automatic resolution via metrics
- Bond distribution to winner

### Phase 2: 6 Months (Trust Graph + Community Voting)

**Status:** Architecture defined, implementation planned

**Trigger Conditions:**
- Network has 1000+ active users
- 100+ challenges completed
- Metrics show need for social layer (close-call disputes >5%)

**Components:**

#### Trust Graph System
- User attestations (identity, reputation, expertise)
- Trust score calculation (0-1000)
- Trust path discovery (6 degrees max)
- Attestation management and revocation

#### Reputation System
- Activity-based scoring (content, updates, participation)
- Tier system (BRONZE → SILVER → GOLD → PLATINUM)
- Reputation requirements for privileges
- Decay for inactivity

#### Community Voting
- Escalation for close-call challenges (score diff < 20%)
- Reputation-weighted ballots
- 14-day voting period
- 60% supermajority required
- Quorum of 100 minimum votes

**CLI Commands:**
```bash
frw trust attest <publicKey> --type identity --strength 8
frw trust score <publicKey>
frw reputation show <publicKey>
frw vote cast <voteId> --choice 0
```

**See:** `docs/NAME_REGISTRY_PHASE2_SPEC.md` for detailed implementation

### Phase 3: 1 Year (Cryptographic Jury + ZK Proofs)

**Status:** Research phase, specifications to be defined

**Components:**
- Cryptographic sortition for unbiased jury selection
- Stake-weighted random sampling
- Zero-knowledge proofs for usage verification
- Privacy-preserving metrics

**See:** Phase 3 specification (TBD)

---

## Implementation Status

| Phase | Component | Status | Completion |
|-------|-----------|--------|------------|
| 1 | Content Metrics | ✅ Complete | 100% |
| 1 | Challenge System | ✅ Complete | 100% |
| 1 | DNS Verification | ✅ Complete | 100% |
| 1 | Automatic Resolution | ✅ Complete | 100% |
| 2 | Trust Graph | 📋 Planned | 0% |
| 2 | Reputation System | 📋 Planned | 0% |
| 2 | Community Voting | 📋 Planned | 0% |
| 3 | Jury Selection | 🔬 Research | 0% |
| 3 | ZK Proofs | 🔬 Research | 0% |

---

## Technical Details

### Documentation
- `docs/NAME_REGISTRY_PHASE2_SPEC.md` - Phase 2 detailed specification
- `docs/USER_GUIDE_CHALLENGES.md` - User guide for challenge system
- `docs/SECURITY_AUDIT_CHECKLIST.md` - Security review checklist
- `tests/e2e/challenge-workflow.test.md` - End-to-end test scenarios

### Implementation
- `packages/name-registry/` - Core implementation
- `apps/cli/src/commands/challenge.ts` - CLI challenge commands
- `packages/name-registry/src/dns/verifier.ts` - DNS verification
- `packages/name-registry/src/metrics/collector.ts` - IPFS metrics

### Completion Summaries
- `PHASE_1A_COMPLETE.md` - Metrics collection implementation
- `PHASE_1B_COMPLETE.md` - Challenge system implementation
- `DNS_VERIFICATION_COMPLETE.md` - DNS verification implementation
