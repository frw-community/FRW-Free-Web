# 🚀 DEPLOY FRW ON YOUR VPS - RIGHT NOW

**Time: 30-40 minutes**  
**Cost: $0/month (using YOUR servers)**  
**Result: 100% self-hosted decentralization**

---

## 🎯 YOUR ADVANTAGE

**You already have:**
- ✅ Linux VPS
- ✅ Windows VPS

**This is PERFECT because:**
- ✅ **$0/month** - no new costs
- ✅ **100% control** - no platform can shut you down
- ✅ **TRUE decentralization** - FRW philosophy
- ✅ **Censorship-proof** - government-resistant
- ✅ **Best possible setup** for FRW!

---

## ✅ DEPLOYMENT CHECKLIST

### ☐ 1. Linux VPS Setup (15-20 min)

**Prerequisites:**
- [ ] SSH access to your Linux VPS
- [ ] Root or sudo privileges
- [ ] Public IP address

**Steps:**
```bash
# 1. Connect
ssh user@your-linux-vps.com

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# 3. Install IPFS
cd /tmp
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar -xzf kubo_v0.24.0_linux-amd64.tar.gz
cd kubo && sudo bash install.sh
ipfs init

# 4. Clone & Build
cd ~
git clone https://github.com/YOUR-USERNAME/FRW-Free-Web-Modern.git
cd FRW-Free-Web-Modern
npm install && npm run build
cd apps/bootstrap-node
npm install && npm run build

# 5. Setup PM2
sudo npm install -g pm2
pm2 start ipfs --name "ipfs-daemon" -- daemon
sleep 10
pm2 start npm --name "frw-bootstrap" -- start
pm2 save
pm2 startup  # Run the command it outputs

# 6. Open Firewall
sudo ufw allow 3030/tcp
sudo ufw allow 4001/tcp
sudo ufw allow 5001/tcp
sudo ufw enable

# 7. Test
curl http://localhost:3030/health
```

**Your Linux Node URL:** `http://YOUR-LINUX-IP:3030`

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

# ✅ Should work!
```

---

## 🎉 SUCCESS CRITERIA

**You're done when:**
- [ ] Both VPS nodes show "ok" health status
- [ ] Both nodes have same registered names
- [ ] Browser can resolve frw:// URLs
- [ ] No errors in PM2/NSSM logs
- [ ] Firewall ports are open

---

## 📊 YOUR ARCHITECTURE

```
┌─────────────────────────────────────┐
│  Linux VPS                          │
│  IP: YOUR-LINUX-IP                  │
│  Port: 3030                         │
│  Cost: $0 (already paid)            │
│  Status: ✅ Running                 │
└─────────────────────────────────────┘
              ↕ Pubsub sync
┌─────────────────────────────────────┐
│  Windows VPS                        │
│  IP: YOUR-WINDOWS-IP                │
│  Port: 3030                         │
│  Cost: $0 (already paid)            │
│  Status: ✅ Running                 │
└─────────────────────────────────────┘
              ↕ Queries
┌─────────────────────────────────────┐
│  Users Worldwide                    │
│  → Query either node                │
│  → Get instant response             │
│  → ✅ Global resolution!            │
└─────────────────────────────────────┘
```

**Result:**
- ✅ 2 bootstrap nodes
- ✅ $0/month cost
- ✅ 99%+ uptime
- ✅ 100% YOUR control
- ✅ Censorship-proof
- ✅ **TRUE DECENTRALIZATION**

---

## 🔧 Quick Troubleshooting

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

## 📚 Full Documentation

**Detailed guides:**
- `apps/bootstrap-node/DEPLOY_VPS.md` - Complete VPS guide
- `DEPLOYMENT_STRATEGY.md` - Multi-node architecture
- `apps/bootstrap-node/README.md` - Bootstrap node docs

---

## 🚀 NEXT: LAUNCH!

**After deployment:**
1. **Monitor** - Check nodes daily for first week
2. **Community** - Invite others to run nodes
3. **Test** - Have friends in other countries test
4. **Launch** - Public alpha announcement!

---

## 💪 YOU DID IT!

**You now have:**
- Self-hosted bootstrap nodes
- Zero monthly costs
- 100% control over infrastructure
- Government-resistant architecture
- **READY TO COMPETE WITH WWW!**

**This is the TRUE FRW way!** 🌍

---

**Total Time:** 30-40 minutes  
**Total Cost:** $0/month  
**Decentralization:** 100% ✅  
**Ready to Launch:** YES! 🚀
