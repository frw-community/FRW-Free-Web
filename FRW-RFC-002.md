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
