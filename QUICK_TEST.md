# FRW Quick Test - Verify Everything Works

## Setup Complete [x]

```bash
# Build status
[DONE] packages/name-registry - Built
[DONE] apps/cli - Built
[DONE] frw command - Linked globally
```

## Quick Tests

### 1. Check Installation

```bash
# Verify frw command works
frw --version
# Expected: 1.0.0

frw --help
# Expected: Shows all commands
```

### 2. Initialize FRW

```bash
# Initialize (creates ~/.frw directory)
frw init

# Expected output:
# [x] Configuration directory created
# [x] Keypair generated  
# [x] Configuration saved
```

### 3. Test Basic Registration

```bash
# Register a name (will take ~5 seconds for PoW)
frw register mytestsite123

# Expected:
# Generating proof of work...
# [x] Proof generated
# [x] Name registered: mytestsite123
```

### 4. Test DNS Verification Commands

```bash
# Check register help
frw register --help
# Should show: --verify-dns option

# Check verify-dns command
frw verify-dns --help
# Shows DNS verification help
```

### 5. Test Challenge Commands

```bash
# View available challenge commands
frw challenge --help

# Expected subcommands:
# - create
# - respond
# - status  
# - list

# View metrics command
frw metrics --help
```

## System Status

| Component | Status | Command |
|-----------|--------|---------|
| CLI Build | [DONE] | `npm run build` |
| Global Command | [DONE] | `frw --version` |
| Proof of Work | [DONE] | In register flow |
| DNS Verification | [DONE] | `frw verify-dns` |
| Rate Limiting | [DONE] | Active in register |
| Bond Calculator | [DONE] | Active in register |
| Challenge System | [DONE] | `frw challenge` |
| Nonce Manager | [DONE] | Replay prevention |

## Security Features Active

[DONE] **Proof of Work** - CPU-intensive registration
[DONE] **Economic Bonds** - 10M units for short names  
[DONE] **Rate Limiting** - 1/min, 20/day, 100/month
[DONE] **Nonce System** - Replay attack prevention
[DONE] **Challenge Spam Prevention** - 2/hour limit
[DONE] **DNS Verification** - Optional trust badge

## Ready to Test

The system is fully built and ready for testing. Use TESTING_GUIDE.md for comprehensive test scenarios.

### Next Steps

1. **Run initialization:** `frw init`
2. **Register a name:** `frw register testname`
3. **View metrics:** `frw metrics testname`  
4. **(Optional) DNS verify:** `frw verify-dns example.com`
5. **Test challenges:** `frw challenge create <name>`

### Notes

- IPFS daemon must be running for metrics collection
- DNS verification requires actual DNS records
- All security features are active and enforced
- See TESTING_GUIDE.md for detailed test scenarios
