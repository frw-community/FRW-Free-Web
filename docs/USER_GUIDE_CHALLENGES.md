# FRW Challenge System - User Guide

Complete guide to challenging name ownership and resolving disputes.

---

## What is the Challenge System?

The FRW Challenge System prevents name squatting by allowing users to dispute ownership of inactive or misused names. Challenges are resolved automatically based on objective usage metrics from the IPFS network.

### Key Principles

- **Objective Resolution:** Based on measurable IPFS usage data
- **Economic Stakes:** Both parties put up bonds
- **Time-Locked:** Fixed deadlines for responses and evaluation
- **Automatic:** No human arbitration required (Phase 1)

---

## When to Challenge a Name

### Valid Reasons to Challenge

**Squatting:** Name registered but never used
```
Example: "amazon" registered 6 months ago, no content published
```

**Trademark:** Legitimate trademark holder disputing cybersquatter
```
Example: Nike.com owner challenging "nike" FRW name
```

**Impersonation:** Someone claiming to be a known entity
```
Example: Fake "wikipedia" FRW site
```

**Malicious Content:** Name hosting harmful content
```
Example: Phishing site using trusted name
```

### When NOT to Challenge

- **Active legitimate sites:** Even if you want the name
- **Personal names:** Unless clear trademark violation
- **Disputes without evidence:** You need proof
- **Different namespaces:** "alice" vs "alice-blog" are separate

---

## How Challenges Work

### Timeline

```
Day 0:    Challenge created
          ├─ Bond locked
          └─ Owner notified
          
Day 30:   Response deadline
          ├─ Owner responds with counter-bond
          └─ OR challenger wins by default
          
Day 44:   Evaluation deadline
          ├─ Metrics collected
          ├─ Scores compared
          └─ Winner determined
          
Day 45+:  Resolution complete
          ├─ Winner gets bonds
          └─ Name transferred (if applicable)
```

### Resolution Rules

**No Response:** Challenger wins automatically

**With Response:**
- Owner score > 20% higher → Owner wins
- Challenger score > 20% higher → Challenger wins  
- Difference < 20% → Owner wins (status quo bias)

**Score Calculation:**
```
Score = (
    unique_peers × 5 +
    ipns_updates × 10 +
    content_size × 0.001 +
    inbound_links × 20 +
    dag_depth × 3
) × time_decay_factor
```

---

## Creating a Challenge

### Prerequisites

1. **FRW Initialized:** `frw init` completed
2. **IPFS Running:** `ipfs daemon` active
3. **Bond Ready:** Minimum 1,000,000 units
4. **Evidence Prepared:** IPFS CID of proof (optional)

### Command

```bash
frw challenge create <name> \
  --reason <squatting|trademark|impersonation|malicious_content> \
  --bond <amount> \
  [--evidence <ipfs://CID>]
```

### Example

```bash
# Challenge inactive name with evidence
frw challenge create abandonedsite \
  --reason squatting \
  --bond 1000000 \
  --evidence ipfs://QmScreenshotsAndLogs123
```

### What Happens

1. [x] System validates the name exists
2. [x] Collects current owner's metrics
3. [x] Creates challenge record
4. [x] Locks your bond
5. [x] Sets response deadline (30 days)
6. [x] Returns challenge ID

### Output

```
Create Challenge: abandonedsite
──────────────────────────────

✔ Challenge created

Challenge Created
─────────────────

Challenge ID: chal_abc123def456
Name: abandonedsite
Reason: squatting
Bond: 1000000

Response Deadline: 12/9/2025, 1:00:00 PM
Evaluation Deadline: 12/23/2025, 1:00:00 PM

The current owner has 30 days to respond.

Check status: frw challenge status chal_abc123def456
```

### Save Your Challenge ID

**Important:** Keep the challenge ID safe. You'll need it to check status.

---

## Responding to a Challenge

### When You're Challenged

**You will need to:**
1. Check the challenge details
2. Gather counter-evidence
3. Post a counter-bond
4. Submit response before deadline

### Check Challenge Details

```bash
# List challenges against your names
frw challenge list --owner

# Get full details
frw challenge status chal_abc123def456
```

### Prepare Response

**Gather Evidence:**
- IPFS logs showing usage
- Screenshots of active content
- Inbound links from other sites
- User testimonials
- Trademark documentation (if applicable)

**Upload to IPFS:**
```bash
ipfs add -r ./evidence-folder
# Returns: QmYourEvidence789
```

### Submit Response

```bash
frw challenge respond chal_abc123def456 \
  --counter-bond 1000000 \
  --evidence ipfs://QmYourEvidence789
```

### What Happens

1. [x] System validates you own the name
2. [x] Checks deadline hasn't passed
3. [x] Validates counter-bond amount
4. [x] Collects fresh metrics for you
5. [x] Records response
6. [x] Changes status to "under_evaluation"
7. [x] Locks your counter-bond

### Output

```
Respond to Challenge: chal_abc123def456
───────────────────────────────────────

✔ Response submitted

Challenge Response
──────────────────

Challenge ID: chal_abc123def456
Counter-Bond: 1000000
Status: under_evaluation

Evaluation Deadline: 12/23/2025, 1:00:00 PM

Challenge will be automatically resolved after the evaluation period.
```

---

## Checking Challenge Status

### Command

```bash
frw challenge status <challenge-id>
```

### Example Output

```
Challenge Status: chal_abc123def456
───────────────────────────────────

Challenge ID: chal_abc123def456
Name: abandonedsite
Status: under_evaluation

Challenger: 12D3KooWChallenger...
Current Owner: 12D3KooWOwner...

Challenge Bond: 1000000
Reason: squatting

Created: 11/9/2025, 1:00:00 PM
Response Deadline: 12/9/2025, 1:00:00 PM
Evaluation Deadline: 12/23/2025, 1:00:00 PM

Response:
  Counter-Bond: 1000000
  Submitted: 11/10/2025, 10:00:00 AM
```

