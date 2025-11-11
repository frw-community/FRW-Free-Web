# Quick Command Reference

**Status:** PRODUCTION READY | **Last Updated:** November 11, 2025

---

## Essential CLI Commands

```bash
# Setup (one-time)
frw init                          # Create keypair
frw register <name>               # Register global name (with PoW)

# Publishing
frw publish <directory>           # Publish to IPFS only
frw publish <directory> --name <name>  # Publish + update registry

# Utilities
frw serve [directory]             # Local preview server
frw keys                          # List keypairs
frw config show                   # Show configuration
frw ipfs                          # Check IPFS status
```

---

## Complete Workflow

```bash
# 1. Initialize
frw init

# 2. Start IPFS
ipfs daemon

# 3. Register name (wait ~10s for PoW)
frw register myname

# 4. Create content
mkdir my-site
echo "<h1>Hello FRW!</h1>" > my-site/index.html

# 5. Publish with name
frw publish my-site --name myname

# 6. Browse
cd apps/browser
npm run dev
# Navigate to: frw://myname/
```

---

## Build Commands

```bash
# Full build
cd "C:\Projects\FRW - Free Web Modern"
npm install
npm run build

# Build specific packages
npx tsc -b packages/common
npx tsc -b packages/crypto
npx tsc -b packages/ipfs
npx tsc -b apps/cli
npx tsc -b apps/bootstrap-node

# Link CLI globally
cd apps/cli
npm link
```

## VPS Management

### SSH Connection
```bash
ssh -i ~/.ssh/YOUR_KEY debian@83.228.214.189
```

### Service Management
```bash
# Bootstrap node
sudo systemctl status frw-bootstrap
sudo systemctl restart frw-bootstrap
sudo systemctl stop frw-bootstrap
sudo systemctl start frw-bootstrap

# IPFS daemon
sudo systemctl status ipfs
sudo systemctl restart ipfs

# View logs
sudo journalctl -u frw-bootstrap -f
sudo journalctl -u ipfs -f
sudo journalctl -u frw-bootstrap -n 100
```

### IPFS Commands
```bash
# Check IPFS
ipfs id
ipfs swarm peers
ipfs stats bw

# Manual daemon (testing)
ipfs daemon --enable-pubsub-experiment
```

### Port Checking
```bash
# Check if ports are listening
sudo netstat -tulpn | grep 3100
sudo netstat -tulpn | grep 4001
sudo netstat -tulpn | grep 5001

# Check processes
ps aux | grep node
ps aux | grep ipfs
```

## Testing & Verification

### Bootstrap Node API (PowerShell)
```powershell
# Health check
Invoke-RestMethod http://83.228.214.189:3100/health

# Stats
Invoke-RestMethod http://83.228.214.189:3100/api/stats

# Resolve specific name
Invoke-RestMethod http://83.228.214.189:3100/api/resolve/myname

# List all registered names
Invoke-RestMethod http://83.228.214.189:3100/api/names
```

### Bootstrap Node API (Bash/curl)
```bash
# Health check
curl http://83.228.214.189:3100/health

# Stats
curl http://83.228.214.189:3100/api/stats

# Resolve name
curl http://83.228.214.189:3100/api/resolve/myname

# Pretty print JSON
curl http://83.228.214.189:3100/api/stats | jq
```

### End-to-End Test
```bash
# 1. Register name
frw register testname

# 2. Publish content
frw publish ./test-site --name testname

# 3. Verify on VPS
curl http://83.228.214.189:3100/api/resolve/testname

# 4. Test in browser
# Navigate to frw://testname/
```

## Troubleshooting

### VPS Issues
```bash
# Check what's running
ps aux | grep node
ps aux | grep ipfs

# Check logs (last 50 lines)
sudo journalctl -u frw-bootstrap -n 50
sudo journalctl -u ipfs -n 50

# Follow logs (realtime)
sudo journalctl -u frw-bootstrap -f

# Restart services
sudo systemctl restart frw-bootstrap
sudo systemctl restart ipfs

# Check service status
sudo systemctl status frw-bootstrap
sudo systemctl status ipfs
```

### Local Issues
```bash
# Check IPFS
ipfs id
ipfs swarm peers
ipfs stats bw

# Restart IPFS
# Windows:
Stop-Process -Name "ipfs" -Force
Start-Process powershell -ArgumentList "ipfs daemon"

# Linux/Mac:
killall ipfs
ipfs daemon &

# Rebuild project
cd "C:\Projects\FRW - Free Web Modern"
npm run build

# Relink CLI
cd apps/cli
npm link
```

### Common Errors

**"Name not found"**
```bash
# Verify registration
Invoke-RestMethod http://83.228.214.189:3100/api/resolve/myname

# Re-register if needed
frw register myname
```

**"IPFS not connected"**
```bash
# Check daemon
ipfs id

# Start daemon
ipfs daemon
```

**"Registry update failed"**
```bash
# Republish with name
frw publish ./my-site --name myname
```

---

## Firewall Configuration

### UFW (Ubuntu/Debian)
```bash
# Install
sudo apt install ufw

# Add rules
sudo ufw allow 3100/tcp  # Bootstrap API
sudo ufw allow 4001/tcp  # IPFS Swarm
sudo ufw allow 22/tcp    # SSH

# Enable
sudo ufw enable

# Check status
sudo ufw status
```

### Infomaniak VPS (CSV Import)
```csv
"port_selection","ip_type","port_type","port_selection_type","port_selection_list",port_selection_range_start,port_selection_range_stop,"source_specific_ip_type","specific_ip","specific_ip_range_start","specific_ip_range_stop","specific_ip_subnetwork",enabled,"description"
"manual","all","TCP","select","3100",0,0,"all","","","","",1,"FRW Bootstrap"
"manual","all","TCP","select","4001",0,0,"all","","","","",1,"IPFS Swarm"
"manual","all","UDP","select","4001",0,0,"all","","","","",1,"IPFS QUIC"
"manual","all","TCP","select","22",0,0,"all","","","","",1,"SSH"
```

---

## File Locations

### VPS (Debian)
```
Project:        /home/debian/FRW-Free-Web/
Bootstrap:      /home/debian/FRW-Free-Web/apps/bootstrap-node/
IPFS Data:      /home/debian/.ipfs/
Services:       /etc/systemd/system/
  - frw-bootstrap.service
  - ipfs.service
Logs:           sudo journalctl -u frw-bootstrap
```

### Windows (Local Dev)
```
Project:        C:\Projects\FRW - Free Web Modern\
CLI:            apps\cli\dist\
Bootstrap:      apps\bootstrap-node\dist\
Browser:        apps\browser\
Config:         %USERPROFILE%\.frw\
Keys:           %USERPROFILE%\.frw\keys\
IPFS:           %USERPROFILE%\.ipfs\
```

---

## Important URLs

**Live Bootstrap Node:**
- Health: http://83.228.214.189:3100/health
- Stats: http://83.228.214.189:3100/api/stats
- Resolve: http://83.228.214.189:3100/api/resolve/<name>

**Documentation:**
- Quick Start: `QUICK_START.md`
- Deployment: `docs/deployment/DEPLOY_NOW_VPS.md`
- Full Docs: `docs/`
