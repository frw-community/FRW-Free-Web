# IPFS Setup Guide for FRW

FRW uses IPFS for decentralized content storage and distribution. Follow this guide to set up IPFS and start publishing.

---

## Quick Start (Recommended)

### Option 1: IPFS Desktop (Easiest)

**Best for beginners and testing**

1. Download IPFS Desktop: https://docs.ipfs.tech/install/ipfs-desktop/
2. Install and launch the application
3. IPFS daemon starts automatically
4. Test connection:
   ```bash
   frw ipfs
   ```

That's it! You can now publish with `frw publish`.

---

### Option 2: Command Line (Advanced)

**For developers and production setups**

#### Windows

```powershell
# Download IPFS
wget https://dist.ipfs.tech/kubo/v0.25.0/kubo_v0.25.0_windows-amd64.zip -OutFile ipfs.zip

# Extract
Expand-Archive ipfs.zip -DestinationPath .

# Move to Program Files
Move-Item kubo\ipfs.exe C:\Windows\System32\

# Initialize
ipfs init

# Start daemon
ipfs daemon
```

#### macOS

```bash
# Using Homebrew
brew install ipfs

# Or download directly
curl -O https://dist.ipfs.tech/kubo/v0.25.0/kubo_v0.25.0_darwin-amd64.tar.gz
tar xvfz kubo_v0.25.0_darwin-amd64.tar.gz
cd kubo
sudo ./install.sh

# Initialize
ipfs init

# Start daemon
ipfs daemon
```

#### Linux

```bash
# Download
wget https://dist.ipfs.tech/kubo/v0.25.0/kubo_v0.25.0_linux-amd64.tar.gz

# Extract
tar xvfz kubo_v0.25.0_linux-amd64.tar.gz

# Install
cd kubo
sudo ./install.sh

# Initialize
ipfs init

# Start daemon
ipfs daemon
```

---

## Verify Installation

```bash
# Check IPFS version
ipfs version

# Check FRW connection
frw ipfs
```

Expected output:
```
✓ Connected to IPFS

Node Info:
  ID: QmHash...
  Agent: kubo/0.25.0
  Protocol: /ipfs/0.1.0

Connection:
  Host: localhost
  Port: 5001
  URL: http://localhost:5001
```

---

## Configuration

### Default Settings

FRW uses these default IPFS settings:
- **Host:** localhost
- **Port:** 5001
- **Protocol:** http

### Custom IPFS Node

To use a remote IPFS node:

```bash
# Edit ~/.frw/config.json
{
  "ipfsHost": "your-ipfs-node.com",
  "ipfsPort": 5001
}
```

Or use environment variables:
```bash
export FRW_IPFS_HOST=your-ipfs-node.com
export FRW_IPFS_PORT=5001
```

---

## Publishing Workflow

### 1. Start IPFS Daemon

```bash
ipfs daemon
```

Keep this running in a terminal or use IPFS Desktop.

### 2. Publish Your Site

```bash
frw publish ./my-site
```

Output:
```
✓ Loading keypair
✓ Found 5 files
✓ Signed 2 HTML files
✓ Connected to IPFS
✓ Published to IPFS
✓ Content pinned
✓ Published to IPNS

Publish Complete
✓ Content published successfully!

IPFS CID: QmYwAPJzv...
IPNS Name: k51qzi5uqu5d...
Public Key: 12D3KooWBc5T...

Your site is accessible at:
  frw://mysite/
  frw://12D3KooWBc5T.../
  https://ipfs.io/ipfs/QmYwAPJzv.../
  https://ipns.io/ipns/k51qzi5uqu5d.../
```

### 3. Access Your Site

**Via IPFS Gateway:**
```
https://ipfs.io/ipfs/YOUR-CID/
```

**Via FRW (once client is built):**
```
frw://yourname/
```

---

## Troubleshooting

### Connection Failed

**Problem:** `Failed to connect to IPFS`

**Solutions:**
1. Check if daemon is running:
   ```bash
   ipfs id
   ```

2. Restart daemon:
   ```bash
   ipfs shutdown
   ipfs daemon
   ```

3. Check port 5001 is not blocked:
   ```bash
   netstat -an | grep 5001
   ```

4. Try different port:
   ```bash
   ipfs config Addresses.API /ip4/127.0.0.1/tcp/5002
   ipfs daemon
   ```
   Then update FRW config.

