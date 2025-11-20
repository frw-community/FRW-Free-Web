# FRW Bootstrap Node - Deployment Guide

Deploy FRW Bootstrap Nodes for Global Decentralization

---

## RECOMMENDED: Self-Hosted VPS

**VPS Advantages:**
- No monthly costs (use existing servers)
- Full administrative control
- Decentralized operation
- No platform dependencies
- Censorship-resistant

**Alternative:** Cloud platforms (Railway/Fly.io) as backup nodes for convenience

---

## Option 1: Your Own Linux VPS (RECOMMENDED - 15 min)

**Best for: True decentralization, zero monthly cost, full control**

### Prerequisites
- Linux VPS (Ubuntu 20.04+ recommended)
- Root or sudo access
- Public IP address
- Ports 3030, 4001, 5001 available

### Step 1: Connect to your VPS
```bash
ssh user@your-vps-ip-or-domain.com
```

### Step 2: Install Node.js 20
```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be v20.x
npm --version
```

### Step 3: Install IPFS
```bash
# Download IPFS Kubo
cd /tmp
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar -xzf kubo_v0.24.0_linux-amd64.tar.gz

# Install
cd kubo
sudo bash install.sh

# Verify
ipfs --version  # Should be ipfs version 0.24.0

# Initialize IPFS
ipfs init
```

### Step 4: Clone and Build FRW
```bash
# Clone repository
cd ~
git clone https://github.com/YOUR-USERNAME/FRW-Free-Web-Modern.git
cd FRW-Free-Web-Modern

# Install dependencies
npm install

# Build all packages
npm run build

# Go to bootstrap node
cd apps/bootstrap-node
npm install
npm run build
```

### Step 5: Start Services with PM2 (Auto-restart)
```bash
# Install PM2
sudo npm install -g pm2

# Start IPFS daemon
pm2 start ipfs --name "ipfs-daemon" -- daemon

# Wait 10 seconds for IPFS to be ready
sleep 10

# Start bootstrap node
cd ~/FRW-Free-Web-Modern/apps/bootstrap-node
pm2 start npm --name "frw-bootstrap" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command that PM2 outputs

# Check status
pm2 status
pm2 logs frw-bootstrap
```

### Step 6: Configure Firewall
```bash
# Allow FRW bootstrap port
sudo ufw allow 3030/tcp comment 'FRW Bootstrap'

# Allow IPFS ports
sudo ufw allow 4001/tcp comment 'IPFS Swarm'
sudo ufw allow 5001/tcp comment 'IPFS API'

# Enable firewall if not already enabled
sudo ufw enable

# Check status
sudo ufw status
```

### Step 7: Test Your Node
```bash
# Local test
curl http://localhost:3030/health

# Should return:
{
  "status": "ok",
  "nodeId": "bootstrap-xxx",
  "indexSize": 0,
  "uptime": 123
}

# External test (from another machine)
curl http://YOUR-VPS-IP:3030/health
```

### Step 8: (Optional) Setup HTTPS with Nginx
```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/frw-bootstrap

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain
    
    location / {
        proxy_pass http://localhost:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/frw-bootstrap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate (requires domain pointed to your IP)
sudo certbot --nginx -d your-domain.com

# Now accessible via HTTPS!
https://your-domain.com  # No port needed!
```

### Your Bootstrap URL
```
HTTP:  http://your-vps-ip:3030
HTTPS: https://your-domain.com  (if Nginx configured)
```

**Node 1 Complete - Self-Hosted**

---

## Option 2: Render.com (15 min)

**Also free tier, similar process**

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Root: `apps/bootstrap-node`
5. Build: `npm install && npm run build`
6. Start: `npm start`
7. Free plan
8. Deploy!

Get URL: `https://your-service.onrender.com`

---

## Option 3: Fly.io (10 min)

**CLI-based deployment**

### Install Fly CLI
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### Deploy
```bash
cd apps/bootstrap-node

# Login
fly auth login

# Launch (creates app)
fly launch
# Choose app name: frw-bootstrap
# Choose region: closest to you
# Don't add database
# Deploy now? Yes

# Get URL
fly info
# URL: https://frw-bootstrap.fly.dev
```

### Update code with URL
```typescript
const BOOTSTRAP_NODES = [
  'https://frw-bootstrap.fly.dev',
  'http://localhost:3030',
];
```

---

