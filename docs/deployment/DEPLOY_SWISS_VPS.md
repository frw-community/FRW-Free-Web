# Deploy FRW Bootstrap Node on Swiss VPS

**Your Setup:**
- **Linux VPS:** 83.228.214.189 (Debian 13, 2GB RAM, 1 CPU)
- **Location:** Plan-les-Ouates, Switzerland
- **Deployment Time:** 15-20 minutes

---

## Option 1: Docker Deployment (Recommended)

### Step 1: SSH into VPS

```bash
ssh -i [your-ssh-key] debian@83.228.214.189
```

### Step 2: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker debian

# Log out and back in for group changes
exit
# SSH back in
ssh -i [your-ssh-key] debian@83.228.214.189
```

### Step 3: Deploy Bootstrap Node

```bash
# Pull FRW bootstrap node image (once published)
docker pull ghcr.io/your-username/frw-bootstrap-node:latest

# Run the node
docker run -d \
  --name frw-bootstrap \
  --restart unless-stopped \
  -p 3100:3100 \
  -p 4001:4001 \
  -v /var/frw/data:/app/data \
  ghcr.io/your-username/frw-bootstrap-node:latest
```

### Step 4: Verify it's Running

```bash
# Check container status
docker ps

# Check logs
docker logs -f frw-bootstrap

# Test HTTP endpoint
curl http://localhost:3100/health
```

---

## Option 2: Manual Deployment (Without Docker)

### Step 1: Install Node.js

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x
npm --version
```

### Step 2: Clone and Build FRW

```bash
# Create directory
mkdir -p ~/frw
cd ~/frw

# Clone repository (or upload built files)
git clone https://github.com/your-username/FRW-Free-Web.git
cd FRW-Free-Web

# Install dependencies
npm install

# Build all packages
npm run build
```

### Step 3: Run Bootstrap Node

```bash
# Navigate to bootstrap node
cd apps/bootstrap-node

# Start the node
node dist/index.js
```

### Step 4: Setup as System Service

```bash
# Create systemd service
sudo nano /etc/systemd/system/frw-bootstrap.service
```

**Paste this configuration:**

```ini
[Unit]
Description=FRW Bootstrap Node
After=network.target

[Service]
Type=simple
User=debian
WorkingDirectory=/home/debian/frw/FRW-Free-Web/apps/bootstrap-node
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3100

[Install]
WantedBy=multi-user.target
```

**Enable and start service:**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable frw-bootstrap

# Start the service
sudo systemctl start frw-bootstrap

# Check status
sudo systemctl status frw-bootstrap

# View logs
sudo journalctl -u frw-bootstrap -f
```

---

## Firewall Configuration

```bash
# Allow HTTP and IPFS ports
sudo ufw allow 3100/tcp   # HTTP API
sudo ufw allow 4001/tcp   # IPFS swarm
sudo ufw enable
```

---

## Testing Your Node

### From Local Machine:

```bash
# Test health endpoint
curl http://83.228.214.189:3100/health

# Test IPv6
curl -6 http://[2001:1600:18:102::165]:3100/health

# Test name resolution (after registering a name)
curl http://83.228.214.189:3100/api/resolve/testname
```

### From VPS:

```bash
# Check if node is responding
curl http://localhost:3100/health

# Check IPFS connection
curl http://localhost:3100/api/stats
```

---

## Monitoring & Maintenance

### Check Logs:

**Docker:**
```bash
docker logs -f frw-bootstrap
```

**Systemd:**
```bash
sudo journalctl -u frw-bootstrap -f
```

### Update the Node:

**Docker:**
```bash
docker pull ghcr.io/your-username/frw-bootstrap-node:latest
docker stop frw-bootstrap
docker rm frw-bootstrap
# Run docker run command again (from Step 3)
```

**Manual:**
```bash
cd ~/frw/FRW-Free-Web
git pull
npm run build
sudo systemctl restart frw-bootstrap
```

---

## Troubleshooting

### Node Not Responding:

```bash
# Check if process is running
docker ps  # (Docker)
sudo systemctl status frw-bootstrap  # (Systemd)

# Check ports
sudo netstat -tulpn | grep 3100

# Restart node
docker restart frw-bootstrap  # (Docker)
sudo systemctl restart frw-bootstrap  # (Systemd)
```

### Port Already in Use:

```bash
# Find what's using port 3100
sudo lsof -i :3100

# Kill the process if needed
sudo kill -9 [PID]
```

### IPFS Connection Issues:

```bash
# Check IPFS daemon
docker exec -it frw-bootstrap sh -c "ipfs swarm peers"  # (Docker)

# Restart IPFS
docker restart frw-bootstrap
```

---

## Next Steps

1. **Verify node is accessible** from the internet
2. **Register a test name** using the CLI
3. **Test resolution** from another location
4. **Setup Windows VPS** (optional, for redundancy)
5. **Announce your node** to the community

---

## Community Contribution

Your node is now part of the FRW network! 

**Want to help more?**
- Share your node IP with the community
- Help others deploy their nodes
- Submit PRs to improve documentation

**Cost:** FREE (using existing infrastructure)  
**Maintenance:** < 5 minutes/month  
**Impact:** Powering a decentralized internet!