### Slow Publishing

**Problem:** Publishing takes a long time

**Solutions:**
1. Check your internet connection
2. Reduce file sizes (optimize images, minify CSS/JS)
3. Use local gateway for testing
4. Increase IPFS swarm connections:
   ```bash
   ipfs swarm peers
   ```

### Content Not Accessible

**Problem:** Published content returns 404

**Solutions:**
1. Wait a few minutes for DHT propagation
2. Pin content explicitly:
   ```bash
   ipfs pin add YOUR-CID
   ```
3. Use multiple gateways:
   - https://ipfs.io
   - https://dweb.link
   - https://cloudflare-ipfs.com

### IPNS Update Slow

**Problem:** IPNS takes too long to update

**Solutions:**
1. Use CID directly for immediate access
2. Wait 5-10 minutes for IPNS propagation
3. Use DNSLink for faster updates:
   ```
   _dnslink.example.com TXT "dnslink=/ipfs/YOUR-CID"
   ```

---

## Advanced Configuration

### Increase Storage Limit

```bash
ipfs config Datastore.StorageMax 100GB
```

### Enable Experimental Features

```bash
ipfs config --json Experimental.FilestoreEnabled true
ipfs config --json Experimental.UrlstoreEnabled true
```

### Configure Gateway

```bash
# Set custom gateway
ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8080

# Add CORS for web apps
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
```

### Bootstrap Nodes

```bash
# List bootstrap nodes
ipfs bootstrap list

# Add custom node
ipfs bootstrap add /ip4/IP/tcp/4001/p2p/PEER-ID
```

---

## Using IPFS Cluster (Production)

For high-availability deployments:

```bash
# Install IPFS Cluster
wget https://dist.ipfs.tech/ipfs-cluster-service/latest/ipfs-cluster-service_latest_linux-amd64.tar.gz

# Initialize
ipfs-cluster-service init

# Start
ipfs-cluster-service daemon
```

Configure FRW to use cluster:
```json
{
  "ipfsHost": "cluster.example.com",
  "ipfsPort": 9094
}
```

---

## Pinning Services

Alternative to running your own node:

### Pinata
```bash
# Sign up: https://pinata.cloud
# Get API key
# Configure FRW to use Pinata API
```

### Web3.Storage
```bash
# Sign up: https://web3.storage
# Use their API for pinning
```

### NFT.Storage
```bash
# Free permanent storage
# https://nft.storage
```

---

## Monitoring

### Check Node Stats

```bash
ipfs stats bw        # Bandwidth
ipfs stats repo      # Repository size
ipfs swarm peers     # Connected peers
```

### FRW Status

```bash
frw ipfs             # Connection status
```

### Web UI

Access IPFS Web UI:
```
http://localhost:5001/webui
```

---

## Performance Tips

1. **Pin Important Content**
   ```bash
   ipfs pin add QmYourCID
   ```

2. **Garbage Collection**
   ```bash
   ipfs repo gc
   ```

3. **Increase Connection Limits**
   ```bash
   ipfs config --json Swarm.ConnMgr.HighWater 2000
   ipfs config --json Swarm.ConnMgr.LowWater 1000
   ```

4. **Use Dedicated Node**
   - Run IPFS on a VPS
   - Configure FRW to use remote node
   - Better uptime and bandwidth

---

## Security

### Private Content

IPFS is **public by default**. All published content is accessible to anyone.

For private content:
1. Encrypt before publishing
2. Use private IPFS network
3. Implement access control in FRW pages

### Key Management

- Store IPFS private keys securely
- Rotate keys periodically
- Use separate keys for development/production

---

## Next Steps

1. ✅ Install IPFS
2. ✅ Start daemon
3. ✅ Test connection: `frw ipfs`
4. ✅ Publish site: `frw publish`
5. 🚀 Build community sites

---

## Resources

- **IPFS Docs:** https://docs.ipfs.tech
- **IPFS Discord:** https://discord.gg/ipfs
- **FRW Discord:** [Coming soon]
- **GitHub Issues:** https://github.com/frw-community/frw-free-web-modern/issues

---

**Ready to publish?**

```bash
ipfs daemon
frw publish ./my-site
```

Welcome to the distributed web! 🌐
