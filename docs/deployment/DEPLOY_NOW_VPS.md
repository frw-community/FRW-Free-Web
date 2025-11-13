# [LAUNCH] DEPLOY FRW ON YOUR VPS - RIGHT NOW

**Time: 30-40 minutes**  
**Cost: $0/month (using YOUR servers)**  
**Result: 100% self-hosted decentralization**

---

## [TARGET] YOUR ADVANTAGE

**You already have:**
- [OK] Linux VPS
- [OK] Windows VPS

**This is PERFECT because:**
- [OK] **$0/month** - no new costs
- [OK] **100% control** - no platform can shut you down
- [OK] **TRUE decentralization** - FRW philosophy
- [OK] **Censorship-proof** - government-resistant
- [OK] **Best possible setup** for FRW!

---

## [OK] DEPLOYMENT CHECKLIST

### ☐ 1. Linux VPS Setup (Debian) - TESTED & WORKING

**Prerequisites:**
- [ ] SSH access to your Debian VPS
- [ ] Root or sudo privileges
- [ ] Public IP address (e.g., 83.228.214.189)

**Steps:**
```bash
# 1. SSH to VPS
ssh -i ~/.ssh/YOUR_KEY debian@YOUR_VPS_IP

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
node --version  # Should be v20.x

# 3. Install IPFS
cd /tmp
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar -xzf kubo_v0.24.0_linux-amd64.tar.gz
cd kubo && sudo bash install.sh
ipfs init

# 4. Enable IPFS Pubsub (REQUIRED)
ipfs config --json Experimental.Libp2pStreamMounting true
ipfs config --json Experimental.Pubsub true

# 5. Clone Repository
cd ~
git clone https://github.com/frw-community/FRW-Free-Web.git
cd FRW-Free-Web

# 6. Build Project
# IMPORTANT: Use --ignore-scripts to prevent build order issues
npm install --ignore-scripts

# Build packages in correct order (MUST include name-registry!)
npx tsc -b packages/common
npx tsc -b packages/crypto
npx tsc -b packages/protocol
npx tsc -b packages/name-registry
npx tsc -b packages/ipfs
npx tsc -b apps/bootstrap-node

# 7. Start IPFS Daemon
nohup ipfs daemon --enable-pubsub-experiment > ~/ipfs.log 2>&1 &
sleep 5

# 8. Test Bootstrap Node
cd ~/FRW-Free-Web/apps/bootstrap-node
HTTP_PORT=3100 IPFS_URL=http://localhost:5001 node dist/index.js
# Should see: [Bootstrap] ✓ Bootstrap node ready!
# Press Ctrl+C to stop

# 9. Create Systemd Service
sudo nano /etc/systemd/system/frw-bootstrap.service
```

**Paste this in the service file:**
```ini
[Unit]
Description=FRW Bootstrap Node
After=network.target

[Service]
Type=simple
User=debian
WorkingDirectory=/home/debian/FRW-Free-Web/apps/bootstrap-node
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=HTTP_PORT=3100
Environment=IPFS_URL=http://localhost:5001

[Install]
WantedBy=multi-user.target
```

**Continue:**
```bash
# 10. Create IPFS Service (Make It Permanent)
sudo nano /etc/systemd/system/ipfs.service
```

**Paste this in the IPFS service file:**
```ini
[Unit]
Description=IPFS Daemon
After=network.target

[Service]
Type=simple
User=debian
ExecStart=/usr/local/bin/ipfs daemon --enable-pubsub-experiment
Restart=always
RestartSec=10
Environment=IPFS_PATH=/home/debian/.ipfs

[Install]
WantedBy=multi-user.target
```

**Continue:**
```bash
# 11. Enable and Start Services
# First kill the nohup IPFS process
killall ipfs

# Enable both services
sudo systemctl daemon-reload
sudo systemctl enable ipfs
sudo systemctl enable frw-bootstrap

# Start IPFS first, then bootstrap
sudo systemctl start ipfs
sleep 5
sudo systemctl start frw-bootstrap

# Check status
sudo systemctl status ipfs
sudo systemctl status frw-bootstrap
# Both should show "active (running)"

# 12. Configure Firewall
# If using UFW:
sudo apt install ufw
sudo ufw allow 3100/tcp  # Bootstrap API
sudo ufw allow 4001/tcp  # IPFS Swarm
sudo ufw allow 22/tcp    # SSH - IMPORTANT!
sudo ufw enable

# If using VPS provider firewall (e.g., Infomaniak):
# Create firewall rules file
cat > ~/frw-firewall-infomaniak.csv << 'EOF'
"port_selection","ip_type","port_type","port_selection_type","port_selection_list",port_selection_range_start,port_selection_range_stop,"source_specific_ip_type","specific_ip","specific_ip_range_start","specific_ip_range_stop","specific_ip_subnetwork",enabled,"description"
"manual","all","TCP","select","3100",0,0,"all","","","","",1,"FRW Bootstrap HTTP API"
"manual","all","TCP","select","4001",0,0,"all","","","","",1,"IPFS Swarm TCP"
"manual","all","UDP","select","4001",0,0,"all","","","","",1,"IPFS Swarm UDP"
"manual","all","TCP","select","22",0,0,"all","","","","",1,"SSH Access"
EOF
# Download and import into VPS provider panel

# 12. Test Locally
curl http://localhost:3100/health
# Should return: {"status":"ok",...}

# 13. Test from Windows
Invoke-RestMethod http://YOUR_VPS_IP:3100/health
# Should return: {"status":"ok",...}

Invoke-RestMethod http://YOUR_VPS_IP:3100/api/stats
# Should return: {"nodeId":"...","totalNames":0,...}
```

