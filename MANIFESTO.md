# The FRW (Free Web Modern)  Manifesto
**Reclaiming the Web, One Signature at a Time**

---

## Preamble

The Web was built on open protocols.  
HTTP. HTML. URLs anyone could access.  
No gatekeepers. No middlemen. No permission required.

That web is dying.

Today, a handful of corporations control what you see, what you publish, and who sees it.  
Your website lives on their servers.  
Your identity lives in their databases.  
Your voice exists at their mercy.

When a platform bans you, your voice disappears.  
When a server fails, your content vanishes.  
When a company changes its terms, you lose everything.

**This is not the web we were promised.**

Free Web FRW (Free Web Modern) is a declaration of independence.  
A return to the original vision.  
A web that cannot be shut down, censored, or controlled.

---

## The Problem

### The Web is Captured

**Centralized Platforms**
- Your content lives on corporate servers
- They can delete, modify, or censor at will
- Deplatforming silences voices instantly
- Terms of Service change without your consent

**Centralized Identity**
- Your account belongs to them, not you
- Loss of access means loss of identity
- Verification badges granted by authority
- Cross-platform identity is impossible

**Centralized Control**
- DNS can be hijacked or blocked
- Hosting providers can refuse service
- CDNs track every visitor
- SSL certificates require trusted authorities

**Surveillance Economy**
- Every click is tracked
- Personal data is harvested and sold
- Behavior is profiled and predicted
- Privacy is a premium feature

### The Consequences

- **Censorship** - Governments and corporations decide what's acceptable
- **Deplatforming** - Lose your account, lose your audience
- **Data Loss** - Platforms shut down, taking your content with them
- **Vendor Lock-in** - Your data is trapped in proprietary formats
- **Single Points of Failure** - One outage silences millions
- **Surveillance** - Every action monitored, every connection logged

**The current web is not free. It is rented, monitored, and controlled.**

---

## The Solution: FRW (Free Web Modern) 

FRW (Free Web Modern) is a protocol, not a platform.  
A standard, not a service.  
A tool for freedom, not a new master.

### What FRW (Free Web Modern) Provides

**Self-Sovereign Identity**
- Your identity is your Ed25519 key pair
- No company can revoke it
- No government can confiscate it
- No platform can ban it

**Content You Control**
- Publish to IPFS - distributed, permanent storage
- Sign everything with your private key
- Content verified cryptographically, not corporately
- No one can modify your words

**Protocol, Not Platform**
- `frw://` URLs work anywhere
- Any browser can implement the protocol
- No company owns the namespace
- Interoperable by design

**Censorship Resistance**
- Content distributed across thousands of nodes
- No single point of failure or control
- DHT-based discovery can't be blocked
- Peer-to-peer propagation survives attacks

---

## How It Works

### 1. Identity is Cryptography

```
You = Your Ed25519 Public Key

No email. No password. No corporation.
Just mathematics.
```

When you run `frw init`, you generate a keypair.  
That public key **is** your identity.  
Permanent. Unforgeable. Yours.

### 2. Content is Signed

```
Every page signed with your private key.
Verification proves authenticity.
Tampering becomes impossible.
```

When you publish with `frw publish`, every file is cryptographically signed.  
Readers verify signatures automatically.  
If the signature is invalid, the content is rejected.  
Trust through mathematics, not authority.

### 3. Storage is Distributed

```
Content lives on IPFS.
Replicated across thousands of nodes.
Content-addressed by hash.
Immutable. Permanent. Uncensorable.
```

Your website isn't on "a server" - it's on **every** node that cares to host it.  
Kill one node, ten more serve the content.  
Block one gateway, a hundred alternatives exist.  
The network routes around censorship.

### 4. Discovery is Human

```
frw://alice/
frw://bob/blog/
frw://charlie/about.html

Human-readable names.
Cryptographic verification.
No centralized registry.
```

Names map to public keys.  
Public keys map to IPFS content.  
No DNS to hijack.  
No registrar to revoke.

### 5. Browsing is Private

```
Your browser, your rules.
No tracking scripts.
No surveillance cookies.
No corporate analytics.
```

The FRW browser fetches content from IPFS.  
Verifies signatures locally.  
Renders in a sandboxed environment.  
No third-party requests.  
No telemetry home.

---

## The Principles

### 1. Freedom

**Expression**
- Anyone can publish without permission
- No authority decides what's acceptable
- The protocol is neutral

**Access**
- Anyone can read without registration
- No paywalls enforced at protocol level
- Knowledge belongs to humanity

**Association**
- Link to anyone
- Reference anyone
- Collaborate with anyone

### 2. Ownership

**Identity**
- You own your keys
- No one can revoke your identity
- Lose your keys, start fresh - no corporation involved

