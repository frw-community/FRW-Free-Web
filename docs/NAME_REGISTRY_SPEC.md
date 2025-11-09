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

### Phase 1: Foundation [DONE] COMPLETE

**Status:** Production Ready (November 9, 2025)

**Content Metrics + Time-Locked Challenges + Bot Prevention**

**Implemented Features:**
- [DONE] Proof of Work system (CPU-intensive registration)
- [DONE] Economic bonds (progressive pricing by name length)
- [DONE] Rate limiting (1/min, 20/day, 100/month per user)
- [DONE] Content metrics from IPFS (peers, size, updates)
- [DONE] Challenge system (30-day response, automatic resolution)
- [DONE] DNS verification (optional, for domain-like names)
- [DONE] Replay attack prevention (nonce management)
- [DONE] Challenge spam prevention (2/hour limit)
- [DONE] Database cleanup (storage limits, automatic maintenance)

**CLI Commands Available:**
```bash
frw register <name>              # With PoW and bonds
frw register <name> --verify-dns # Optional DNS verification
frw verify-dns <name>            # Verify DNS later
frw metrics <name>               # View usage metrics
frw challenge create <name>      # Challenge ownership
frw challenge respond <id>       # Respond to challenge
frw challenge status <id>        # Check challenge status
frw challenge list               # List all challenges
```

**Documentation:**
- Implementation: `docs/roadmap/PHASE_1A_COMPLETE.md`
- Challenge System: `docs/roadmap/PHASE_1B_COMPLETE.md`
- DNS Verification: `docs/roadmap/DNS_VERIFICATION_COMPLETE.md`
- Security: `docs/roadmap/CRITICAL_SECURITY_IMPLEMENTATION.md`

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

| Phase | Component | Status | Completion | Files |
|-------|-----------|--------|------------|-------|
| 1 | Proof of Work | [DONE] Complete | 100% | `pow/generator.ts` |
| 1 | Economic Bonds | [DONE] Complete | 100% | `bonds/calculator.ts` |
| 1 | Rate Limiting | [DONE] Complete | 100% | `limits/rate-limiter.ts` |
| 1 | Content Metrics | [DONE] Complete | 100% | `metrics/collector.ts` |
| 1 | Challenge System | [DONE] Complete | 100% | `challenge/system.ts` |
| 1 | DNS Verification | [DONE] Complete | 100% | `dns/verifier.ts` |
| 1 | Automatic Resolution | [DONE] Complete | 100% | `challenge/system.ts` |
| 1 | Nonce Manager | [DONE] Complete | 100% | `security/nonce-manager.ts` |
| 1 | Database Cleanup | [DONE] Complete | 100% | `storage/cleanup.ts` |
| 2 | Trust Graph | [PLANNED] Planned | 0% | TBD |
| 2 | Reputation System | [PLANNED] Planned | 0% | TBD |
| 2 | Community Voting | [PLANNED] Planned | 0% | TBD |
| 3 | Jury Selection | [RESEARCH] Research | 0% | TBD |
| 3 | ZK Proofs | [RESEARCH] Research | 0% | TBD |

**Note:** All Phase 1 components are production-ready as of November 9, 2025.

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
