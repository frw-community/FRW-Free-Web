# Free Resilient Web (FRW) Protocol V2 - Quantum-Resistant Distributed Web

## Abstract

This document specifies Version 2 of the Free Resilient Web (FRW) Protocol, a decentralized, quantum-resistant system for domain name resolution and content distribution. V2 introduces hybrid cryptography (Ed25519 + ML-DSA-65), memory-hard Proof of Work (PoW) based on Argon2id to resist Grover's algorithm, and a distributed registry architecture leveraging IPFS PubSub and DHT.

## Status of This Document

This document specifies a Free Resilient Web (FRW) Standards Track protocol for the community, and requests discussion and suggestions for improvements. Distribution of this document is unlimited.

## Copyright Notice

Copyright (c) 2025 Free Resilient Web Community. All rights reserved.

## Table of Contents

1.  [Introduction](#1-introduction)
    1.1. [Requirements Language](#11-requirements-language)
2.  [Motivation](#2-motivation)
3.  [Architecture](#3-architecture)
4.  [Specification](#4-specification)
    4.1. [Cryptography](#41-cryptography)
    4.2. [Data Structures](#42-data-structures)
    4.3. [Proof of Work (PoW)](#43-proof-of-work-pow)
    4.4. [Networking & Distribution](#44-networking--distribution)
    4.5. [Client Ecosystem](#45-client-ecosystem)
5.  [Security Considerations](#5-security-considerations)
6.  [Privacy Considerations](#6-privacy-considerations)
7.  [IANA Considerations](#7-iana-considerations)
8.  [Migration Path](#8-migration-path)
9.  [References](#9-references)

---

## 1. Introduction

The Free Resilient Web (FRW) Protocol provides a decentralized alternative to the traditional DNS and Certificate Authority infrastructure. It maps human-readable names to content-addressable storage (IPFS) hashes using a distributed, permissionless registry.

Version 2 addresses the existential threat posed by Quantum Computing to classical cryptography.

### 1.1. Requirements Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.

## 2. Motivation

The imminent availability of Cryptographically Relevant Quantum Computers (CRQCs) compromises classical public-key cryptography (ECC/RSA) via Shor's algorithm and weakens hashing/PoW via Grover's algorithm. FRW V2 addresses these threats proactively by:

1.  **Post-Quantum Cryptography (PQC):** Implementing NIST-selected ML-DSA-65 (Dilithium3).
2.  **Quantum-Hard PoW:** Deploying memory-hard constraints to negate quantum quadratic speedups in mining.
3.  **Hybrid Security:** Ensuring backward compatibility while mandating upgrade paths.

## 3. Architecture

The FRW Network consists of three primary actor types:
1.  **Registrars (Publishers):** Users who generate keys, perform PoW, and publish signed records.
2.  **Registry Nodes (Bootstrap/DHT):** Nodes that validate, store, and propagate records via IPFS DHT and PubSub.
3.  **Resolvers (Clients):** Software that queries the registry to resolve names to content CIDs.

## 4. Specification

### 4.1. Cryptography

V2 utilize a hybrid cryptographic scheme to ensure both classical efficiency and quantum resistance.

*   **Classical Signing:** Ed25519 (Edwards-curve Digital Signature Algorithm) [RFC8032].
*   **Post-Quantum Signing:** ML-DSA-65 (Dilithium3) [FIPS-204].
*   **Hashing:**
    *   **Identifiers:** SHA3-256 [FIPS-202].
    *   **Proof of Work:** Argon2id [RFC9106].

**Key Structures:**

*   **Public Key:** Hybrid object containing `publicKey_ed25519` (32 bytes) and `publicKey_dilithium3` (1952 bytes).
*   **DID (Decentralized Identifier):** `did:frw:v2:<Base58(SHA3-256(Dilithium3_PublicKey))>`

**Signature Requirement:**
Records MUST be signed by both keys independently. Verification MUST fail if either signature is invalid.

### 4.2. Data Structures

The core data unit is the `DistributedNameRecordV2`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `version` | `2` | Protocol version identifier (MUST be 2). |
| `name` | `string` | The registered domain name (lowercase, alphanumeric, hyphens). |
| `recordVersion` | `number` | Incremental version number for updates. |
| `did` | `string` | Owner's Decentralized Identifier. |
| `publicKey_ed25519` | `Uint8Array` | 32-byte Ed25519 public key. |
| `publicKey_dilithium3` | `Uint8Array` | 1952-byte Dilithium3 public key. |
| `contentCID` | `string` | IPFS Content Identifier for the site root. |
| `ipnsKey` | `string` | IPNS key for mutable updates. |
| `registered` | `number` | Timestamp (ms) of registration. |
| `expires` | `number` | Expiration timestamp (ms) (typically 1 year). |
| `proof_v2` | `ProofOfWorkV2` | Proof of work object. |
| `previousHash_sha3` | `Uint8Array \| null` | SHA3 hash of the previous record (blockchain linking). |
| `signature_ed25519` | `Uint8Array` | 64-byte signature. |
| `signature_dilithium3` | `Uint8Array` | 3309-byte signature. |
| `hash_sha3` | `Uint8Array` | 32-byte SHA3-256 hash of the canonical record. |

#### 4.2.1. Canonical Serialization (Signature Input)

To ensure consistent signature verification, the record MUST be serialized into a deterministic "Canonical Form" before signing. This form excludes the signatures themselves and variable fields like `providers` or `dnslink`.

**Serialization Format:** CBOR (RFC 8949) with Deterministic Encoding (Section 4.2).

**Canonical Object Fields (MUST be serialized in this order):**
1.  `version` (Integer): Protocol version.
2.  `name` (String): UTF-8 encoded name.
3.  `publicKey_dilithium3` (Byte String): 1952-byte key.
4.  `contentCID` (String): IPFS CID.
5.  `recordVersion` (Integer): Sequence number.
6.  `registered` (Integer): Unix timestamp (ms).
7.  `expires` (Integer): Unix timestamp (ms).
8.  `previousHash_sha3` (Byte String or Null): 32-byte hash.

**Note:** The field keys are string literals matching the property names above.

#### 4.2.2. Full Record Format (Wire Format)

The full record for storage and transmission includes the canonical fields plus the signatures and metadata.

**Additional Fields:**
*   `publicKey_ed25519` (Byte String)
*   `did` (String)
*   `ipnsKey` (String)
*   `signature_ed25519` (Byte String)
*   `signature_dilithium3` (Byte String)
*   `hash_sha3` (Byte String)
*   `proof_v2` (Map): Contains `nonce`, `timestamp`, `difficulty`, `hash`, etc.

### 4.3. Proof of Work (PoW)

To mitigate quantum speedup, V2 enforces memory-hard constraints using Argon2id.

#### 4.3.1. PoW Algorithm

The PoW `hash` is computed as follows:

1.  **Salt Construction:**
    `Salt = SHA3-256( UTF8(name) || publicKey_dilithium3 )`
    *   `||` denotes concatenation.

2.  **Input Construction:**
    `Input = BigEndian64(nonce) || BigEndian64(timestamp)`
    *   `nonce` is a 64-bit unsigned integer.
    *   `timestamp` is a 64-bit unsigned integer (ms).

3.  **Argon2id Hashing:**
    `ArgonHash = Argon2id( Input, Salt, Parameters )`
    *   `Parameters`: Derived from name length (see 4.3.2).
    *   `Parallelism`: 4 lanes.
    *   `Hash Length`: 32 bytes.

4.  **Final Hash:**
    `PoW_Hash = SHA3-256( ArgonHash )`

The `PoW_Hash` MUST meet the difficulty target (leading zeros) derived from the name length.

#### 4.3.2. Difficulty Scaling
Difficulty scales inversely with name length.

| Name Length | Memory (MiB) | Iterations | Leading Zeros |
| :--- | :--- | :--- | :--- |
| 1 | 8192 | 10 | 12 |
| 2 | 8192 | 10 | 10 |
| 3 | 4096 | 8 | 8 |
| 4 | 2048 | 6 | 7 |
| 5 | 1024 | 5 | 6 |
| 6 | 512 | 4 | 5 |
| 7 | 256 | 3 | 4 |
| 8 | 128 | 3 | 3 |
| 9-10 | 64 | 3 | 2 |
| 11-15 | 32 | 2 | 1 |
| 16+ | 16 | 2 | 0 |

### 4.4. Networking & Distribution

#### 4.4.1. Resolution Flow
1.  **L1 Cache:** In-memory check (TTL 5 minutes).
2.  **Bootstrap Nodes:** HTTP query to trusted peers (`GET /api/resolve/:name`).
3.  **DHT Lookup:** Query IPFS DHT for key `/frw/names/v2/<name>`.

#### 4.4.2. Propagation
*   **Storage:** Records are serialized via CBOR and stored on IPFS.
*   **PubSub:** Updates are broadcast on topic `frw/names/updates/v2`.
*   **DHT:** Records are pinned and announced on the DHT.

### 4.5. Client Ecosystem

The protocol supports two distinct client modes:

#### 4.5.1. Heavy Client (Full Node)
*   **Target:** Desktop Browsers (e.g., FRW Browser), Server Nodes.
*   **Behavior:** Connects directly to IPFS/Libp2p. Maintains local `DistributedRegistryV2`. Performs full local PQC verification.
*   **Implementation:** `@frw/ipfs`, `@frw/protocol-v2`.

#### 4.5.2. Light Client
*   **Target:** Browser Extensions, Mobile Apps.
*   **Behavior:** Delegates resolution to trusted Bootstrap Nodes via HTTPS. Trusts the record structure returned by the node.
*   **Implementation:** HTTP fetcher (see `apps/chrome-extension`).

### 4.6. HTTP API (Bootstrap Nodes)

Bootstrap nodes MUST expose the following endpoints:

**GET /api/resolve/{name}**

*   **Response (200 OK):** JSON representation of `DistributedNameRecordV2`.
    *   Binary fields (keys, signatures) are Base64 encoded.
    *   BigInt fields (nonce) are Strings.

```json
{
  "name": "example",
  "contentCID": "Qm...",
  "publicKey_dilithium3": "Base64...",
  "signature_dilithium3": "Base64...",
  "proof_v2": { ... }
}
```

### 4.7. DNS Verification (Domain Linking)

To prevent namespace collisions and squatting of high-value traditional domains (e.g., "google", "bank"), the protocol enforces DNS Verification for names present in the **Reserved List**.

**Mechanism:**
Registrants of reserved names MUST prove ownership of the corresponding ICANN DNS domain by publishing a specific TXT record.

**DNS TXT Record Format:**
*   **Host:** `_frw.<domain>` (preferred) or `<domain>` (root).
*   **Value:** `frw-key=<base58_public_key>`

**Verification Logic:**
Registry nodes MUST reject registrations for reserved names if the DNS verification fails. Verification is performed at registration time and MAY be re-verified periodically.

### 4.8. Dispute Resolution (Challenge System)

V2 includes an on-chain dispute resolution mechanism to handle trademark infringements, squatting, and malicious content.

**Challenge Lifecycle:**
1.  **Initiation:** Challenger submits a `Challenge` object with a bond (minimum 1,000,000 units) and evidence.
    *   *State Transition:* `Active` -> `Challenged`
2.  **Response:** Name owner has **30 days** to submit a `ChallengeResponse` with a counter-bond and counter-evidence.
    *   *State Transition:* `Challenged` -> `Under_Evaluation`
    *   *Failure to Respond:* Challenger wins by default.
3.  **Resolution:** After a **14-day** evaluation period, the challenge is resolved based on metrics (Phase 1) or community vote (Phase 2).
    *   *State Transition:* `Under_Evaluation` -> `Resolved`

**Resolution Metrics (Phase 1):**
*   **Usage Score:** Derived from query volume, uptime, and content longevity.
*   **Threshold:** A score difference of >20% is required to overturn ownership.

### 4.9. Anti-Abuse Mechanisms

#### 4.9.1. Rate Limiting
Nodes SHOULD implement adaptive rate limiting to prevent ledger spam. Limits are tiered based on the signer's **Reputation Score**.

| Tier | Reputation | Daily Limit |
| :--- | :--- | :--- |
| Platinum | 750+ | 50 |
| Gold | 500+ | 35 |
| Silver | 250+ | 25 |
| Standard | <100 | 10 |

#### 4.9.2. Reputation System
Reputation is a local metric calculated by nodes based on:
*   Age of identity (DID).
*   History of valid PoW submissions.
*   Outcome of challenges (winning increases score, losing decreases).

## 5. Security Considerations

*   **Quantum Resistance:** ML-DSA-65 provides security comparable to AES-256 against quantum attacks.
*   **Sybil Resistance:** Memory-hard PoW makes mass-registration prohibitively expensive.
*   **Immutability:** Chain-linking of records (`previousHash_sha3`) prevents history rewriting.
*   **Replay Attacks:** Nonces and Timestamps within the signed canonical data prevent replay.
*   **Key Compromise:** Loss of private keys results in permanent loss of control over the name.

## 6. Privacy Considerations

*   **Public Registry:** All name registrations and associated DIDs are public information stored on the DHT.
*   **IP Address Exposure:** Running a Full Node (Heavy Client) exposes the user's IP address to the DHT swarm. Light Clients effectively mask their IP behind the Bootstrap Node.

## 7. IANA Considerations

This document has no IANA actions.

## 8. Migration Path

1.  **Dual Support:** Bootstrap nodes resolve both V1 and V2.
2.  **Upgrade:** V1 names upgrade by signing a V2 record with the legacy Ed25519 key (embedded in the V2 hybrid key).
3.  **Deprecation:** V1 creation SHALL be deprecated in a future release.

## 9. References

*   [RFC2119] Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, March 1997.
*   [FIPS-204] NIST, "Module-Lattice-Based Digital Signature Standard", FIPS 204, August 2024.
*   [RFC9106] Biryukov, A., et al., "Argon2 Memory-Hard Function for Password Hashing and Proof-of-Work Applications", RFC 9106, September 2021.
