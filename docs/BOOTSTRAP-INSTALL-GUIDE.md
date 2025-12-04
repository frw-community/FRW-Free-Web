# FRW Bootstrap Node Installation Guide

This guide provides step-by-step instructions for deploying FRW bootstrap nodes on Debian and Ubuntu servers.

Update ---
# On your VPS
cd ~/FRW-Free-Web

# Pull the latest changes with new bootstrap IPs
git pull origin main

git stash

rm -rf /apps/browser
rm -rf /apps/browser-frw

# Rebuild with new configuration
npm run clean
npm install
npm run build

# Restart services with new configuration
pm2 restart bootstrap-node
pm2 restart ipfs-daemon

---
needed for a node 
      # Start IPFS daemon first
      pm2 start "ipfs daemon" --name "ipfs-daemon"

      # Wait for IPFS to start
      sleep 10

      # Start the bootstrap node
      pm2 start npm --name "bootstrap-node" -- run start:bootstrap

      # Check status
      pm2 status

      # Save the configuration
      pm2 save
      pm2 startup
-----------------
# 1. System Update & Essentials
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential systemd-timesyncd

# 2. Fix Time Sync (Crucial for V2 PoW)
sudo systemctl enable systemd-timesyncd
sudo systemctl start systemd-timesyncd
sudo timedatectl set-ntp true

# 3. Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 typescript

# 4. Install & Config IPFS
wget https://dist.ipfs.tech/kubo/v0.29.0/kubo_v0.29.0_linux-amd64.tar.gz
tar -xvzf kubo_v0.29.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh
ipfs init --profile server
ipfs config --json Pubsub.Enabled true
ipfs config --json Experimental.Libp2pStreamMounting true

# 5. Clone & Build FRW Node
cd ~
git clone https://github.com/frw-community/FRW-Free-Web.git
cd FRW-Free-Web§
npm install
npm run build  # Builds ALL packages correctly

# 6. Start Services
pm2 start "ipfs daemon --enable-pubsub-experiment" --name ipfs
pm2 start apps/bootstrap-node/dist/index.js --name bootstrap-node
pm2 save
pm2 startup
---


## Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Installation on Debian/Ubuntu](#installation-on-debianubuntu)
- [IPFS Installation](#ipfs-installation)
- [FRW Bootstrap Node Setup](#frw-bootstrap-node-setup)
- [Firewall Configuration](#firewall-configuration)
- [Process Management with PM2](#process-management-with-pm2)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Debian 10+ or Ubuntu 18.04+ server
- SSH access with sudo privileges
- Internet connection (HTTPS must remain enabled)
- At least 2GB RAM and 10GB storage

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 2GB | 4GB |
| Storage | 10GB | 50GB |
| CPU | 2 cores | 4 cores |
| Network | 10 Mbps | 100 Mbps |

## Installation on Debian/Ubuntu

### 1. One-Command Setup (Recommended)

You can run this entire block on a fresh Debian/Ubuntu server to set up everything automatically.

```bash
# 1. System Update & Essentials
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential systemd-timesyncd

# 2. Fix Time Sync (Crucial for V2 PoW)
# Ensures server clock matches network time to validate timestamps
sudo systemctl enable systemd-timesyncd
sudo systemctl start systemd-timesyncd
sudo timedatectl set-ntp true

# 3. Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 typescript

# 4. Install & Config IPFS (Kubo)
wget https://dist.ipfs.tech/kubo/v0.29.0/kubo_v0.29.0_linux-amd64.tar.gz
tar -xvzf kubo_v0.29.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh
ipfs init --profile server
# Enable PubSub for mesh networking
ipfs config --json Pubsub.Enabled true
ipfs config --json Experimental.Libp2pStreamMounting true

# 5. Clone & Build FRW Node
cd ~
git clone https://github.com/frw-community/FRW-Free-Web.git
cd FRW-Free-Web
npm install
# Build all packages in correct order
npm run build

# 6. Start Services
pm2 start "ipfs daemon --enable-pubsub-experiment" --name ipfs
pm2 start apps/bootstrap-node/dist/index.js --name bootstrap-node
pm2 save
pm2 startup
```

### 2. Manual Installation Steps

If you prefer to run steps individually:

#### System Preparation
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential systemd-timesyncd

# Verify Time Sync (Required)
timedatectl status
```

#### Node.js Setup
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 typescript
```

#### IPFS Setup
```bash
wget https://dist.ipfs.tech/kubo/v0.29.0/kubo_v0.29.0_linux-amd64.tar.gz
tar -xvzf kubo_v0.29.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh
ipfs init --profile server
ipfs config --json Pubsub.Enabled true
```

#### FRW Node Setup
```bash
cd ~
git clone https://github.com/frw-community/FRW-Free-Web.git
cd FRW-Free-Web
npm install

# Build Project (Root build handles dependencies correctly)
npm run build
```

#### Start Services
```bash
pm2 start "ipfs daemon --enable-pubsub-experiment" --name ipfs
pm2 start apps/bootstrap-node/dist/index.js --name bootstrap-node
pm2 save
pm2 startup
```

### 3. Monitor Processes

```bash
# Check status
pm2 status

# View logs
pm2 logs bootstrap-node --lines 20
pm2 logs ipfs-daemon --lines 10

# Restart processes
pm2 restart bootstrap-node
pm2 restart ipfs-daemon

# Stop processes
pm2 stop bootstrap-node
pm2 stop ipfs-daemon
```

## Verification

### 1. Local Verification

```bash
# Check if IPFS is running
curl http://localhost:5001/api/v1/version

# Check if bootstrap node is running
curl http://localhost:3100/api/stats

# Check PM2 processes
pm2 status
```

### 2. External Verification

From your local machine:

```powershell
# Test connectivity to bootstrap node
curl http://<VPS_IP_ADDRESS>:3100/api/stats

# Test IPFS API (if exposed)
curl http://<VPS_IP_ADDRESS>:5001/api/v1/version
```

### 3. Test Name Registration

```bash
# From the VPS, test name registration
curl -X POST http://localhost:3100/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "test-name", "value": "test-value"}'

# Query the name
curl http://localhost:3100/api/resolve/test-name
```

## Troubleshooting

### Common Issues

#### 1. IPFS Breaking Network Connectivity

```bash
# Symptoms: Can't access HTTPS sites, git clone fails
# Cause: IPFS daemon binding to all interfaces and intercepting traffic

# Quick Fix: Stop IPFS and reconfigure
pm2 stop ipfs-daemon
pkill -f "ipfs daemon"

# Reset IPFS config to localhost only
ipfs config Addresses.API "/ip4/127.0.0.1/tcp/5001"
ipfs config Addresses.Gateway "/ip4/127.0.0.1/tcp/8080"
ipfs config Swarm.AddrFilters '["/ip4/0.0.0.0/tcp/0"]'

# Restart IPFS
pm2 start ipfs-daemon

# Verify network connectivity restored
curl -s https://api.github.com/users/github | head -1
ping -c 3 8.8.8.8

# Alternative: Use more restrictive IPFS startup
pm2 stop ipfs-daemon
pm2 start "ipfs daemon" --name "ipfs-daemon" -- --routing "dhtclient" --enable-pubsub-experiment
```

#### 2. Bootstrap Node Fails to Start

```bash
# Check bootstrap node logs
pm2 logs bootstrap-node --lines 50

# Common fixes:
# - Rebuild the project: npm run clean && npm run build
# - Check IPFS is running: curl localhost:5001/api/v1/version
# - Verify ports are not in use: netstat -tlnp | grep :3100
```

#### 3. Firewall Blocking Connections

```bash
# Check firewall status
sudo ufw status  # Ubuntu
sudo iptables -L  # Debian

# Test port accessibility
telnet localhost 3100
telnet <YOUR_IP> 3100
```

#### 4. Permission Issues

```bash
# Fix npm permission issues
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) ~/FRW-Free-Web

# Fix IPFS permission issues
sudo chown -R $USER:$USER ~/.ipfs
```

#### 5. Out of Memory

```bash
# Monitor memory usage
free -h
pm2 monit

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Performance Monitoring

```bash
# Monitor system resources
htop
iotop
df -h

# Monitor PM2 processes
pm2 monit

# Check network connections
netstat -tlnp | grep -E ':3100|:5001'
```

### Log Management

```bash
# View all logs
pm2 logs

# Rotate logs (prevent disk space issues)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## Security Recommendations

1. **Regular Updates**: Keep system and packages updated
   ```bash
   sudo apt update && sudo apt upgrade -y
   npm update -g
   ```

2. **SSH Security**: Use SSH keys, disable password auth
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart ssh
   ```

3. **Fail2Ban**: Protect against brute force attacks
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

4. **Monitoring**: Set up basic monitoring
   ```bash
   # Install basic monitoring tools
   sudo apt install htop iotop nethogs
   ```

## Maintenance

### Weekly Tasks

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update FRW code
cd ~/FRW-Free-Web
git pull origin main
npm run clean && npm run build

# Restart services
pm2 restart all

# Check logs
pm2 logs --err --lines 50
```

### Monthly Tasks

```bash
# Clean up old logs
pm2 flush

# Check disk space
df -h

# Update Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review PM2 logs: `pm2 logs bootstrap-node --lines 100`
3. Check system logs: `sudo journalctl -xe`
4. Verify network connectivity: `ping 8.8.8.8`
5. Test ports: `telnet localhost 3100`

For additional help, provide:
- OS version: `lsb_release -a`
- Node.js version: `node --version`
- PM2 status: `pm2 status`
- Error logs: `pm2 logs bootstrap-node --lines 50`
