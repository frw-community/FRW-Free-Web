# Test FRW Locally

Complete local testing before VPS deployment.

## Prerequisites

**1. IPFS Daemon**

```bash
# Check if installed
ipfs version

# If not installed:
# Windows: choco install ipfs
# Or download: https://dist.ipfs.tech/#go-ipfs

# Initialize (first time only)
ipfs init

# Start daemon
ipfs daemon
```

**2. Node.js Dependencies**

```bash
npm install
npm run build
```

## Step 1: Start Bootstrap Node

**Terminal 1:**

```powershell
.\test-bootstrap-local.ps1
```

Expected output:
```
[1/4] Checking IPFS daemon...
✓ IPFS daemon is running

[2/4] Starting bootstrap node...
[Bootstrap] Starting FRW Bootstrap Node: bootstrap-local-1
[Bootstrap] IPFS: http://localhost:5001
[Bootstrap] HTTP: 3100
[Bootstrap] ✓ Connected to IPFS x.x.x
[Bootstrap] ✓ Subscribed to pubsub: frw/names/updates/v1
[Bootstrap] ✓ HTTP server listening on port 3100
[Bootstrap] ✓ Bootstrap node ready!
[Bootstrap] Node ID: bootstrap-local-1
[Bootstrap] API: http://localhost:3100
```

## Step 2: Test Endpoints

**Terminal 2:**

```powershell
.\test-bootstrap-endpoints.ps1
```

Expected output:
```
Testing Bootstrap Node Endpoints

[1/3] Testing /health endpoint...
✓ Health check passed
  Status: ok
  Uptime: 5s
  Node ID: bootstrap-local-1

[2/3] Testing /api/stats endpoint...
✓ Stats endpoint working
  Total names: 0

[3/3] Testing /api/names endpoint...
✓ Names endpoint working
  Names in index: 0

Bootstrap node is ready!
```

## Step 3: Register Test Name

**Terminal 3:**

```bash
# Initialize FRW CLI (first time only)
frw init

# Register test name
frw register testlocal

# Expected:
# Generating Proof of Work...
# ✓ Proof of Work generated in X seconds
# ✓ Published to global network!
```

## Step 4: Verify Registration

```powershell
# Check bootstrap node received it
Invoke-RestMethod -Uri "http://localhost:3100/api/resolve/testlocal"
```

Expected response:
```json
{
  "name": "testlocal",
  "publicKey": "...",
  "contentCID": "",
  "ipnsKey": "/ipns/...",
  "timestamp": 1699567890,
  "signature": "...",
  "resolvedBy": "bootstrap-local-1"
}
```

## Step 5: Test Name Resolution

```bash
# Via CLI
frw config show

# Should show testlocal in registered names
```

## Troubleshooting

### IPFS daemon not starting

```bash
# Check what's using port 5001
netstat -ano | findstr :5001

# Kill process if needed
taskkill /PID <pid> /F

# Restart daemon
ipfs daemon
```

### Bootstrap node won't start

```bash
# Check what's using port 3100
netstat -ano | findstr :3100

# Change port in environment
$env:HTTP_PORT = "3101"
npm start
```

### Registration hangs

```bash
# Check IPFS connectivity
ipfs swarm peers

# Should show connected peers
# If empty, check firewall
```

## Success Criteria

- [x] Bootstrap node starts
- [x] All endpoints respond
- [x] Name registration works
- [x] Bootstrap node indexes name
- [x] Name resolution works

## Next: Deploy to VPS

Once local testing passes, proceed to VPS deployment:
```bash
# See: docs/deployment/DEPLOY_SWISS_VPS.md
```