---

## [TESTED] Verification & Testing

### Test Name Registration (Windows → VPS)

```powershell
# On Windows - register a name
frw register myname

# Should see:
# [DistributedRegistry] ✓ Submitted to bootstrap: http://YOUR_VPS_IP:3100
# ✓ Published to global network!

# Verify on VPS
Invoke-RestMethod http://YOUR_VPS_IP:3100/api/resolve/myname
# Should return name details

Invoke-RestMethod http://YOUR_VPS_IP:3100/api/stats
# Should show totalNames: 1
```

### Monitor VPS Services

```bash
# On VPS
sudo systemctl status ipfs
sudo systemctl status frw-bootstrap

# View logs
sudo journalctl -u frw-bootstrap -f
sudo journalctl -u ipfs -f

# Restart if needed
sudo systemctl restart frw-bootstrap
sudo systemctl restart ipfs
```

---

## [IMPORTANT] Troubleshooting

### Build Issues

**Problem:** `npm install` fails with "Cannot find module '@frw/ipfs'" or missing `.d.ts` files

**Root Cause:** The `postinstall` script in `apps/bootstrap-node` tries to build before dependencies are ready.

**Solution:**

```bash
cd ~/FRW-Free-Web

# Clean everything
rm -rf packages/*/dist apps/*/dist node_modules
find . -name "*.tsbuildinfo" -delete

# Reinstall WITHOUT running postinstall scripts
npm install --ignore-scripts

# Build packages in CORRECT order (name-registry is critical!)
npx tsc -b packages/common
npx tsc -b packages/crypto
npx tsc -b packages/protocol
npx tsc -b packages/name-registry  # MUST come before ipfs!
npx tsc -b packages/ipfs
npx tsc -b apps/bootstrap-node

# Verify .d.ts files were created
ls packages/common/dist/index.d.ts     # Should exist
ls packages/ipfs/dist/index.d.ts       # Should exist
ls apps/bootstrap-node/dist/index.js   # Should exist
```

**Why this is needed:**
- TypeScript monorepos require dependencies built first
- `packages/ipfs` depends on `packages/name-registry` 
- `apps/bootstrap-node` depends on `packages/ipfs`
- `--ignore-scripts` prevents premature builds
- Each package MUST generate `.d.ts` declaration files for dependents

### Bootstrap Node Not Receiving Names

**Problem:** Names registered on Windows don't appear on VPS.

**Solution:** Ensure Windows CLI uses VPS bootstrap nodes:

Check `apps/cli/src/commands/register.ts` line ~198:
```typescript
const registry = new DistributedNameRegistry({
  bootstrapNodes: [
    'http://YOUR_VPS_IP:3100',
    'http://localhost:3100'
  ]
});
```

Rebuild CLI after changes:
```powershell
npx tsc -b apps/cli
```

### IPFS Pubsub Errors

**Error:** `experimental pubsub feature not enabled`

**Non-critical** - HTTP bootstrap fallback works. To fix:

```bash
# On VPS
killall ipfs
ipfs config --json Experimental.Pubsub true
nohup ipfs daemon --enable-pubsub-experiment > ~/ipfs.log 2>&1 &

# On Windows (optional)
Stop-Process -Name "ipfs" -Force
ipfs config --json Experimental.Pubsub true
Start-Process powershell -ArgumentList "ipfs daemon --enable-pubsub-experiment"
```

### Firewall Issues

**Problem:** Can't reach VPS from Windows.

**Check:**
1. VPS provider firewall (Infomaniak panel)
2. Local firewall: `sudo iptables -L -n`
3. Port is listening: `sudo netstat -tulpn | grep 3100`

**Fix:** Import firewall rules (see step 11 above)

**Your Linux Node URL:** `http://YOUR-VPS-IP:3100`

**Example (Swiss VPS):** `http://83.228.214.189:3100`

**Save this:** `________________________________`

---