**Content**
- You sign what you create
- Signatures prove authorship
- No platform can claim ownership

**Data**
- Your browsing history stays local
- Your bookmarks belong to you
- No cloud sync without consent

### 3. Integrity

**Verification**
- All content cryptographically signed
- Tampering detected automatically
- Trust through math, not faith

**Transparency**
- Protocol is open source
- Implementation is auditable
- No hidden backdoors

**Immutability**
- Published content cannot be altered
- History cannot be rewritten
- Updates are new versions, not edits

### 4. Resilience

**No Single Point of Failure**
- Content replicated across nodes
- Peer-to-peer distribution
- Network survives targeted attacks

**Censorship Resistance**
- No central authority to pressure
- No servers to seize
- No DNS to hijack

**Persistence**
- IPFS content lives as long as someone hosts it
- Popular content naturally replicated
- Important content can be pinned permanently

### 5. Privacy

**Local First**
- Processing happens on your machine
- History stored locally
- No cloud required

**Minimal Metadata**
- IPFS reveals what you fetch
- Signatures reveal who authored
- Use Tor for anonymity if needed

**No Tracking**
- No cookies
- No analytics
- No fingerprinting
- No surveillance

---

## What FRW Is Not

**Not an Underground Network**
- FRW is not Tor, I2P, or a darknet
- This is not about hiding or going underground
- This is about fixing the WWW, not abandoning it
- We're building a **compatible evolution** of the web we know

**Not a Platform**
- There is no FRW.com to visit
- There is no FRW company to trust
- There is no FRW server to hack

**Not a Cryptocurrency**
- No tokens to buy
- No ICO to invest in
- No blockchain required

**Not Perfect Anonymity**
- IPFS reveals what you request
- Signatures reveal what you authored
- Use additional privacy tools (Tor, VPN) if needed

**Not a Silver Bullet**
- Cannot prevent illegal content from being published
- Cannot force nodes to host content
- Cannot solve social problems with code

---

## The Philosophy: A Step Back to Move Forward

**FRW is not a revolution. It's a course correction.**

The WWW got it right in the beginning:
- Open protocols anyone could implement
- No permission needed to publish
- URLs that worked everywhere
- HTML anyone could write

Then we made mistakes:
- Centralized everything on corporate servers
- Gave platforms control over identity
- Accepted surveillance as the price of convenience
- Let a few companies own the infrastructure

**FRW doesn't throw away the web. It fixes it.**

### What We Keep from the WWW

✅ **URLs** - `frw://` works just like `http://`  
✅ **HTML/CSS/JS** - Same technologies, same skills  
✅ **Browser paradigm** - Address bar, links, navigation  
✅ **Open standards** - Anyone can implement the protocol  
✅ **Human-readable names** - Not hash strings, real names

### What We Fix from the WWW

🔧 **Decentralized hosting** - IPFS instead of centralized servers  
🔧 **Cryptographic identity** - Keys instead of corporate accounts  
🔧 **Content verification** - Signatures instead of trust  
🔧 **Resilient distribution** - P2P instead of single points of failure  
🔧 **Privacy by design** - No tracking built into the protocol

### The Goal

**Not to replace the WWW. To become what it should have been.**

- Accessible to everyone (not just tech experts)
- Compatible with existing knowledge (HTML, CSS, JS)
- Immune to corporate takeover (protocol, not platform)
- Resistant to censorship (distributed by design)
- Respectful of privacy (no surveillance foundation)

**This is the web from 1995, rebuilt with 2025 technology.**  
**The openness of the past, the resilience of the future.**

We're not asking people to abandon the internet.  
We're giving them a better version of what they already know.

---

## The Architecture

### Protocol Stack

```
┌─────────────────────────────────┐
│     Application Layer           │
│  (Browser, CLI, Custom Apps)    │
├─────────────────────────────────┤
│       FRW Protocol              │
│  (Signing, Verification, URLs)  │
├─────────────────────────────────┤
│      Transport Layer            │
│    (IPFS/libp2p Network)        │
├─────────────────────────────────┤
│     Identity Layer              │
│  (Ed25519 Key Pairs)            │
└─────────────────────────────────┘
```

### Components

**CLI Tool** (`frw`)
- Generate keys
- Sign content
- Publish to IPFS
- Verify signatures
- Manage identities

**Browser** (`frw://`)
- Navigate frw:// URLs
- Fetch from IPFS
- Verify signatures
- Render securely
- No tracking

**Core Packages**
- `@frw/crypto` - Ed25519 operations
- `@frw/protocol` - URL parsing and validation
- `@frw/ipfs` - Distributed storage interface
- `@frw/sandbox` - Secure execution environment

