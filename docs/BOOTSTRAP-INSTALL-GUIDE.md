# FRW Bootstrap Node Installation Guide

This guide provides step-by-step instructions for deploying FRW bootstrap nodes on Debian and Ubuntu servers.

## Quick Update Guide (Existing Nodes)

If you are updating an existing node to the latest version (including Node Discovery):

```bash
# On your VPS
cd ~/FRW-Free-Web

# Pull the latest changes
git reset --hard HEAD  # discard local changes
git pull origin main

# Rebuild with new configuration
npm install            # Install new dependencies (e.g. node-discovery)
npm run clean
npm run build:bootstrap

# Restart services
pm2 restart bootstrap-node
```

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

### 1. Update System Packages

```bash
# Update package lists
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### 2. Install Node.js (Latest LTS)

```bash
# Download and install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version
```

## IPFS Installation

### Option 1: Kubo (Go IPFS) - Recommended

Kubo is the official Go implementation of IPFS and is more stable for production use.

```bash
# Download latest Kubo version
cd /tmp
wget https://dist.ipfs.tech/kubo/v0.29.0/kubo_v0.29.0_linux-amd64.tar.gz

# Extract and install
tar xzvf kubo_v0.29.0_linux-amd64.tar.gz
cd kubo

# Install system-wide
sudo ./install.sh

# Cleanup
cd /..
rm -rf kubo kubo_v0.29.0_linux-amd64.tar.gz

# Verify installation
ipfs --version
```

### Option 2: JS-IPFS (Node.js based)

```bash
# Install IPFS via npm
sudo npm install -g ipfs

# Verify installation
npx ipfs --version
```

### Initialize and Configure IPFS

```bash
# Initialize IPFS repository
ipfs init

# Configure IPFS to bind only to localhost (prevents network interference)
ipfs config Addresses.API "/ip4/127.0.0.1/tcp/5001"
ipfs config Addresses.Gateway "/ip4/127.0.0.1/tcp/8080"
ipfs config Swarm.AddrFilters '["/ip4/0.0.0.0/tcp/0"]'

# Enable CORS for API access (localhost only)
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:5001", "http://127.0.0.1:5001"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'

# Optional: Limit bandwidth to prevent network saturation
ipfs config --json Swarm.Limit.ConnsInbound 50
ipfs config --json Swarm.Limit.ConnsOutbound 50
ipfs config --json Swarm.Limit.ConnsPerPeer 5

# Start IPFS daemon (background)
nohup ipfs daemon --migrate=true > /dev/null 2>&1 &

# Verify IPFS is running without breaking network
sleep 5
curl -s http://127.0.0.1:5001/api/v1/version || echo "IPFS not responding"

# Test external connectivity still works
ping -c 3 8.8.8.8
curl -s https://api.github.com/users/github | head -1
```

## FRW Bootstrap Node Setup

### 1. Clone the Repository

```bash
# Navigate to home directory
cd ~

# Clone the FRW repository
git clone https://github.com/your-org/FRW-Free-Web.git

# Enter the project directory
cd FRW-Free-Web
```

### 2. Install Dependencies

```bash
# Install project dependencies
npm install

# Verify installation
npm --version
```

### 3. Build the Project

```bash
# Clean previous builds
npm run clean

# Build all packages
npm run build

# Verify build success
ls -la apps/bootstrap-node/dist/
```

### 4. Configure Bootstrap Node

```bash
# Copy example configuration
cp frw.config.example.json frw.config.json

# Edit configuration (optional)
nano frw.config.json
```

Key configuration options:
```json
{
  "bootstrap": {
    "nodeId": "bootstrap-$(date +%s%N | cut -b1-13)",
    "httpPort": 3100,
    "ipfsApi": "/ip4/127.0.0.1/tcp/5001"
  },
  "network": {
    "bootstrapNodes": [
      "83.228.213.240:3100",
      "83.228.213.45:3100",
      "83.228.214.189:3100",
      "83.228.214.72:3100",
      "165.73.244.107:3100",
      "165.73.244.74:3100",
      "155.117.46.244:3100",
      "217.216.32.99:3100"
    ]
  }
}
```

## Firewall Configuration

### Ubuntu (UFW)

```bash
# Allow SSH (to maintain access)
sudo ufw allow ssh

# Allow bootstrap node port
sudo ufw allow 3100/tcp

# Allow IPFS API port (if needed)
sudo ufw allow 5001/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

### Debian (iptables)

```bash
# Create firewall rules
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3100 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5001 -j ACCEPT
sudo iptables -A INPUT -j DROP

# Save rules
sudo iptables-save | sudo tee /etc/iptables/rules.v4
sudo apt install -y iptables-persistent
```

### Cloud Provider Firewall

If using a cloud provider (AWS, DigitalOcean, Vultr, etc.), also configure their firewall:

- Open port 22 (SSH)
- Open port 3100 (Bootstrap Node)
- Open port 5001 (IPFS API - optional)

## Process Management with PM2

### 1. Start IPFS Daemon

```bash
# Stop any existing IPFS processes
pkill -f "ipfs daemon" || true

# Start IPFS with PM2 (localhost only, network-safe)
pm2 start "ipfs daemon" --name "ipfs-daemon" -- --migrate=true --enable-pubsub-experiment

# Wait for IPFS to start
sleep 10

# Verify IPFS is running locally
curl -s http://127.0.0.1:5001/api/v1/version

# IMPORTANT: Test that external connectivity still works
curl -s https://api.github.com/users/github | head -1
ping -c 3 8.8.8.8

# If external connectivity is broken, stop IPFS and reconfigure:
pm2 stop ipfs-daemon
ipfs config Swarm.AddrFilters '["/ip4/0.0.0.0/tcp/0"]'
pm2 start ipfs-daemon

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 2. Start Bootstrap Node

```bash
# Start bootstrap node with PM2
pm2 start npm --name "bootstrap-node" -- run start:bootstrap

# Save PM2 configuration
pm2 save
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
npm install
npm run clean && npm run build:bootstrap

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
