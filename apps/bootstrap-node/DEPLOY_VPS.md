# FRW Bootstrap Node - VPS Deployment Guide

Complete guide for deploying on your own servers

---

## Why Self-Hosted VPS

**Decentralization Benefits:**
- No monthly costs if using existing infrastructure
- Full administrative control
- Censorship-resistant operation
- No third-party dependencies
- Platform-independent

**Cloud Platform Limitations:**
- Account suspension risk
- Terms of service restrictions
- Platform uptime dependencies
- Recurring operational costs

---

## Prerequisites

### For Linux VPS:
- Ubuntu 20.04+ (or Debian/CentOS)
- 1GB RAM minimum (2GB recommended)
- 10GB disk space
- Root or sudo access
- Public IP address
- Ports: 3030, 4001, 5001

### For Windows VPS:
- Windows Server 2019+ (or Windows 10/11)
- 2GB RAM minimum
- 20GB disk space
- Administrator access
- Public IP address
- Ports: 3030, 4001, 5001

---

## Linux VPS Deployment (15-20 min)

### Step 1: Connect
```bash
ssh user@your-linux-vps.com
```

### Step 2: Install Node.js 20
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Verify
node --version  # v20.x.x
npm --version   # 10.x.x
```

### Step 3: Install IPFS
```bash
# Download IPFS Kubo
cd /tmp
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar -xzf kubo_v0.24.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh

# Initialize
ipfs init

# Verify
ipfs --version
```

### Step 4: Clone & Build FRW
```bash
# Clone repository
cd ~
git clone https://github.com/YOUR-USERNAME/FRW-Free-Web-Modern.git
cd FRW-Free-Web-Modern

# Install & build
npm install
npm run build

# Build bootstrap node
cd apps/bootstrap-node
npm install
npm run build
```

### Step 5: Setup PM2 (Process Manager)
```bash
# Install PM2
sudo npm install -g pm2

# Start IPFS
pm2 start ipfs --name "ipfs-daemon" -- daemon
sleep 10  # Wait for IPFS to be ready

# Start Bootstrap Node
cd ~/FRW-Free-Web-Modern/apps/bootstrap-node
pm2 start npm --name "frw-bootstrap" -- start

# Save configuration
pm2 save

# Auto-start on boot
pm2 startup
# Run the command that PM2 outputs

# View logs
pm2 logs frw-bootstrap
pm2 status
```

### Step 6: Configure Firewall
```bash
# Open required ports
sudo ufw allow 3030/tcp comment 'FRW Bootstrap HTTP'
sudo ufw allow 4001/tcp comment 'IPFS Swarm'
sudo ufw allow 5001/tcp comment 'IPFS API'
sudo ufw allow ssh

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status numbered
```

### Step 7: Test
```bash
# Local test
curl http://localhost:3030/health

# External test (from another machine)
curl http://YOUR-VPS-IP:3030/health

