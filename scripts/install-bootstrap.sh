#!/bin/bash

# ============================================
#   FRW Bootstrap Node - Safe Install Script
#   Fully Safe for Debian & Ubuntu
#   Includes Safe IPFS + PM2 Autostart
# ============================================

set -e
echo "=== FRW Bootstrap Node Installation ==="

# --------------------------------------------
# 1. Update system
# --------------------------------------------
echo "[1/10] Updating system..."
sudo apt update && sudo apt upgrade -y

# --------------------------------------------
# 2. Install essentials
# --------------------------------------------
echo "[2/10] Installing required packages..."
sudo apt install -y curl wget git build-essential

# --------------------------------------------
# 3. Install Node.js 20 LTS
# --------------------------------------------
echo "[3/10] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# --------------------------------------------
# 4. Install PM2
# --------------------------------------------
echo "[4/10] Installing PM2..."
sudo npm install -g pm2

# --------------------------------------------
# 5. Install IPFS (Kubo)
# --------------------------------------------
echo "[5/10] Installing IPFS Kubo..."
cd /tmp
wget https://dist.ipfs.tech/kubo/v0.29.0/kubo_v0.29.0_linux-amd64.tar.gz
tar xzvf kubo_v0.29.0_linux-amd64.tar.gz
cd kubo
sudo ./install.sh
cd /tmp
rm -rf kubo kubo_v0.29.0_linux-amd64.tar.gz

# --------------------------------------------
# 6. Initialize IPFS + Safe Local-Only Config
# --------------------------------------------
echo "[6/10] Initializing IPFS safely..."

ipfs init

echo "Applying SAFE IPFS configuration (local only)..."

ipfs config Addresses.API "/ip4/127.0.0.1/tcp/5001"
ipfs config Addresses.Gateway "/ip4/127.0.0.1/tcp/8080"

# Local-only swarm port (no external peers)
ipfs config --json Addresses.Swarm '["/ip4/127.0.0.1/tcp/4001"]'

# Disable mDNS peer discovery
ipfs config --json Discovery.MDNS.Enabled false

# Disable QUIC (can cause route issues)
ipfs config --json Swarm.Transports.Network.QUIC false

# Disable NAT mapping
ipfs config --json Swarm.DisableNatPortMap true

# Disable relay + autorelay
ipfs config --json Swarm.EnableRelayHop false
ipfs config --json Swarm.EnableAutoRelay false

# Disable routing (DHT)
ipfs config Routing.Type "none"

# --------------------------------------------
# 7. Clone FRW Repository
# --------------------------------------------
echo "[7/10] Cloning FRW repository..."
cd ~
rm -rf FRW-Free-Web || true
git clone https://github.com/frw-community/FRW-Free-Web.git
cd FRW-Free-Web

# --------------------------------------------
# 8. Build FRW
# --------------------------------------------
echo "[8/10] Installing dependencies & building..."
npm install
npm run clean
npm run build

# --------------------------------------------
# 9. Configure FRW
# --------------------------------------------
echo "[9/10] Configuring FRW..."
cp -f frw.config.example.json frw.config.json

# --------------------------------------------
# 10. Start IPFS + Bootstrap Node with PM2
# --------------------------------------------
echo "[10/10] Starting services..."

# START IPFS SAFELY VIA BINARY
pm2 start /usr/local/bin/ipfs --name "ipfs-daemon" -- daemon --routing=none

# Wait for IPFS
sleep 10

# Verify IPFS works
echo "Checking IPFS..."
if curl -s http://127.0.0.1:5001/api/v1/version > /dev/null; then
    echo "✓ IPFS OK"
else
    echo "✗ IPFS FAILED"
    exit 1
fi

# Verify HTTPS connectivity
echo "Checking HTTPS connectivity..."
if curl -s https://api.github.com/users/github > /dev/null; then
    echo "✓ Internet OK"
else
    echo "✗ INTERNET BROKEN – STOPPING FOR SAFETY"
    pm2 stop ipfs-daemon
    exit 1
fi

# Start bootstrap node
pm2 start npm --name "bootstrap-node" -- run start:bootstrap

# Save PM2 configuration for autostart
pm2 save
pm2 startup systemd -u $USER --hp $HOME

# --------------------------------------------
echo "=== Installation Complete ==="
echo ""
echo "IPFS API: http://127.0.0.1:5001"
echo "Check services: pm2 status"
echo "Logs:"
echo "  pm2 logs ipfs-daemon"
echo "  pm2 logs bootstrap-node"
echo ""
echo "Your node is running safely and will auto-start on reboot."