---

## The Commitment

We, the builders and users of FRW, commit to:

### Build Tools for Freedom
- Create software that empowers users
- Refuse surveillance-based business models
- Keep the protocol open and documented
- Accept no corporate masters

### Protect Privacy
- Design with privacy as default
- Minimize metadata collection
- Encrypt when possible
- Educate users on operational security

### Resist Censorship
- Build systems that route around control
- Distribute content widely
- Support node operators
- Document circumvention techniques

### Maintain Integrity
- Sign all releases
- Audit code openly
- Document security issues transparently
- Fix bugs responsibly

### Educate and Empower
- Write clear documentation
- Create accessible tools
- Support beginners
- Spread digital literacy

### Remain Independent
- Accept no funding with strings attached
- Refuse partnerships that compromise values
- Keep governance transparent
- Answer to users, not investors

---

## The Call to Action

### For Users

**Take Control**
1. Run `frw init` - Generate your identity
2. Create content - Write your truth
3. Run `frw publish` - Share uncensorably
4. Browse with `frw://` - Read freely

**Spread the Word**
- Share FRW with creators under threat
- Teach digital sovereignty
- Host a node if you can
- Archive important content

### For Developers

**Build the Ecosystem**
- Implement the protocol in new languages
- Create alternative browsers
- Build publishing tools
- Develop mobile clients

**Improve the Core**
- Audit security
- Optimize performance
- Fix bugs
- Write tests

**Extend the Vision**
- Add privacy layers (Tor integration)
- Create discovery mechanisms
- Build social protocols
- Design federation systems

### For Node Operators

**Host the Network**
- Run IPFS nodes
- Pin important content
- Provide bandwidth
- Maintain uptime

**Ensure Resilience**
- Distribute geographically
- Use diverse providers
- Document configurations
- Share operational knowledge

### For Educators

**Teach Digital Sovereignty**
- Explain how FRW works
- Demonstrate practical use
- Discuss implications
- Empower critical thinking

**Create Resources**
- Write tutorials
- Record videos
- Translate documentation
- Build example sites

---

## The Future

### Short Term (2025)

- **Usability** - Make FRW accessible to non-technical users
- **Mobile** - Bring FRW to iOS and Android
- **Performance** - Optimize loading and verification
- **Discovery** - Build better content finding mechanisms

### Medium Term (2026)

- **Federation** - Connect FRW to ActivityPub and other protocols
- **Sandboxing** - Full JavaScript security isolation
- **Storage** - Incentivize content hosting and distribution
- **Identity** - Integrate with DIDs and Verifiable Credentials

### Long Term (2027+)

- **Encryption** - End-to-end encrypted private communication
- **Reputation** - Web-of-trust based content discovery
- **Monetization** - Direct creator support without platforms
- **Governance** - Decentralized protocol evolution

---

## The Vision

Imagine a web where:

- **No one can silence you** - Your content lives on thousands of nodes
- **No one can impersonate you** - Signatures prove authenticity
- **No one can track you** - Privacy by design, not by permission
- **No one can censor you** - Distributed storage defeats control
- **No one owns your identity** - Your keys, your self

This is not a utopian dream.  
This is practical technology.  
This is what FRW provides today.

---

## Join the Movement

**The web we build today determines the freedom we have tomorrow.**

If you believe in:
- Free expression without permission
- Privacy without asking
- Ownership without compromise
- Resilience without centralization

**Then FRW is for you.**

### Get Started

```bash
# Install FRW
git clone https://github.com/frw-community/frw-free-web-modern.git
cd frw-free-web-modern
npm install

# Generate your identity
frw init

# Publish your first site
frw publish ./my-site

# Browse the free web
npm run electron:dev
```

### Stay Connected

- **Documentation:** See `/docs` folder
- **Code:** [GitHub Repository](https://github.com/frw-community/frw-free-web-modern)
- **Issues:** [Report bugs and request features](https://github.com/frw-community/frw-free-web-modern/issues)
- **Discussions:** [Join the conversation](https://github.com/frw-community/frw-free-web-modern/discussions)

### Contribute

Every contribution matters:
- Fix a bug
- Write documentation
- Translate content
- Run a node
- Spread awareness
- Create content

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

This manifesto and the FRW project are released under the MIT License.

Free to use. Free to modify. Free to distribute.  
Because freedom cannot be licensed, only protected.

---

> **"The question is not whether we can build a free web.  
> The question is whether we have the courage to use it."**

**Welcome to the Free Web.**  
**Welcome to FRW.**

---

*The FRW Manifesto*  
*Version 1.0*  
*November 2025*

*Published to IPFS. Signed. Uncensorable.*
