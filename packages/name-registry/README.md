# @frw/name-registry

Decentralized name registry with anti-squatting mechanisms for FRW protocol.

## Features

### Name Registration & Resolution
- Proof-of-work based name registration (prevents spam without fees)
- Distributed name resolution via IPFS DHT
- Multi-layer caching (L1/L2) for fast lookups
- Real-time updates via IPFS pubsub
- Bootstrap node HTTP queries for speed
- Cryptographic signature verification

### DNS Integration
- **Domain-to-Name Mapping** - Link traditional domains to FRW names
- **DNS Verification** - Prove domain ownership via TXT records
- **Dual Access** - Content accessible via both HTTPS and frw:// protocol
- **Official Status** - Verified domains get official badge
- **Simple Setup** - Single TXT record for verification

### Anti-Squatting Protection

#### Phase 1 (Implemented)
- Content metrics collection from IPFS
- Time-locked challenge system
- Automatic dispute resolution
- Economic bonding mechanism

#### Phase 2 (Planned - 6 months)
- Trust graph and reputation system
- Community voting with reputation weighting
- Social verification layer

#### Phase 3 (Planned - 1 year)
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

## DNS Domain Linking

FRW allows you to link traditional DNS domains to your FRW names, making your content accessible via both `https://yourdomain.com` and `frw://yourname/`.

### CLI Usage

#### Link a Domain to Your FRW Name

```bash
# Add domain mapping
frw domain add example.com myname

# This will show you the DNS TXT record to add:
# Type:  TXT
# Name:  _frw (or @)
# Value: frw-key=<your-public-key>;frw-name=myname
# TTL:   3600
```

#### Verify Domain Ownership

```bash
# After adding DNS record, verify it
frw domain verify example.com

# This checks that:
# 1. DNS TXT record exists
# 2. Public key matches your registered name
# 3. Name matches your registration
```

#### List All Domain Mappings

```bash
frw domain list

# Shows all domains with verification status:
# ✓ example.com -> frw://myname/ (Verified)
# ⚠ test.com -> frw://test/ (Not verified)
```

#### Get Domain Information

```bash
frw domain info example.com

# Shows detailed information:
# - Domain name
# - Linked FRW name
# - Public key
# - Verification status
# - Added date
# - Last check date
```

#### Remove Domain Mapping

```bash
frw domain remove example.com
```

### Programmatic Usage

```typescript
import { DNSVerifier } from '@frw/name-registry';

// Initialize DNS verifier
const verifier = new DNSVerifier();

// Verify domain ownership
const result = await verifier.verifyDomainOwnership(
  'example.com',
  'your-public-key-here'
);

if (result.verified) {
  console.log('Domain verified!');
  console.log('DNS Key:', result.dnsKey);
} else {
  console.error('Verification failed:', result.error);
}
```

### DNS Record Format

FRW uses TXT records for domain verification. Add one of these formats to your DNS:

#### Option 1: Subdomain Record (Recommended)

```
Name:  _frw.example.com
Type:  TXT
Value: frw-key=<public-key>;frw-name=<name>
TTL:   3600
```

#### Option 2: Root Domain Record

```
Name:  example.com (or @)
Type:  TXT
Value: frw-key=<public-key>;frw-name=<name>
TTL:   3600
```

### DNS Record Examples

**Full format with name:**
```
frw-key=ed25519:AbCdEf123...;frw-name=myname
```

**Verification only (no name):**
```
frw-key=ed25519:AbCdEf123...
```

### Benefits

- **Dual Access** - Users can access via both traditional web and FRW protocol
- **Official Badge** - Verified domains show as official in browser
- **SEO Friendly** - Traditional domains for discoverability
- **Censorship Resistant** - FRW protocol provides fallback if domain blocked
- **Ownership Proof** - Cryptographically prove you own both domain and FRW name

### How It Works

1. **Register FRW Name** - First register your name via `frw register myname`
2. **Add Domain** - Link your traditional domain via `frw domain add`
3. **Get Public Key** - CLI shows your public key to add to DNS
4. **Add TXT Record** - Add TXT record to your domain's DNS
5. **Wait for Propagation** - DNS changes take 5-10 minutes (up to 48 hours)
6. **Verify** - Run `frw domain verify` to check DNS record
7. **Official Status** - Verified domains get official badge in browser

### Verification Process

The verification checks:
- DNS TXT record exists at `_frw.<domain>` or root
- Record contains `frw-key=<key>` format
- Public key matches your registered FRW name
- (Optional) `frw-name` matches if specified

### Reserved Names Protection

FRW requires DNS verification for certain protected names to prevent trademark/brand impersonation. These names cannot be registered without proving domain ownership:

**Protected Categories:**
- **Tech Companies** - google, microsoft, apple, amazon, facebook, meta, twitter, etc.
- **Financial Services** - paypal, visa, mastercard, stripe, bitcoin, ethereum, etc.
- **Social Media** - instagram, youtube, tiktok, linkedin, reddit, etc.
- **E-commerce** - ebay, alibaba, walmart, amazon, shopify, etc.
- **Media** - cnn, bbc, nytimes, reuters, netflix, spotify, etc.
- **Government** - gov, nasa, fbi, who, un, etc.
- **Generic High-Value** - app, web, mail, shop, bank, news, crypto, nft, etc.

**Example Protected Names:**
```
google, microsoft, apple, facebook, twitter, youtube, 
netflix, spotify, paypal, visa, bitcoin, ethereum,
github, reddit, wikipedia, mozilla, linux
```

**How to Register Protected Names:**
1. Own the corresponding domain (e.g., `google.com` for name `google`)
2. Add DNS TXT record proving ownership
3. Verify with `frw verify-dns <name>`
4. Registration proceeds only after DNS verification

**Checking if Name is Protected:**
```typescript
import { requiresDNSVerification, RESERVED_NAMES } from '@frw/name-registry';

// Check if name requires DNS verification
if (requiresDNSVerification('google')) {
  console.log('This name requires DNS verification');
}

// Get full list of reserved names
console.log('Reserved names:', RESERVED_NAMES);
```

### Troubleshooting

**DNS Record Not Found**
```bash
# Check DNS propagation manually
dig _frw.example.com TXT +short
nslookup -type=TXT _frw.example.com

# Wait 5-10 minutes and retry
frw domain verify example.com
```

**Public Key Mismatch**
- Ensure you copied the full public key including `ed25519:` prefix
- Check for extra spaces or quotes in DNS record
- Verify you're using the same keypair that registered the name

**Name Mismatch**
- Ensure `frw-name` in DNS matches exactly (case-sensitive)
- Check for typos in domain or name
- Re-add domain mapping if needed

**Protected Name Registration**
- If trying to register a protected name (e.g., "google"), you MUST prove domain ownership first
- Add DNS TXT record to the corresponding domain
- Run `frw verify-dns <name>` before attempting registration
- Registration will fail without DNS verification for reserved names

## Documentation

See `docs/NAME_REGISTRY_SPEC.md` for complete specification.

## License

MIT
