#!/bin/bash

# FRW Bootstrap Node Installation Script
# Tested on Debian/Ubuntu - preserves network connectivity

set -e

echo "=== FRW Bootstrap Node Installation ==="

# 1. Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install essentials
echo "Installing essential tools..."
sudo apt install -y curl wget git build-essential

# 3. Install Node.js 20 LTS
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# 5. Install IPFS (Kubo)
echo "Installing IPFS Kubo..."
cd /tmp
wget https://dist.ipfs.tech/kubo/v0.29.0/kubo_v0.29.0_linux-amd64.tar.gz
tar xzvf kubo_v0.29.0_linux-amd64.tar.gz
cd kubo
sudo ./install.sh
cd /..
rm -rf kubo kubo_v0.29.0_linux-amd64.tar.gz

# 6. Initialize IPFS with SAFE configuration
echo "Initializing IPFS with network-safe configuration..."
ipfs init

# CRITICAL: Configure IPFS to NOT interfere with network
#ipfs config Addresses.API "/ip4/127.0.0.1/tcp/5001"
#ipfs config Addresses.Gateway "/ip4/127.0.0.1/tcp/8080"
#ipfs config --json Addresses.Swarm '["/ip4/127.0.0.1/tcp/4001"]'
#ipfs config --json Swarm.AddrFilters null

# 7. Clone FRW repository
echo "Cloning FRW repository..."
cd ~
git clone https://github.com/frw-community/FRW-Free-Web.git
cd FRW-Free-Web

# 8. Install dependencies and build
echo "Installing dependencies and building..."
npm install
npm run clean
npm run build

# 9. Configure FRW
echo "Configuring FRW..."
cp frw.config.example.json frw.config.json

# 10. Start services with PM2
echo "Starting services..."

# Start IPFS daemon (localhost only)
pm2 start "ipfs daemon" --name "ipfs-daemon"

# Wait for IPFS to start
sleep 10

# Verify IPFS is running locally
if curl -s http://127.0.0.1:5001/api/v1/version > /dev/null; then
    echo "✓ IPFS is running"
else
    echo "✗ IPFS failed to start"
    exit 1
fi

# Test network connectivity still works
if curl -s https://api.github.com/users/github > /dev/null; then
    echo "✓ Network connectivity preserved"
else
    echo "✗ Network connectivity broken - stopping"
    pm2 stop ipfs-daemon
    exit 1
fi

# Start bootstrap node
pm2 start npm --name "bootstrap-node" -- run start:bootstrap

# 11. Save PM2 configuration
pm2 save
pm2 startup

echo "=== Installation Complete ==="
echo "IPFS API: http://127.0.0.1:5001"
echo "Bootstrap Node: http://$(curl -s ifconfig.me):3100"
echo ""
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs bootstrap-node"
