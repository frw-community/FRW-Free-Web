---
title: "Free Resilient Web (FRW) Protocol V2 - Quantum-Resistant Distributed Web"
abbrev: "FRW-V2"
docname: "FRW-RFC-002"
date: 2025-12-02
category: std
ipr: trust200902
area: Internet
workgroup: FRW Core Team
keyword: ["quantum", "distributed", "web", "pqc", "ipfs", "dilithium"]
---

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

### 4.3. Proof of Work (PoW)

To mitigate quantum speedup (Grover's algorithm reduces search space by square root), V2 enforces memory-hard constraints using Argon2id.

**Difficulty Scaling:**
Difficulty scales inversely with name length. Shorter names consume significantly more resources.

| Name Length | Memory (MiB) | Iterations | Leading Zeros | Est. Classical Time |
| :--- | :--- | :--- | :--- | :--- |
| 1 char | 8192 | 10 | 12 | ~1000 years |
| 2 chars | 8192 | 10 | 10 | ~62 years |
| 3 chars | 4096 | 8 | 8 | ~2 years |
| 4 chars | 2048 | 6 | 7 | ~2 months |
| ... | ... | ... | ... | ... |
| 11-15 chars | 32 | 2 | 1 | ~1 second |

### 4.4. Networking & Distribution

#### 4.4.1. Resolution Flow
1.  **L1 Cache:** In-memory check (TTL 5 minutes).
2.  **Bootstrap Nodes:** HTTP query to trusted peers (`GET /api/resolve/:name`).
3.  **DHT Lookup:** Query IPFS DHT for key `frw/v2/names/<name>`.

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


-------------------------------------------------------------------------------------------------


# Free Resilient Web (FRW) Protocol V2.1 - Quantum-Resistant Distributed Web

## Abstract

This document specifies Version 2.1 of the Free Resilient Web (FRW) Protocol. It builds upon the quantum-resistant foundations of V2 (Hybrid Cryptography, Argon2id PoW) and introduces a dynamic, gossip-based Node Discovery protocol. This ensures the bootstrap network is self-healing and resilient to IP address changes without requiring client-side updates.

## Status of This Document

This document specifies a Free Resilient Web (FRW) Standards Track protocol for the community, and requests discussion and suggestions for improvements. Distribution of this document is unlimited.

## Copyright Notice

Copyright (c) 2025 Free Resilient Web Community. All rights reserved.

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [Architecture](#2-architecture)
3.  [Cryptography (V2 Core)](#3-cryptography-v2-core)
4.  [Data Structures](#4-data-structures)
5.  [Proof of Work](#5-proof-of-work)
6.  [Node Discovery Protocol (V2.1)](#6-node-discovery-protocol-v21)
7.  [Networking & Distribution](#7-networking--distribution)
8.  [Security Considerations](#8-security-considerations)
9.  [Migration Path](#9-migration-path)

---

## 1. Introduction

The Free Resilient Web (FRW) Protocol maps human-readable names to content-addressable storage (IPFS) hashes using a distributed, permissionless registry. 

**Version 2.1** focuses on **Network Resilience**. While V2 secured the *data* against quantum threats, V2.1 secures the *infrastructure* against censorship and partition by enabling bootstrap nodes to dynamically discover and peer with each other.

## 2. Architecture

The FRW Network consists of a dynamic mesh of nodes:

1.  **Registrars:** Users who generate keys and publish records.
2.  **Bootstrap Mesh (V2.1):** A self-organizing network of validator nodes. They maintain a shared state of active peers via GossipSub and provide HTTP gateways for light clients.
3.  **Resolvers:** Clients that query the mesh or the DHT to resolve names.

## 3. Cryptography (V2 Core)

*Unchanged from V2.0*

*   **Signing:** Hybrid Ed25519 + ML-DSA-65 (Dilithium3).
*   **Hashing:** SHA3-256.
*   **DID:** `did:frw:v2:<hash>`

## 4. Data Structures

*Unchanged from V2.0*

The core unit is `DistributedNameRecordV2`, serialized via deterministic CBOR.

## 5. Proof of Work

*Unchanged from V2.0*

*   **Algorithm:** Argon2id (Memory-Hard).
*   **Purpose:** Sybil resistance and anti-spam.

## 6. Node Discovery Protocol (V2.1)

V2.1 introduces a specialized PubSub protocol for bootstrap node discovery, eliminating the reliance on static configuration files.

### 6.1. Discovery Topic

Nodes MUST subscribe to the IPFS PubSub topic:
`frw/admin/nodes`

### 6.2. Message Format

Messages are JSON-encoded and verified by the receiver.

**Type: `node-hello`**
Announces a node's presence to the network.

```json
{
  "type": "node-hello",
  "url": "http://217.216.32.99:3100",
  "version": "2.1.0",
  "timestamp": 1764874231292
}
```

### 6.3. Node Behavior

1.  **Initialization:**
    *   Node starts with a small seed list of peers (e.g., 83.228.214.189).
    *   Connects to the IPFS swarm.
    *   Subscribes to `frw/admin/nodes`.

2.  **Announcement (Heartbeat):**
    *   Every **60 seconds**, the node publishes a `node-hello` message.
    *   This serves as both a discovery signal and a liveness check.

3.  **Learning:**
    *   Upon receiving a `node-hello`, the node verifies the `url` via a `GET /health` check.
    *   If valid, the URL is added to the local **Active Peer Set**.
    *   This set is used for network synchronization operations (e.g., fetching the registry index).

### 6.4. Client Interaction

Clients (CLI, Browser) can discover the full mesh by querying any known node:

**GET /api/nodes**

**Response:**
```json
{
  "nodes": [
    "http://83.228.214.189:3100",
    "http://217.216.32.99:3100",
    ...
  ]
}
```

This allows light clients to "spider" the network and find a working gateway even if their hardcoded bootstrap list is partially offline.

## 7. Networking & Distribution

### 7.1. Resolution Flow (Updated)
1.  **L1 Cache:** Memory (5 min TTL).
2.  **Dynamic Mesh Query:** Client queries a random node from its discovered list.
3.  **DHT Fallback:** If mesh fails, query IPFS DHT.

### 7.2. Registry Sync
Nodes use the **Active Peer Set** (from Section 6) to request registry updates (`frw/sync/requests/v1`), ensuring that new data propagates to all discovered nodes, not just hardcoded ones.

## 8. Security Considerations

### 8.1. Gossip Spam
*   **Threat:** Malicious node flooding `frw/admin/nodes`.
*   **Mitigation:** Nodes MUST rate-limit incoming announcements per PeerID. Invalid URLs (failing `/health`) result in the sender being ignored for 1 hour.

### 8.2. Malicious Bootstrapping
*   **Threat:** A new node learns only from malicious peers.
*   **Mitigation:** The client CLI retains a hardcoded "Genesis List" of trusted community nodes that cannot be overwritten by gossip, ensuring a root of trust.

## 9. Migration Path

*   **V2.0 Nodes:** Can interoperate with V2.1 nodes for name resolution but will not participate in dynamic discovery.
*   **Upgrade:** Operators update to V2.1 software; the node automatically joins the gossip mesh.

---

## 10. References

*   [RFC2119] Key words for use in RFCs to Indicate Requirement Levels
*   [FIPS-204] NIST Module-Lattice-Based Digital Signature Standard
*   [RFC9106] Argon2 Memory-Hard Function