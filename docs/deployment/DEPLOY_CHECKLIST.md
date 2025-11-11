# FRW VPS Deployment Checklist

**Target:** Linux VPS 83.228.214.189 (Debian 13)
**Time:** 30-40 minutes
**Goal:** Bootstrap node running, name resolution working

---

## Pre-Flight Check (Local)

```powershell
# 1. Verify build
cd C:\Projects\FRW - Free Web Modern
npm run build
# Should complete with no errors

# 2. Check bootstrap files exist
Test-Path apps\bootstrap-node\dist\index.js
# Should return: True

# 3. Locate SSH key
ls ~\.ssh\
# Note your key filename
```

---

## Step 1: SSH to VPS (2 min)

```bash
# Replace YOUR_KEY with actual key filename
ssh -i C:\Users\nchap\.ssh\YOUR_KEY debian@83.228.214.189

# If successful, you'll see: debian@vps-hostname:~$
```

**Common Issues:**
- "Permission denied" → Check key path
- "Host not found" → Check IP address
- "Connection refused" → VPS might be down

---

## Step 2: Install IPFS (5 min)

```bash
# Download
wget https://dist.ipfs.tech/kubo/v0.25.0/kubo_v0.25.0_linux-amd64.tar.gz

# Extract
tar -xvzf kubo_v0.25.0_linux-amd64.tar.gz
cd kubo

# Install
sudo bash install.sh

# Verify
ipfs version
# Should show: ipfs version 0.25.0

# Initialize
ipfs init

# Start daemon (background)
nohup ipfs daemon > ~/ipfs.log 2>&1 &

# Verify running
curl http://localhost:5001/api/v0/version
# Should return JSON with version
```

---

## Step 3: Install Node.js (3 min)

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install
sudo apt install -y nodejs

# Verify
node --version  # Should be v20.x
npm --version   # Should be 10.x
```

---

## Step 4: Upload Bootstrap Node (5 min)

**Open NEW terminal on Windows (keep SSH open):**

```powershell
# Navigate to project
cd C:\Projects\FRW - Free Web Modern

# Create tarball
tar -czf bootstrap-node.tar.gz apps\bootstrap-node\package.json apps\bootstrap-node\dist\

# Upload to VPS
scp -i C:\Users\nchap\.ssh\YOUR_KEY bootstrap-node.tar.gz debian@83.228.214.189:~/

# If scp not found, install:
# choco install rsync
```

**Back to SSH terminal:**

```bash
# Extract
tar -xzf bootstrap-node.tar.gz
cd apps/bootstrap-node

# Install dependencies
npm install --production

# Verify
ls dist/index.js
# Should exist
```

---

## Step 5: Test Bootstrap Node (3 min)

```bash
# Test run (foreground)
HTTP_PORT=3100 IPFS_URL=http://localhost:5001 node dist/index.js

# Should see:
# [Bootstrap] Starting FRW Bootstrap Node
# [Bootstrap] Connected to IPFS 0.25.0
# [Bootstrap] HTTP server listening on port 3100
# [Bootstrap] Bootstrap node ready!

# Press Ctrl+C to stop
```

**If errors:**
- "Cannot find module" → npm install failed
- "IPFS connection failed" → IPFS daemon not running
- "Port 3100 in use" → Another process using port

---

## Step 6: Create System Service (5 min)

```bash
# Create service file
sudo nano /etc/systemd/system/frw-bootstrap.service
```

**Paste this (Ctrl+Shift+V):**

```ini
[Unit]
Description=FRW Bootstrap Node
After=network.target

[Service]
Type=simple
User=debian
WorkingDirectory=/home/debian/apps/bootstrap-node
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=HTTP_PORT=3100
Environment=IPFS_URL=http://localhost:5001

[Install]
WantedBy=multi-user.target
```

**Save: Ctrl+O, Enter, Ctrl+X**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable frw-bootstrap

# Start service
sudo systemctl start frw-bootstrap

# Check status
sudo systemctl status frw-bootstrap
# Should show: active (running)

# View logs
sudo journalctl -u frw-bootstrap -f
# Press Ctrl+C to stop viewing
```

---

## Step 7: Configure Firewall (2 min)

```bash
# Allow HTTP API
sudo ufw allow 3100/tcp

# Allow IPFS
sudo ufw allow 4001/tcp

# Enable firewall
sudo ufw enable
# Type 'y' to confirm

# Verify rules
sudo ufw status
```

---

## Step 8: Test from Local Machine (3 min)

**On your Windows machine:**

```powershell
# Test health endpoint
Invoke-RestMethod http://83.228.214.189:3100/health

# Should return:
# status: ok
# nodeId: bootstrap-...
# indexSize: 0
# uptime: ...

# Test stats
Invoke-RestMethod http://83.228.214.189:3100/api/stats

# Test names (should be empty)
Invoke-RestMethod http://83.228.214.189:3100/api/names
```

**If fails:**
- "Connection refused" → Firewall blocking
- "No route to host" → VPS network issue
- "Timeout" → Service not running

---

## Step 9: Register Test Name (5 min)

```powershell
# Initialize FRW CLI (first time)
frw init
# Follow prompts

# Register test name
frw register vpstest

# Wait for POW (should be fast for 7-letter name)
# Expected: 5-10 seconds

# Should see:
# Proof of Work generated
# Published to global network
# Registration Complete
```

---

## Step 10: Verify Resolution (2 min)

```powershell
# Check bootstrap node received it
Invoke-RestMethod http://83.228.214.189:3100/api/resolve/vpstest

# Should return:
# name: vpstest
# publicKey: ...
# contentCID: ...
# signature: ...
# resolvedBy: bootstrap-...

# Check local config
frw config show
# Should list vpstest
```

---

## Success Criteria

- [x] SSH works
- [x] IPFS daemon running
- [x] Node.js installed
- [x] Bootstrap files uploaded
- [x] Service running
- [x] Firewall configured
- [x] Health endpoint responds
- [x] Name registered
- [x] Resolution works

---

## Troubleshooting

### SSH Issues

```bash
# Test connection
ping 83.228.214.189

# Verbose SSH
ssh -v -i C:\Users\nchap\.ssh\YOUR_KEY debian@83.228.214.189
```

### IPFS Not Starting

```bash
# Check if running
ps aux | grep ipfs

# Check logs
tail -f ~/ipfs.log

# Restart
killall ipfs
ipfs daemon &
```

### Bootstrap Node Crashes

```bash
# View logs
sudo journalctl -u frw-bootstrap -n 100

# Common issues:
# - IPFS not running: Start IPFS first
# - Port in use: Change HTTP_PORT
# - Missing deps: Run npm install
```

### Firewall Blocking

```bash
# Check firewall status
sudo ufw status

# Temporarily disable (testing only)
sudo ufw disable

# Re-enable
sudo ufw enable
```

### Name Registration Fails

```powershell
# Check IPFS on local machine
ipfs daemon

# Check bootstrap node reachable
Test-NetConnection -ComputerName 83.228.214.189 -Port 3100

# Try with verbose
frw register testname --verbose
```

---

## Next Steps After Success

1. Deploy Windows VPS (optional)
2. Update code with Windows IP
3. Test multi-node resolution
4. Publish real site
5. Soft launch

---

## Rollback Plan

If deployment fails:

```bash
# Stop service
sudo systemctl stop frw-bootstrap
sudo systemctl disable frw-bootstrap

# Remove service
sudo rm /etc/systemd/system/frw-bootstrap.service
sudo systemctl daemon-reload

# Clean up
cd ~
rm -rf apps bootstrap-node.tar.gz
```

VPS remains clean. Try again later.