### ☐ 2. Windows VPS Setup (20-25 min)

**Prerequisites:**
- [ ] RDP access to your Windows VPS
- [ ] Administrator privileges
- [ ] Public IP address

**Steps (PowerShell as Administrator):**
```powershell
# 1. Install Node.js
$url = "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi"
Invoke-WebRequest -Uri $url -OutFile "$env:TEMP\nodejs.msi"
Start-Process msiexec.exe -ArgumentList "/i $env:TEMP\nodejs.msi /quiet" -Wait
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")

# 2. Install IPFS
New-Item -Path "C:\ipfs" -ItemType Directory -Force
cd C:\ipfs
$ipfsUrl = "https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_windows-amd64.zip"
Invoke-WebRequest -Uri $ipfsUrl -OutFile "ipfs.zip"
Expand-Archive -Path "ipfs.zip" -DestinationPath "." -Force
$env:Path += ";C:\ipfs\kubo"
[System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\ipfs\kubo", "Machine")
ipfs init

# 3. Clone & Build (if Git not installed: winget install Git.Git)
cd C:\
git clone https://github.com/YOUR-USERNAME/FRW-Free-Web-Modern.git
cd FRW-Free-Web-Modern
npm install
npm run build
cd apps\bootstrap-node
npm install
npm run build

# 4. Install NSSM (Service Manager)
# Download from https://nssm.cc/download or:
choco install nssm -y

# 5. Create Services
nssm install IPFSDaemon "C:\ipfs\kubo\ipfs.exe" "daemon"
nssm set IPFSDaemon Start SERVICE_AUTO_START
nssm start IPFSDaemon

Start-Sleep -Seconds 15

$nodePath = (Get-Command node).Source
nssm install FRWBootstrap "$nodePath" "dist/index.js"
nssm set FRWBootstrap AppDirectory "C:\FRW-Free-Web-Modern\apps\bootstrap-node"
nssm set FRWBootstrap Start SERVICE_AUTO_START
nssm start FRWBootstrap

# 6. Open Firewall
New-NetFirewallRule -DisplayName "FRW Bootstrap" -Direction Inbound -LocalPort 3030 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "IPFS Swarm" -Direction Inbound -LocalPort 4001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "IPFS API" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow

# 7. Test
curl http://localhost:3030/health
```

**Your Windows Node URL:** `http://YOUR-WINDOWS-IP:3030`

**Save this:** `________________________________`

---

### ☐ 3. Update FRW Code (2 min)

**Edit:** `packages/ipfs/src/distributed-registry.ts`

**Find line ~337 and replace TODO with your URLs:**

```typescript
const BOOTSTRAP_NODES = [
  'http://YOUR-LINUX-IP:3030',          // Replace with Linux IP
  'http://YOUR-WINDOWS-IP:3030',        // Replace with Windows IP
  'http://localhost:3030',              // Keep for dev
];
```

**Example:**
```typescript
const BOOTSTRAP_NODES = [
  'http://185.12.34.56:3030',           // Linux VPS
  'http://203.45.67.89:3030',           // Windows VPS
  'http://localhost:3030',
];
```

---

### ☐ 4. Rebuild FRW (1 min)

```bash
cd C:\Projects\FRW - Free Web Modern
npm run build
```

---

### ☐ 5. Test Everything (2 min)

**Test each node:**
```bash
# Test Linux node
curl http://YOUR-LINUX-IP:3030/health

# Test Windows node  
curl http://YOUR-WINDOWS-IP:3030/health

# Both should return:
{
  "status": "ok",
  "nodeId": "bootstrap-xxx",
  "indexSize": 0
}
```

---

### ☐ 6. Register Test Name (3 min)

```bash
# Make sure local IPFS is running
ipfs daemon

# In another terminal
cd C:\Projects\FRW - Free Web Modern
frw register testglobal

# Wait for PoW (~1-2 min)
# Should broadcast to BOTH your nodes!
```

---

### ☐ 7. Verify Global Resolution (1 min)

**Check both nodes received the registration:**

```bash
# Linux node
curl http://YOUR-LINUX-IP:3030/api/resolve/testglobal

# Windows node
curl http://YOUR-WINDOWS-IP:3030/api/resolve/testglobal

# Both should return same record!
```

---

### ☐ 8. Test in Browser (1 min)

```bash
# Start browser
cd apps\browser
npm run dev

# Navigate to:
frw://testglobal/

# [OK] Should work!
```

---

## [SUCCESS] SUCCESS CRITERIA

**You're done when:**
- [ ] Both VPS nodes show "ok" health status
- [ ] Both nodes have same registered names
- [ ] Browser can resolve frw:// URLs
- [ ] No errors in PM2/NSSM logs
- [ ] Firewall ports are open

---

## [CHART] YOUR ARCHITECTURE

