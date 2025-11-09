#!/bin/bash
# FRW Bootstrap Node - VPS Deployment Script
# Usage: ./deploy-vps.sh [docker|manual]

set -e

echo "======================================="
echo "FRW Bootstrap Node - VPS Deployment"
echo "======================================="
echo ""

# Check deployment method
METHOD=${1:-docker}

if [ "$METHOD" = "docker" ]; then
    echo "[INFO] Using Docker deployment method"
    echo ""
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo "[INSTALL] Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        echo "[OK] Docker installed! Please log out and back in, then run this script again."
        exit 0
    fi
    
    echo "[OK] Docker is installed"
    echo ""
    
    # Build Docker image locally (temporary, until we publish to registry)
    echo "[BUILD] Building Docker image..."
    cd "$(dirname "$0")/.."
    docker build -t frw-bootstrap-node:latest -f apps/bootstrap-node/Dockerfile .
    
    echo "[OK] Docker image built"
    echo ""
    
    # Stop existing container if running
    if docker ps -a | grep -q frw-bootstrap; then
        echo "[CLEANUP] Stopping existing container..."
        docker stop frw-bootstrap || true
        docker rm frw-bootstrap || true
    fi
    
    # Create data directory
    sudo mkdir -p /var/frw/data
    sudo chown -R $USER:$USER /var/frw
    
    # Run the container
    echo "[DEPLOY] Starting FRW bootstrap node..."
    docker run -d \
        --name frw-bootstrap \
        --restart unless-stopped \
        -p 3100:3100 \
        -p 4001:4001 \
        -v /var/frw/data:/app/data \
        frw-bootstrap-node:latest
    
    echo ""
    echo "[SUCCESS] Bootstrap node deployed!"
    echo ""
    echo "Container Status:"
    docker ps | grep frw-bootstrap
    echo ""
    echo "View logs: docker logs -f frw-bootstrap"
    echo "Test endpoint: curl http://localhost:3100/health"
    echo ""
    
elif [ "$METHOD" = "manual" ]; then
    echo "[INFO] Using manual deployment method"
    echo ""
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo "[INSTALL] Installing Node.js 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    
    echo "[OK] Node.js $(node --version) installed"
    echo ""
    
    # Build the project
    echo "[BUILD] Building FRW packages..."
    cd "$(dirname "$0")/.."
    npm install
    npm run build
    
    echo "[OK] Build complete"
    echo ""
    
    # Create systemd service
    echo "[DEPLOY] Setting up systemd service..."
    sudo tee /etc/systemd/system/frw-bootstrap.service > /dev/null <<EOF
[Unit]
Description=FRW Bootstrap Node
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/apps/bootstrap-node
ExecStart=$(which node) dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3100

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable and start service
    sudo systemctl daemon-reload
    sudo systemctl enable frw-bootstrap
    sudo systemctl start frw-bootstrap
    
    echo ""
    echo "[SUCCESS] Bootstrap node deployed as systemd service!"
    echo ""
    echo "Service Status:"
    sudo systemctl status frw-bootstrap --no-pager
    echo ""
    echo "View logs: sudo journalctl -u frw-bootstrap -f"
    echo "Test endpoint: curl http://localhost:3100/health"
    echo ""
    
else
    echo "[ERROR] Invalid deployment method: $METHOD"
    echo "Usage: ./deploy-vps.sh [docker|manual]"
    exit 1
fi

# Configure firewall
echo "[FIREWALL] Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 3100/tcp
    sudo ufw allow 4001/tcp
    echo "[OK] Firewall rules added"
else
    echo "[SKIP] UFW not installed, skipping firewall configuration"
fi

echo ""
echo "======================================="
echo "Deployment Complete!"
echo "======================================="
echo ""
echo "Your bootstrap node is now running at:"
echo "  - HTTP API: http://$(hostname -I | awk '{print $1}'):3100"
echo "  - Health: http://$(hostname -I | awk '{print $1}'):3100/health"
echo ""
echo "Next steps:"
echo "  1. Test from external network: curl http://YOUR_PUBLIC_IP:3100/health"
echo "  2. Register a test name: frw register myname"
echo "  3. Verify resolution works"
echo ""