# Should return:
{
  "status": "ok",
  "nodeId": "bootstrap-xxx",
  "indexSize": 0
}
```

### Step 8 (Optional): Setup HTTPS
```bash
# Install Nginx + Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Create config
sudo nano /etc/nginx/sites-available/frw-bootstrap
```

**Add this config:**
```nginx
server {
    listen 80;
    server_name frw-bootstrap.your-domain.com;
    
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
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/frw-bootstrap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL (requires DNS A record pointing to your IP)
sudo certbot --nginx -d frw-bootstrap.your-domain.com

# Test HTTPS
curl https://frw-bootstrap.your-domain.com/health
```

**Linux Node Ready**

**Your URL:** `http://YOUR-IP:3030` or `https://frw-bootstrap.your-domain.com`

---

## Windows VPS Deployment (20-25 min)

### Step 1: Connect
- RDP to your Windows VPS
- Open PowerShell as Administrator

### Step 2: Install Node.js
```powershell
# Download Node.js installer
$url = "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi"
$output = "$env:TEMP\nodejs.msi"
Invoke-WebRequest -Uri $url -OutFile $output

# Install
Start-Process msiexec.exe -ArgumentList "/i $output /quiet" -Wait

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify
node --version
npm --version
```

### Step 3: Install IPFS
```powershell
# Create IPFS directory
New-Item -Path "C:\ipfs" -ItemType Directory -Force
cd C:\ipfs

# Download IPFS
$ipfsUrl = "https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_windows-amd64.zip"
Invoke-WebRequest -Uri $ipfsUrl -OutFile "ipfs.zip"

# Extract
Expand-Archive -Path "ipfs.zip" -DestinationPath "." -Force
cd kubo

# Add to PATH
$env:Path += ";C:\ipfs\kubo"
[System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\ipfs\kubo", "Machine")

# Initialize
ipfs init

# Verify
ipfs --version
```

### Step 4: Clone & Build FRW
```powershell
# Install Git if not installed
winget install Git.Git

# Close and reopen PowerShell to refresh PATH

# Clone repository
cd C:\
git clone https://github.com/YOUR-USERNAME/FRW-Free-Web-Modern.git
cd FRW-Free-Web-Modern

# Install & build
npm install
npm run build

# Build bootstrap node
cd apps\bootstrap-node
npm install
npm run build
```

### Step 5: Setup Windows Services (NSSM)
```powershell
# Install NSSM (Service Manager)
choco install nssm -y
# Or download from: https://nssm.cc/download

# Create IPFS service
nssm install IPFSDaemon "C:\ipfs\kubo\ipfs.exe" "daemon"
nssm set IPFSDaemon AppDirectory "C:\"
nssm set IPFSDaemon DisplayName "IPFS Daemon"
nssm set IPFSDaemon Description "IPFS Network Daemon for FRW"
nssm set IPFSDaemon Start SERVICE_AUTO_START

# Start IPFS
nssm start IPFSDaemon

# Wait for IPFS to start
Start-Sleep -Seconds 15

# Create FRW Bootstrap service
$nodePath = (Get-Command node).Source
$bootstrapPath = "C:\FRW-Free-Web-Modern\apps\bootstrap-node"

nssm install FRWBootstrap "$nodePath" "dist/index.js"
nssm set FRWBootstrap AppDirectory "$bootstrapPath"
nssm set FRWBootstrap DisplayName "FRW Bootstrap Node"
nssm set FRWBootstrap Description "FRW Distributed Name Registry Bootstrap Node"
nssm set FRWBootstrap Start SERVICE_AUTO_START

# Start FRW Bootstrap
nssm start FRWBootstrap

# Check services
nssm status IPFSDaemon
nssm status FRWBootstrap
```

### Step 6: Configure Windows Firewall
```powershell
# Allow FRW Bootstrap
New-NetFirewallRule -DisplayName "FRW Bootstrap HTTP" -Direction Inbound -LocalPort 3030 -Protocol TCP -Action Allow

# Allow IPFS ports
New-NetFirewallRule -DisplayName "IPFS Swarm" -Direction Inbound -LocalPort 4001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "IPFS API" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow

# Verify
Get-NetFirewallRule -DisplayName "FRW*"
```

### Step 7: Test
```powershell
# Local test
curl http://localhost:3030/health

# External test (from another machine)
curl http://YOUR-VPS-IP:3030/health
```

### Step 8 (Optional): Setup IIS Reverse Proxy
```powershell
# Install IIS + URL Rewrite + ARR
Install-WindowsFeature -name Web-Server -IncludeManagementTools
Install-WindowsFeature -name Web-Http-Redirect

# Download and install URL Rewrite
# https://www.iis.net/downloads/microsoft/url-rewrite

# Download and install ARR (Application Request Routing)
# https://www.iis.net/downloads/microsoft/application-request-routing

# Configure via IIS Manager GUI or PowerShell
# Similar to Nginx reverse proxy setup
```

**Windows Node Ready**

**Your URL:** `http://YOUR-IP:3030`

---

## Update FRW Client Code

**Edit:** `packages/ipfs/src/distributed-registry.ts`

```typescript
// Line ~334
const BOOTSTRAP_NODES = [
  'http://83.228.214.189:3100',  // Switzerland #1
  'http://83.228.213.45:3100',   // Switzerland #2
  'http://83.228.213.240:3100',  // Switzerland #3
  'http://83.228.214.72:3100',   // Switzerland #4
              'http://localhost:3100',
           
            "http://155.117.46.244:3100",
            "http://165.73.244.107:3100",
            "http://165.73.244.74:3100",
  'http://localhost:3100',       // Local dev
];
```

**Rebuild:**
```bash
cd C:\Projects\FRW - Free Web Modern
npm run build
```

---

## Testing Multi-Node Setup

```bash
# Test all nodes
curl http://linux-vps-ip:3030/health
curl http://windows-vps-ip:3030/health

# Register a test name
frw register testmultinode

# Check bootstrap nodes received it
curl http://linux-vps-ip:3030/api/resolve/testmultinode
curl http://windows-vps-ip:3030/api/resolve/testmultinode

# Both should return the same record!
```

---

## Monitoring & Maintenance

### Linux (PM2)
```bash
# View logs
pm2 logs frw-bootstrap
pm2 logs ipfs-daemon

# Restart services
pm2 restart frw-bootstrap
pm2 restart ipfs-daemon

# Monitor resources
pm2 monit
```

### Windows (NSSM)
```powershell
# View logs
Get-Content C:\Windows\System32\LogFiles\nssm\FRWBootstrap.log -Tail 50

# Restart services
Restart-Service FRWBootstrap
Restart-Service IPFSDaemon

# Check status
Get-Service | Where-Object {$_.DisplayName -like "*FRW*" -or $_.DisplayName -like "*IPFS*"}
```

### Both: Setup Monitoring
```bash
# UptimeRobot (free) - monitors every 5 minutes
# https://uptimerobot.com

# Add monitors for:
- http://linux-vps-ip:3030/health
- http://windows-vps-ip:3030/health

# Get alerts via email/SMS/Discord when down
```

---

## Troubleshooting

### IPFS Not Starting (Linux)
```bash
# Check IPFS logs
pm2 logs ipfs-daemon

# Manually test
ipfs daemon

# Check ports
sudo netstat -tulpn | grep 4001
sudo netstat -tulpn | grep 5001
```

### IPFS Not Starting (Windows)
```powershell
# Check service status
nssm status IPFSDaemon

# View logs
Get-Content C:\Users\USERNAME\.ipfs\daemon.log

# Manually test
cd C:\ipfs\kubo
.\ipfs.exe daemon
```

### Bootstrap Node Can't Connect to IPFS
```bash
# Check IPFS is running
curl http://localhost:5001/api/v0/version

# Check firewall allows localhost connections
# Check IPFS_URL environment variable
```

### Port Already in Use
```bash
# Linux: Find process on port 3030
sudo lsof -i :3030
# Kill it:
sudo kill -9 PID

# Windows: Find process
netstat -ano | findstr :3030
# Kill it:
taskkill /PID <PID> /F
```

---

## Cost Comparison

| Setup | Monthly Cost | Control | Uptime | Setup Time |
|-------|--------------|---------|--------|------------|
| **Your Linux VPS** | $0 (existing) | Full | Self-managed | 20 min |
| **Your Windows VPS** | $0 (existing) | Full | Self-managed | 25 min |
| Railway | $5 | Limited | 99.9% | 10 min |
| Fly.io | $5 | Limited | 99.9% | 10 min |

**Recommended: Your VPS (Linux + Windows) = $0/month + full control**

---

## Final Architecture

```
┌──────────────────────────────────────┐
│  Your Linux VPS                      │
│  Location: Europe/USA/Asia           │
│  URL: http://your-linux-ip:3030      │
│  Cost: $0 (already paid)             │
│  Control: Full                       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Your Windows VPS                    │
│  Location: Different continent       │
│  URL: http://your-windows-ip:3030    │
│  Cost: $0 (already paid)             │
│  Control: Full                       │
└──────────────────────────────────────┘

= 2 NODES, $0/MONTH, FULLY DECENTRALIZED
```

---

## Next Steps

1. Deploy on both VPS (30-40 min total)
2. Update client code with both URLs
3. Test globally from different networks
4. (Optional) Add Railway/Fly as 3rd node for redundancy
5. Complete deployment verification

---

**Infrastructure Complete**

Distributed node network operational. Content resolution available through multiple independent servers.