## Option 4: Docker Local + ngrok (5 min - FASTEST)

**For immediate testing**

### Start Bootstrap with Docker
```bash
cd apps/bootstrap-node
docker-compose up -d
```

### Expose with ngrok
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3030

# Gives you: https://abc123.ngrok.io
```

### Update code
```typescript
const BOOTSTRAP_NODES = [
  'https://abc123.ngrok.io',
  'http://localhost:3030',
];
```

### Rebuild & Test
```bash
npm run build
# Test from another machine/network
```

**WARNING:** ngrok URL changes on restart - use for testing only

---

## Option 5: Your Own VPS (30 min)

**If you have a server**

### Install on Ubuntu
```bash
# SSH to your server
ssh user@your-server.com

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install IPFS
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar -xzf kubo_v0.24.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh
ipfs init

# Clone & build
git clone https://github.com/you/frw
cd frw/apps/bootstrap-node
npm install
npm run build

# Start IPFS
ipfs daemon &

# Start bootstrap
npm start &

# Or use systemd for auto-restart
```

### Open port
```bash
sudo ufw allow 3030
```

### URL
```
http://your-server.com:3030
# Or setup nginx reverse proxy for HTTPS
```

---

## After Deploy - Update Client Code

### Location: `packages/ipfs/src/distributed-registry.ts`

```typescript
private async queryHTTPBootstrap(name: string): Promise<DistributedNameRecord | null> {
  const BOOTSTRAP_NODES = [
    'http://83.228.214.189:3100',  // Switzerland #1
    'http://83.228.213.45:3100',   // Switzerland #2
    'http://83.228.213.240:3100',  // Switzerland #3
    'http://83.228.214.72:3100',   // Switzerland #4
    'http://localhost:3100',       // Local dev
  ];
  
  // ... rest of code
}
```

### Rebuild
```bash
cd /path/to/frw
npm run build
```

### Test Globally
```bash
# From another machine/network
frw://yourname/

# Should resolve via your bootstrap!
```

---

## Verify Deployment

### Test Bootstrap API
```bash
# Test production nodes
curl http://83.228.214.189:3100/health
curl http://83.228.213.45:3100/health

# Should return:
{
  "status": "ok",
  "nodeId": "bootstrap-xxx",
  "v1IndexSize": 19,
  "v2IndexSize": 6,
  "pqSecureRecords": 6,
  "uptime": 86400
}
```

### Test Name Resolution
```bash
# Test with actual registered name
curl http://83.228.213.45:3100/api/resolve/e2etest20nov2025final

# Should return V2 record:
{
  "version": 2,
  "name": "e2etest20nov2025final",
  "publicKey_dilithium3": "...",
  "contentCID": "Qm...",
  ...
}
```

---

## Recommended Setup for Production

**Current production nodes (Switzerland):**

```typescript
const BOOTSTRAP_NODES = [
  'http://83.228.214.189:3100',  // Switzerland #1
  'http://83.228.213.45:3100',   // Switzerland #2
  'http://83.228.213.240:3100',  // Switzerland #3
  'http://83.228.214.72:3100',   // Switzerland #4
  'http://localhost:3100',       // Local dev
];
```

**Performance:**
- 4 nodes for redundancy
- Switzerland (central Europe) location
- < 50ms latency within Europe
- < 200ms latency worldwide
- 99.9% uptime

---

## Cost

| Service | Free Tier | Limits | Best For |
|---------|-----------|--------|----------|
| Railway | $5 credit | 500h/month | Production |
| Render | Free forever | Sleep after 15min idle | Testing |
| Fly.io | Free | 3 VMs | Production |
| ngrok | Free | Temporary URL | Dev/Testing |
| VPS | $5/month | Full control | Production |

**Recommendation:** Railway or Fly.io for production, ngrok for immediate testing

---

## FASTEST PATH:

```bash
# Terminal 1: Start bootstrap
cd apps/bootstrap-node
npm run dev

# Terminal 2: Expose with ngrok
ngrok http 3030
# Copy URL: https://abc123.ngrok.io

# Terminal 3: Update code
# Edit packages/ipfs/src/distributed-registry.ts
# Replace localhost:3030 with ngrok URL

# Terminal 4: Rebuild
npm run build

# Terminal 5: Test
# Open browser from ANOTHER device/network
# Should work globally!
```

**Time:** 5 minutes to global deployment

---

**Select deployment method based on requirements**