### Status Meanings

**pending_response:** Waiting for owner to respond  
**under_evaluation:** Response received, waiting for deadline  
**resolved_challenger_wins:** Challenger won the name  
**resolved_owner_wins:** Owner retained the name

---

## Understanding Resolution

### Automatic Resolution

After evaluation deadline, system:

1. **Collects Final Metrics**
   - Owner's current usage
   - Challenger's current usage

2. **Compares Scores**
   - Calculates usage scores
   - Determines percentage difference

3. **Applies Rules**
   - No response → Challenger wins
   - Clear winner (>20% diff) → Higher score wins
   - Close call (<20% diff) → Owner wins

4. **Distributes Bonds**
   - Winner: 85% of total
   - Validators: 10% (Phase 2)
   - Burned: 5%

### Example Resolutions

**Scenario 1: Clear Squatting**
```
Owner Score: 10 (no activity)
Challenger Score: 850 (active site)
Difference: 98.8%
Winner: Challenger (clear)
```

**Scenario 2: Active Owner**
```
Owner Score: 920 (well-used)
Challenger Score: 450 (some activity)
Difference: 51.1%
Winner: Owner (clear)
```

**Scenario 3: Close Call**
```
Owner Score: 780
Challenger Score: 725
Difference: 7.0% (< 20%)
Winner: Owner (status quo bias)
```

---

## Listing Challenges

### All Challenges

```bash
frw challenge list
```

### Your Challenges as Owner

```bash
frw challenge list --owner
```

### Your Challenges as Challenger

```bash
frw challenge list --challenger
```

### Output Format

```
Challenges
──────────

Found 3 challenge(s):

──────────────────────────────────────────────────
ID: chal_abc123
Name: site1
Status: pending_response
Created: 11/9/2025, 1:00:00 PM

──────────────────────────────────────────────────
ID: chal_def456
Name: site2
Status: under_evaluation
Created: 11/8/2025, 10:00:00 AM

──────────────────────────────────────────────────
ID: chal_ghi789
Name: site3
Status: resolved_owner_wins
Created: 10/15/2025, 3:00:00 PM
Winner: 12D3KooW...
```

---

## Best Practices

### For Challengers

**Do:**
- [x] Research the name thoroughly
- [x] Collect solid evidence
- [x] Challenge only legitimate cases
- [x] Be prepared to lose your bond
- [x] Have an active site ready

**Don't:**
- ✗ Challenge active legitimate sites
- ✗ Use challenges for harassment
- ✗ Challenge without evidence
- ✗ Expect to win without usage

### For Owners

**Do:**
- [x] Publish content regularly
- [x] Maintain active IPFS presence
- [x] Respond to challenges quickly
- [x] Keep evidence of usage
- [x] Monitor your names

**Don't:**
- ✗ Ignore challenges (you'll lose)
- ✗ Register names you won't use
- ✗ Wait until deadline to respond
- ✗ Submit false evidence

### For Everyone

**Recommended:**
- Check your names weekly: `frw challenge list --owner`
- Keep bonds available for defense
- Publish content regularly
- Build inbound links
- Document your usage

---

## Common Questions

### How much bond should I post?

**Minimum:** 1,000,000 units  
**Recommended:** Match what you can afford to lose  
**Strategy:** Higher bonds show commitment but risk more

### What if I can't afford the bond?

Wait until Phase 2 when community voting is available. Or build your site's metrics first to defend more easily.

### Can I cancel a challenge?

No. Once created, challenges must resolve. This prevents spam.

### What happens to the bonds?

**Winner gets:** 85%  
**Validators get:** 10% (Phase 2)  
**Burned:** 5%

### How long do I have to respond?

30 days from challenge creation.

### When is resolution final?

14 days after response deadline (44 days total from challenge).

### Can I appeal?

Not in Phase 1. Phase 2 will have community voting for appeals.

### What if both scores are zero?

Status quo bias applies - owner retains name.

---

## Troubleshooting

### "Name not found in registry"

The name you're challenging isn't registered. Check spelling.

### "Bond must be at least 1000000"

Increase your bond amount to meet minimum.

### "Response deadline passed"

You missed the 30-day window. Challenge will resolve in favor of challenger.

### "Only current owner can respond"

You're not the owner of this name. Only owners can respond to challenges.

### "Counter-bond must match or exceed challenge bond"

Your counter-bond is too low. Must be ≥ challenge bond.

### "Challenge not found"

Check your challenge ID. Use `frw challenge list` to find it.

### "Could not connect to IPFS daemon"

Start IPFS: `ipfs daemon`

---

## Security & Privacy

### What Information is Public

- Challenge existence
- Name being challenged
- Reason for challenge
- Bond amounts
- Resolution outcome
- Usage metrics (aggregated)

### What Information is Private

- Your identity (only public key shown)
- Specific evidence content (IPFS CIDs only)
- Detailed usage patterns

### Protecting Yourself

- Use separate keypairs for different names
- Don't link public keys to real identity
- Store evidence securely
- Keep private keys safe

---

## Getting Help

**Documentation:** `docs/NAME_REGISTRY_SPEC.md`  
**Examples:** `tests/e2e/challenge-workflow.test.md`  
**Issues:** GitHub Issues  
**Community:** Discord (coming soon)

---

## Next Steps

1. Try the metrics command: `frw metrics <your-name>`
2. Review existing challenges: `frw challenge list`
3. Understand your scores and improve them
4. Only challenge when justified
5. Respond promptly to any challenges

**Remember:** The goal is a fair, decentralized namespace. Use challenges responsibly.
