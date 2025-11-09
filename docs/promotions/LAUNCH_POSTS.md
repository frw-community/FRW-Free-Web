# [NOTE] Launch Post Templates

Copy-paste ready posts for each platform. Customize as needed.

---

## Reddit r/privacy

**Title:**
```
I built FRW: A decentralized web where no one can censor or track you
```

**Post:**
```markdown
[Screenshot: Browser showing frw:// site]

**TL;DR:** I created a browser and CLI that publishes websites to IPFS with cryptographic signatures. No servers, no tracking, no censorship. Just math and distributed networks.

---

## The Problem

The web has been captured by five companies.

Your content lives on their servers. Your identity exists in their databases. Your voice depends on their algorithms.

One company bans you → your audience vanishes.
One server fails → your life's work disappears.
One TOS change → you lose everything.

This is not the web we were promised.

---

## The Solution: FRW (Free Resilient Web)

FRW restores the original principles of the World Wide Web:

**Technology:**
- **IPFS storage** - Content distributed across 100,000+ nodes globally
- **Ed25519 signatures** - Mathematics proves authenticity (can't be forged)
- **Human-readable names** - `frw://alice/blog` not hash strings
- **Custom protocol handler** - Works like HTTP but decentralized

**What makes it different:**
- [NO] **Not a crypto project** - No blockchain, no tokens, no ICO
- [NO] **Not a darknet** - Not hiding, not anonymous (use Tor for that)
- [OK] **Fixing the WWW** - Same HTML/CSS/JS, same browser UX
- [OK] **Working today** - Alpha stage, fully functional

---

## How It Works

```bash
# Install CLI
npm install -g @frw/cli

# Generate your identity (30 seconds)
frw keygen

# Register a name (2 minutes - proof-of-work prevents squatting)
frw register myblog

# Publish your site (10 seconds)
frw publish ./my-website

# Live forever on frw://myblog/
```

Your site is now:
- **Uncensorable** - Replicated on thousands of IPFS nodes
- **Verifiable** - Cryptographically signed by you
- **Permanent** - Exists as long as anyone hosts it
- **Free** - No hosting bills, no platform fees

---

## Technical Stack

- **TypeScript** - Full type safety
- **Electron** - Cross-platform browser
- **IPFS (Kubo)** - Distributed storage (battle-tested since 2015)
- **TweetNaCl** - Ed25519 signatures (used by Signal, SSH)
- **397+ tests** - All passing, production-ready

---

## Current Status

**Alpha release:**
- [OK] CLI tool works
- [OK] Browser works
- [OK] End-to-end flow functional
- [OK] Comprehensive docs
- [WARNING] Needs more testing, features, polish

**Open source:**
- 🔓 MIT License
- 📖 Full documentation
- [HANDSHAKE] Looking for contributors

---

## What I'm Looking For

1. **Feedback** - Does this solve a real problem for you?
2. **Early testers** - Try it and report issues
3. **Contributors** - Especially UX/UI, mobile, browser extensions
4. **Discussion** - Is this the right approach?