```
┌─────────────────────────────────────┐
│  Linux VPS                          │
│  IP: YOUR-LINUX-IP                  │
│  Port: 3030                         │
│  Cost: $0 (already paid)            │
│  Status: [OK] Running                 │
└─────────────────────────────────────┘
              ↕ Pubsub sync
┌─────────────────────────────────────┐
│  Windows VPS                        │
│  IP: YOUR-WINDOWS-IP                │
│  Port: 3030                         │
│  Cost: $0 (already paid)            │
│  Status: [OK] Running                 │
└─────────────────────────────────────┘
              ↕ Queries
┌─────────────────────────────────────┐
│  Users Worldwide                    │
│  → Query either node                │
│  → Get instant response             │
│  → [OK] Global resolution!            │
└─────────────────────────────────────┘
```

**Result:**
- [OK] 2 bootstrap nodes
- [OK] $0/month cost
- [OK] 99%+ uptime
- [OK] 100% YOUR control
- [OK] Censorship-proof
- [OK] **TRUE DECENTRALIZATION**

---

## [TOOL] Quick Troubleshooting

### IPFS won't start (Linux)
```bash
pm2 logs ipfs-daemon
# Check ports: sudo netstat -tulpn | grep 5001
```

### IPFS won't start (Windows)
```powershell
nssm status IPFSDaemon
Get-Content C:\Users\USERNAME\.ipfs\daemon.log
```

### Bootstrap can't connect to IPFS
```bash
# Check IPFS API is accessible
curl http://localhost:5001/api/v0/version
```

### Port already in use
```bash
# Linux
sudo lsof -i :3030
sudo kill -9 PID

# Windows
netstat -ano | findstr :3030
taskkill /PID <PID> /F
```

---

## [VALIDATED] Successful Deployment Example

**Tested and working on November 11, 2025:**

### Configuration
- **VPS:** Debian (Infomaniak Switzerland)
- **IP:** 83.228.214.189
- **Bootstrap Port:** 3100
- **IPFS Version:** 0.24.0
- **Node.js Version:** 20.x

### Results
```bash
# VPS Status
$ curl http://83.228.214.189:3100/health
{"status":"ok","nodeId":"bootstrap-1762894170648",...}

# Name Registration (Windows → VPS)
PS> frw register vpstest7
[DistributedRegistry] ✓ Submitted to bootstrap: http://83.228.214.189:3100
✓ Published to global network!

# Name Resolution
PS> Invoke-RestMethod http://83.228.214.189:3100/api/resolve/vpstest7
{
  "name": "vpstest7",
  "publicKey": "GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb",
  "contentCID": "",
  "ipnsKey": "/ipns/GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb",
  "timestamp": 1762895009767,
  "signature": "X6B3ADoWUFlJFp7WT9LXY7M0kyRyCV+fMFCeoblFuMee0MokBA4JYyAIvN7WyUjglJFhYo9Zh6jz9w/bAPNFCw==",
  "resolvedBy": "bootstrap-1762894170648"
}

# Stats
PS> Invoke-RestMethod http://83.228.214.189:3100/api/stats
{"nodeId":"bootstrap-1762894170648","totalNames":1,"uptime":891.366,...}
```

### Key Learnings
1. **TypeScript Build:** Packages must be built individually with `--force` on fresh VPS
2. **IPFS Pubsub:** Must enable with `--enable-pubsub-experiment` flag
3. **HTTP Fallback:** Bootstrap node HTTP submission works when pubsub fails
4. **Firewall:** VPS provider panel (Infomaniak) requires CSV import for rules
5. **Systemd:** Both IPFS and bootstrap need separate services

### Total Deployment Time
- **Initial:** 90 minutes (with troubleshooting)
- **Repeat:** 30 minutes (with documented steps)

---

## [DOCS] Full Documentation

**Detailed guides:**
- `apps/bootstrap-node/DEPLOY_VPS.md` - Complete VPS guide
- `DEPLOYMENT_STRATEGY.md` - Multi-node architecture
- `apps/bootstrap-node/README.md` - Bootstrap node docs

---

## [LAUNCH] NEXT: LAUNCH!

**After deployment:**
1. **Monitor** - Check nodes daily for first week
2. **Community** - Invite others to run nodes
3. **Test** - Have friends in other countries test
4. **Launch** - Public alpha announcement!

---

## [STRONG] YOU DID IT!

**You now have:**
- Self-hosted bootstrap nodes
- Zero monthly costs
- 100% control over infrastructure
- Government-resistant architecture
- **READY TO COMPETE WITH WWW!**

**This is the TRUE FRW way!** [WORLD]

---

**Total Time:** 30-40 minutes  
**Total Cost:** $0/month  
**Decentralization:** 100% [OK]  
**Ready to Launch:** YES! [LAUNCH]
