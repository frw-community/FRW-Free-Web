# Quick Command Reference

## Local Development

```powershell
# Build everything
npm run build

# Start IPFS
ipfs daemon

# Start bootstrap node (manual)
cd apps\bootstrap-node
npm start

# Install CLI
npm run install:cli

# CLI commands
frw init
frw register <name>
frw publish <directory>
frw config show
```

## VPS Commands

```bash
# SSH
ssh -i ~/.ssh/KEY debian@83.228.214.189

# Service management
sudo systemctl status frw-bootstrap
sudo systemctl restart frw-bootstrap
sudo systemctl stop frw-bootstrap
sudo journalctl -u frw-bootstrap -f

# IPFS
ipfs daemon &
ipfs swarm peers
curl http://localhost:5001/api/v0/version

# Check ports
sudo netstat -tulpn | grep 3100
sudo netstat -tulpn | grep 4001
```

## Testing

```powershell
# Health check
Invoke-RestMethod http://83.228.214.189:3100/health

# Stats
Invoke-RestMethod http://83.228.214.189:3100/api/stats

# Resolve name
Invoke-RestMethod http://83.228.214.189:3100/api/resolve/NAME

# List all names
Invoke-RestMethod http://83.228.214.189:3100/api/names
```

## Troubleshooting

```bash
# VPS - Check what's running
ps aux | grep node
ps aux | grep ipfs

# VPS - Check logs
sudo journalctl -u frw-bootstrap -n 50
tail -f ~/ipfs.log

# VPS - Restart everything
sudo systemctl restart frw-bootstrap
killall ipfs && ipfs daemon &

# Local - Check IPFS
ipfs swarm peers
ipfs id
```

## Firewall

```bash
# Check status
sudo ufw status

# Add rules
sudo ufw allow 3100/tcp
sudo ufw allow 4001/tcp

# Enable
sudo ufw enable
```

## File Locations

```
VPS:
  Bootstrap: /home/debian/apps/bootstrap-node/
  Service: /etc/systemd/system/frw-bootstrap.service
  Logs: sudo journalctl -u frw-bootstrap
  IPFS: ~/.ipfs/

Local:
  Project: C:\Projects\FRW - Free Web Modern\
  CLI: apps\cli\dist\
  Bootstrap: apps\bootstrap-node\dist\
  Config: ~\.frw\
```