**What I'm NOT:**
- Not asking for money (it's free, forever)
- Not promoting a company (no company exists)
- Not selling anything (open source protocol)

---

## Links

- **GitHub:** https://github.com/frw-community/FRW-Free-Web
- **Manifesto:** [Link to raw manifesto on GitHub]
- **Docs:** [Link to docs folder]

---

## Why I Built This

In 1989, Tim Berners-Lee created the WWW and gave it to humanity for free.

No patents. No ownership. No control.

That act created trillions of dollars of value and changed civilization.

In 2010, we gave that web away to five companies.

**I'm trying to take it back.**

Not with a new technology. With the RIGHT architecture using proven technology.

This is the web from 1995, rebuilt with 2025 tech.

---

**Questions? Criticisms? Thoughts? I'm here to answer!**

Thanks for reading [THANKS]
```

---

## Hacker News - Show HN

**Title:**
```
Show HN: FRW – Decentralized web with IPFS and cryptographic verification
```

**URL:**
```
https://github.com/frw-community/FRW-Free-Web
```

**First Comment (by you):**
```
Hi HN!

I built FRW to restore the original principles of the World Wide Web: open protocols, decentralized by default, no permission needed to publish.

Technical approach:
- IPFS for content-addressed storage (no central servers)
- Ed25519 signatures for verification (math proves authenticity)
- Custom protocol handler (frw://) in Electron browser
- Human-readable names via proof-of-work + economic bonds

Stack: TypeScript monorepo, 397 tests, MIT licensed.

It's alpha stage but fully functional end-to-end. CLI publishes to IPFS, browser fetches and verifies signatures.

Not a blockchain project (no tokens/ICO). Not a darknet (not about anonymity). Just infrastructure for censorship-resistant publishing.

Main challenges:
1. IPFS initial load time (~2s vs cached ~0.1s)
2. Name squatting (solved with PoW + bonds)
3. Discoverability (working on search/index)

Looking for feedback on the approach and contributors (especially UX, mobile, browser extensions).

Happy to answer technical questions!
```

---

## Twitter Thread

```
1/ The web was born free.

Open protocols. Open standards. Open access.

No one owned it. No one controlled it. Everyone could publish.

Then we gave it away to five companies.

Today I'm open sourcing FRW: The World Wide Web, fixed. 🧵👇

2/ Today your content lives on their servers.

One company bans you? Your audience vanishes.
One server fails? Your life's work disappears.
One TOS change? You lose everything.

This is not the web we were promised.

[Screenshot: comparison table]

3/ FRW restores the original WWW principles with modern tech:

[OK] IPFS storage (distributed across 100k+ nodes)
[OK] Ed25519 signatures (math proves authenticity)
[OK] Human names (frw://alice not Qm...hash)
[OK] Same web tech (HTML/CSS/JS)

[Screenshot: browser]

4/ It's NOT:
[NO] A blockchain (no tokens, no ICO)
[NO] A darknet (not anonymous/hiding)
[NO] Vaporware (working today, 397 tests)

It IS:
[OK] The WWW, but decentralized
[OK] Open source (MIT)
[OK] Production-ready alpha

5/ How it works:

$ frw keygen → Your identity (30s)
$ frw register myblog → Your name (2m)
$ frw publish ./site → Live forever (10s)

Your content is now:
• Uncensorable (1000s of nodes)
• Verifiable (crypto signatures)
• Permanent (IPFS)

[Screenshot: CLI]

6/ Tech stack for the curious:

• TypeScript (type-safe codebase)
• Electron (cross-platform browser)
• IPFS/Kubo (distributed storage)
• TweetNaCl (Ed25519 signatures)
• 397 passing tests

No experimental tech. Just proven tools, right architecture.

7/ Current status: Alpha

[OK] CLI works
[OK] Browser works
[OK] Signatures work
[OK] IPFS integration works
[WARNING] Needs polish, testing, features

Open source, looking for contributors.

8/ Why I built this:

In 1989, Tim Berners-Lee gave us the WWW for free.

That act changed civilization.

We gave it away to corporations.

I'm trying to take it back.

Not with new tech. With the RIGHT architecture.

9/ Looking for:

[OK] Feedback ("does this solve your problem?")
[OK] Early testers (try it, break it, report)
[OK] Contributors (UX/UI, mobile, extensions)
[OK] Discussion (is this the right approach?)

NOT looking for:
[NO] Money (it's free forever)
[NO] Investors (no company)

10/ Links:

🔗 GitHub: https://github.com/frw-community/FRW-Free-Web
📖 Manifesto: [link]
[DOCS] Docs: [link]

If you believe the web should be free, give it a star [STAR]

If you want to help, check the issues.

Let's reclaim the web. [GLOBE]

/end
```

**Suggested tags:**
```
@IPFS @electronjs #OpenSource #Decentralization #Privacy #WebDev #TypeScript
```

---

## Dev.to Article

**Title:**
```
Building FRW: A Decentralized Web Browser with IPFS and Cryptographic Verification
```

**Tags:**
```
opensource, javascript, typescript, webdev
```

**Cover Image:**
```
[Architecture diagram or browser screenshot]
```

**Article:**
```markdown
# Building FRW: A Decentralized Web Browser

## Introduction

I spent the last [X months] building FRW - a decentralized web browser that uses IPFS for storage and Ed25519 for cryptographic verification.

This is the story of why I built it, the technical challenges, and what I learned.

## The Problem

The web has become centralized. Five companies control what billions of people can say:

- Your content lives on their servers
- Your identity exists in their databases
- Your voice depends on their algorithms

One company bans you, and your digital existence can vanish overnight.

**This isn't what the web was supposed to be.**

## The Vision: Restore the Original WWW

In 1989, Tim Berners-Lee designed the World Wide Web with these principles:

- Open protocols (HTTP, HTML)
- Decentralized by default
- No permission needed to publish
- URLs that work everywhere

Then we made architectural mistakes:

1. Centralized everything on corporate servers
2. Let platforms control identity
3. Built surveillance into the foundation
4. Created walled gardens

**FRW doesn't replace the WWW. It restores it.**

## Technical Architecture

### Core Components

```
┌─────────────────────────────────────┐
│  Browser (Electron + React)         │
│  - frw:// protocol handler          │
│  - Ed25519 signature verification   │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│  Core Packages (TypeScript)         │
│  - @frw/protocol (URL parsing)      │
│  - @frw/crypto (Signatures)         │
│  - @frw/ipfs (Storage)              │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│  IPFS Network (Distributed)         │
│  - Content-addressed storage        │
│  - 100,000+ global nodes            │
└─────────────────────────────────────┘
```

### 1. IPFS for Storage

Instead of servers, content lives on IPFS:
- Content-addressed (hash = address)
- Distributed globally (1000s of nodes)
- Permanent (exists as long as anyone hosts)

### 2. Ed25519 for Verification

Every page is cryptographically signed:
```typescript
const signature = SignatureManager.signPage(html, privateKey);
const isValid = SignatureManager.verifyPage(page, publicKey);
```

This proves:
- Who published it (identity)
- It hasn't been tampered with (integrity)
- When it was published (timestamp)

### 3. Human-Readable Names

Instead of `QmXyz...` hashes, we have `frw://alice/blog`.

Anti-squatting system:
- Proof-of-work (short names = hard puzzles)
- Economic bonds (collateral system)
- Challenge mechanism (community disputes)

### 4. Custom Protocol Handler

Electron browser with `frw://` protocol:
```typescript
protocol.registerStringProtocol('frw', async (request) => {
  const url = FRWUrl.parse(request.url);
  const content = await ipfs.cat(url.cid);
  const verified = await crypto.verify(content, url.publicKey);
  return verified ? content : throw new Error('Invalid signature');
});
```

## Technical Challenges

### Challenge 1: IPFS Performance

**Problem:** Initial IPFS loads can be slow (~2-5 seconds).

**Solution:**
- Aggressive caching (LRU cache)
- Preload common resources
- Background prefetching
- CDN-like optimization (planned)

### Challenge 2: Name Squatting

**Problem:** How to prevent someone from registering all short names?

**Solution:** Multi-layered approach:
1. **Proof-of-Work:** Short names require hard computational puzzles
2. **Economic bonds:** Collateral required (returned if active)
3. **Progressive pricing:** More names = higher costs
4. **Challenge system:** Community can dispute squatters

### Challenge 3: Discoverability

**Problem:** No Google to find frw:// sites.

**Solution (in progress):**
- Decentralized index on IPFS
- Opt-in crawling
- Community curation
- Tag system

## Code Quality

### Testing

397 tests across all packages:
```bash
npm test
# PASS  packages/protocol/tests (55 tests)
# PASS  packages/crypto/tests (11 tests)
# PASS  packages/ipfs/tests (34 tests)
# PASS  packages/name-registry/tests (142 tests)
# ... 397 total
```

### Type Safety

100% TypeScript:
```typescript
interface FRWUrl {
  protocol: 'frw:';
  name: string;
  path: string;
  publicKey: string;
  cid: string;
}
```

### Monorepo Structure

Lerna-managed packages:
```
packages/
├── @frw/protocol   - URL parsing
├── @frw/crypto     - Signatures
├── @frw/ipfs       - Storage
├── @frw/name-registry - Anti-squatting
└── @frw/sandbox    - Safe execution
```

## Lessons Learned

### 1. Don't Invent New Tech

Used proven technologies:
- IPFS (2015, battle-tested)
- Ed25519 (military-grade crypto)
- Electron (powers VS Code, Slack)
- TypeScript (industry standard)

**New tech = new bugs. Proven tech = proven reliability.**

### 2. Architecture > Technology

The problem wasn't missing technology. It was wrong architecture.

WWW had right idea in 1989. We just implemented it wrong.

### 3. Documentation Matters

Spent 30% of time on docs. Worth it:
- Clear README
- Comprehensive guides
- API documentation
- Architecture diagrams

**Good docs = more contributors.**

### 4. Testing Is Freedom

397 tests means:
- Confident refactoring
- Safe to accept PRs
- Catchbugs early
- Sleep well at night

## Current Status

**Alpha release:**
- [OK] Core protocol works
- [OK] CLI functional
- [OK] Browser functional
- [OK] End-to-end flow works
- [WARNING] Needs polish, features, testing

**Open source:**
- MIT License
- GitHub: https://github.com/frw-community/FRW-Free-Web
- Looking for contributors

## What's Next

### Short-term (3 months):
- Mobile apps (React Native)
- Browser extensions (Chrome, Firefox)
- Performance optimizations
- Better UX/UI

### Long-term (1 year):
- Mainstream adoption
- Decentralized search
- Real-time updates
- Video streaming

## Get Involved

If this resonates with you:

**Try it:**
```bash
npm install -g @frw/cli
frw keygen
frw register yourname
frw publish ./your-site
```

**Contribute:**
- Check [good-first-issue] label
- Read CONTRIBUTING.md
- Join GitHub Discussions

**Spread the word:**
- Star the repo [STAR]
- Share with friends
- Write about it

## Conclusion

The web was born free.

We gave it away.

**FRW is how we take it back.**

Not with new technology. With the right architecture using proven technology.

This is the web from 1995, rebuilt with 2025 tech.

---

**Questions? Comments? Find me on GitHub: [link]**
```

---

## Product Hunt

**Name:**
```
FRW - Free Resilient Web
```

**Tagline:**
```
The World Wide Web, fixed. Decentralized, censorship-resistant, open source.
```

**Description:**
```
FRW restores the original principles of the WWW: open, decentralized, permissionless.

Built with IPFS (distributed storage) + Ed25519 (cryptographic signatures) + custom protocol handler (frw://).

No blockchain. No tokens. No platform. Just infrastructure for freedom.

Open source (MIT), production-ready alpha, 397 tests passing.

For journalists, creators, developers, activists, and anyone who believes the web should be free.
```

**Topics:**
```
Open Source, Developer Tools, Privacy, Decentralization, Web App
```

**Links:**
```
GitHub: https://github.com/frw-community/FRW-Free-Web
Docs: [link to docs]
Manifesto: [link to manifesto]
```

---

## Email to Tech Journalists (Use sparingly)

**Subject:**
```
Open sourcing FRW: Decentralized web alternative
```

**Body:**
```
Hi [Name],

I'm reaching out because I just open-sourced FRW (Free Resilient Web) - a decentralized web browser and publishing system built on IPFS.

**Why it might interest your readers:**
- Addresses real problem (platform censorship, surveillance)
- Working code (not vaporware) - 397 tests, MIT licensed
- Different approach (not blockchain/crypto)
- Restores original WWW principles with modern tech

**What it is:**
Browser + CLI that publishes to IPFS with cryptographic signatures. Think "WWW but decentralized" - same HTML/CSS/JS, same UX, different infrastructure.

**What it's not:**
Not a cryptocurrency, not a darknet, not anonymous, not a company.

**Why now:**
Platform censorship increasing, privacy concerns growing, need for alternatives urgent.

**Links:**
- GitHub: https://github.com/frw-community/FRW-Free-Web
- Demo video: [if you have one]
- Manifesto: [link]

Happy to provide more info, arrange demo, or answer questions.

Thanks for your time,
[Your name]
```

**Send to:**
- TechCrunch (tips@techcrunch.com)
- Ars Technica
- The Verge
- Wired
- Vice Motherboard

**But only if:**
- You have traction (500+ stars, press wants success stories)
- You have demo video (visual proof)
- You're ready for traffic spike

---

## FAQ - Common Questions You'll Get

**Q: "How is this different from Tor?"**
```
A: Tor is for anonymity (hiding who you are). FRW is for decentralized publishing (can't be censored).

Different goals. You can combine them! Run FRW over Tor for anonymous publishing.

See manifesto section "What FRW Is Not" for full explanation.
```

**Q: "Why not just use IPFS directly?"**
```
A: IPFS is the transport layer. FRW adds:
- Cryptographic signatures (proves authenticity)
- Human-readable names (frw://alice vs Qm...hash)
- Browser UX (protocol handler, verification, etc)
- Anti-squatting system (PoW + bonds)

Think: "HTTP is to TCP/IP as FRW is to IPFS"
```

**Q: "How do you prevent illegal content?"**
```
A: We don't host content. IPFS is content-addressed storage - nodes choose what to host.

Same model as BitTorrent: protocol doesn't dictate content, nodes decide.

Plus: Cryptographic signatures mean clear attribution (can't claim "someone else posted it").

Laws still apply. FRW is infrastructure, like roads - what people do on it is up to law enforcement.
```

**Q: "Can this scale?"**
```
A: IPFS already scales globally (100k+ nodes). FRW is a protocol on top.

Like HTTP on TCP/IP - no central servers to bottleneck.

Current challenge is IPFS performance (~2s initial load), not scale. Working on CDN-like optimizations.
```

**Q: "Is this production ready?"**
```
A: Alpha stage:
- Core functionality works (CLI + browser + verification)
- 397 tests passing
- Full documentation
- BUT needs more real-world testing, features, polish

Safe to try, not yet recommended for critical use.

Looking for early testers to help us get to production.
```

**Q: "Why no blockchain?"**
```
A: Blockchain adds:
- Complexity (consensus, miners, gas fees)
- Slow transaction times (15+ seconds)
- Environmental concerns (PoW chains)
- Financial barriers (need tokens)

For our use case (content storage + verification), IPFS + Ed25519 is simpler, faster, and works.

Blockchain is a tool. Not every problem needs it.
```

**Q: "How do you make money?"**
```
A: We don't. FRW is a protocol, not a company.

Like HTTP: no one "owns" it, anyone can implement it.

This is infrastructure for freedom, released under MIT license.

If you want to support: contribute code, spread the word, use it.
```

---

## Response Templates

### Thank you (star/positive comment)
```
Thank you! [THANKS]

If you have feedback or find bugs, please open an issue on GitHub.

If you want to contribute, check out the [good-first-issue] label.

Welcome to the free web!
```

### Constructive criticism
```
Great point! This is exactly the kind of feedback we need.

[Address the point specifically]

Would you be interested in opening an issue on GitHub so we can track this properly?

Thanks for taking the time to review!
```

### Feature request
```
Love this idea! 

Could you open a feature request on GitHub Issues? That way we can:
1. Track it properly
2. Get community input
3. Find someone to implement it

Link: [GitHub issues URL]

Thanks!
```

### Bug report
```
Thanks for reporting!

This sounds like a bug. Could you:
1. Open an issue on GitHub
2. Include your OS, Node version
3. Steps to reproduce

That'll help us fix it fast.

GitHub issues: [URL]
```

### Hostile comment
```
I understand your concerns. 

[If there's a valid point, address it specifically]

[If it's just hostile, be brief]

Happy to discuss further if you have specific technical questions.
```

---

## Posting Schedule Summary

| Day | Platform | Time (CET) | Status |
|-----|----------|------------|--------|
| Mardi | Reddit r/privacy | 15h00 | PRIMARY |
| Mardi | Reddit cross-posts | 17h00 | If >50 upvotes |
| Mercredi | Hacker News | 8h00 | IMPORTANT |
| Jeudi | Product Hunt | 9h00 | Secondary |
| Jeudi | Twitter | 10h00 | Secondary |
| Jeudi | Dev.to | 11h00 | Secondary |
| Vendredi | Update posts | All day | Respond & thank |

---

**Remember:** 
- One post per subreddit
- Be humble and grateful
- Take criticism gracefully
- Respond to EVERYTHING first 48h
- This is a marathon, not a sprint

**Good luck! [LAUNCH]**
