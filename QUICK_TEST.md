# FRW Quick Test - Verify Everything Works

## Setup Complete ✓

```bash
# Build status
✅ packages/name-registry - Built
✅ apps/cli - Built
✅ frw command - Linked globally
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
# ✓ Configuration directory created
# ✓ Keypair generated  
# ✓ Configuration saved
```

### 3. Test Basic Registration

```bash
# Register a name (will take ~5 seconds for PoW)
frw register mytestsite123

# Expected:
# Generating proof of work...
# ✓ Proof generated
# ✓ Name registered: mytestsite123
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
| CLI Build | ✅ | `npm run build` |
| Global Command | ✅ | `frw --version` |
| Proof of Work | ✅ | In register flow |
| DNS Verification | ✅ | `frw verify-dns` |
| Rate Limiting | ✅ | Active in register |
| Bond Calculator | ✅ | Active in register |
| Challenge System | ✅ | `frw challenge` |
| Nonce Manager | ✅ | Replay prevention |

## Security Features Active

✅ **Proof of Work** - CPU-intensive registration
✅ **Economic Bonds** - 10M units for short names  
✅ **Rate Limiting** - 1/min, 20/day, 100/month
✅ **Nonce System** - Replay attack prevention
✅ **Challenge Spam Prevention** - 2/hour limit
✅ **DNS Verification** - Optional trust badge

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
