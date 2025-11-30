#!/bin/bash
set -e

# ===============================
# FRW Secure IPFS + Bootstrap Setup
# ===============================

IPFS_BIN=/usr/local/bin/ipfs
PM2_BIN=$(which pm2)
USER=$(whoami)
IPFS_SERVICE=/etc/systemd/system/ipfs.service
LOGFILE=/var/log/ipfs-secure-setup.log

echo "=== FRW Secure Setup ===" | tee -a $LOGFILE

# -----------------------------------
# 1. Stop old PM2 IPFS
# -----------------------------------
if $PM2_BIN list | grep -q ipfs-daemon; then
    echo "[*] Stopping old PM2 IPFS process..." | tee -a $LOGFILE
    $PM2_BIN stop ipfs-daemon
    $PM2_BIN delete ipfs-daemon
fi

# -----------------------------------
# 2. Verify/install IPFS
# -----------------------------------
if [ ! -f $IPFS_BIN ]; then
    echo "[*] Installing IPFS Kubo..." | tee -a $LOGFILE
    cd /tmp
    wget https://dist.ipfs.tech/kubo/v0.29.0/kubo_v0.29.0_linux-amd64.tar.gz
    tar xzvf kubo_v0.29.0_linux-amd64.tar.gz
    cd kubo
    sudo ./install.sh
    cd /tmp
    rm -rf kubo kubo_v0.29.0_linux-amd64.tar.gz
fi

# Initialize IPFS if needed
if [ ! -d ~/.ipfs ]; then
    echo "[*] Initializing IPFS..." | tee -a $LOGFILE
    $IPFS_BIN init
fi

# -----------------------------------
# 3. Apply safe config
# -----------------------------------
echo "[*] Applying secure IPFS configuration..." | tee -a $LOGFILE

$IPFS_BIN config Routing.Type dht
$IPFS_BIN config Experimental.AcceleratedDHTClient true
$IPFS_BIN config --json Swarm.Security.Noise true
$IPFS_BIN config --json Swarm.Transports.Network.QUIC true
$IPFS_BIN config --json Swarm.Transports.Network.WebTransport true

$IPFS_BIN config Addresses.API /ip4/127.0.0.1/tcp/5001
$IPFS_BIN config Addresses.Gateway /ip4/0.0.0.0/tcp/8080

# Reset bootstraps and add defaults
$IPFS_BIN bootstrap rm --all
$IPFS_BIN bootstrap add --default

# -----------------------------------
# 4. Create systemd service for IPFS
# -----------------------------------
if [ ! -f $IPFS_SERVICE ]; then
    echo "[*] Creating systemd service for IPFS..." | tee -a $LOGFILE
    sudo tee $IPFS_SERVICE > /dev/null <<EOF
[Unit]
Description=IPFS Daemon
After=network.target

[Service]
ExecStart=$IPFS_BIN daemon --enable-gc
User=$USER
Restart=always
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable ipfs
    sudo systemctl start ipfs
fi

# -----------------------------------
# 5. Verify IPFS API
# -----------------------------------
echo "[*] Waiting 15s for IPFS API to start..." | tee -a $LOGFILE
sleep 15

API_OK=false
if curl -s http://127.0.0.1:5001/api/v0/version >/dev/null 2>&1; then
    echo "[✓] IPFS API is reachable" | tee -a $LOGFILE
    API_OK=true
else
    echo "[✗] IPFS API not reachable!" | tee -a $LOGFILE
fi

# -----------------------------------
# 6. Verify internet connectivity
# -----------------------------------
ONLINE=false
for host in 1.1.1.1 8.8.8.8 9.9.9.9; do
    if ping -c1 -W2 $host &>/dev/null; then
        ONLINE=true
        break
    fi
done

if [ "$ONLINE" = true ]; then
    echo "[✓] Internet connectivity OK" | tee -a $LOGFILE
else
    echo "[✗] No internet connectivity!" | tee -a $LOGFILE
    exit 1
fi

# -----------------------------------
# 7. Install/start PM2 and bootstrap node
# -----------------------------------
if ! command -v pm2 >/dev/null 2>&1; then
    echo "[*] Installing PM2..." | tee -a $LOGFILE
    sudo npm install -g pm2
fi

cd ~/FRW-Free-Web || git clone https://github.com/frw-community/FRW-Free-Web.git ~/FRW-Free-Web && cd ~/FRW-Free-Web
npm install
npm run clean
npm run build
cp frw.config.example.json frw.config.json

# Start bootstrap node with PM2
$PM2_BIN start npm --name bootstrap-node -- run start:bootstrap
$PM2_BIN save
$PM2_BIN startup systemd -u $USER --hp $HOME

echo "=== Setup Complete ===" | tee -a $LOGFILE
echo "IPFS API: http://127.0.0.1:5001"
echo "Gateway: http://<your-server-ip>:8080"
echo "Check PM2 status: pm2 status"
