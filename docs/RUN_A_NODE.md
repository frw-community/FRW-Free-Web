# 🌍 Run a FRW Bootstrap Node

**Help build the decentralized web - run a node in your region!**

---

## 🎯 Why Run a Node?

### Benefits for Everyone:
- ✅ **Improve FRW speed** in your region
- ✅ **Support decentralization** - no single point of control
- ✅ **Censorship resistance** - many nodes = can't be shut down
- ✅ **Community building** - be part of something bigger

### Benefits for You:
- 🏆 **"Bootstrap Provider" badge** on FRW website
- 📜 **Listed on** frw.network/nodes
- ⭐ **Community recognition**
- 🎯 **Priority support** (if you need help)
- 💰 **Future benefits:** Revenue share, governance voting (planned)

---

## 📋 Requirements

### Minimum:
- **Server:** Any Linux VPS, home server, or Raspberry Pi
- **RAM:** 1GB minimum (2GB recommended)
- **Disk:** 10GB free space
- **Network:** Public IP address
- **Port:** 3030 open to internet
- **Cost:** Whatever you're already paying for your server

### Supported:
- ✅ Ubuntu/Debian Linux
- ✅ Any VPS provider (Hetzner, Linode, DigitalOcean, etc.)
- ✅ Home server / NAS
- ✅ Raspberry Pi 4+ (with 2GB+ RAM)
- ✅ Docker (easiest)

---

## 🚀 Quick Start (3 Options)

### Option 1: Docker (EASIEST - 2 minutes)

```bash
# Install Docker if not already installed
curl -fsSL https://get.docker.com | sh

# Run FRW bootstrap node
docker run -d \
  --name frw-bootstrap \
  --restart unless-stopped \
  -p 3030:3030 \
  -p 4001:4001 \
  -p 5001:5001 \
  -e NODE_ID="community-$(whoami)-$(hostname)" \
  frw/bootstrap-node:latest

# Check it's running
curl http://localhost:3030/health
```

**Done! Node is running!** ✅

---

### Option 2: Auto-Install Script (5 minutes)

```bash
# Download and run install script
curl -fsSL https://get.frw.network/bootstrap | bash

# Script will:
# - Install Node.js 20
# - Install IPFS
# - Clone FRW bootstrap code
# - Setup PM2 for auto-restart
# - Configure firewall
# - Start services

# Check status
pm2 status frw-bootstrap
curl http://localhost:3030/health
```

**Done! Node is running!** ✅

---

### Option 3: Manual Install (15 minutes)

**For full control, follow:** `apps/bootstrap-node/DEPLOY_VPS.md`

---

## 🌐 Register Your Node

**After starting your node, register it with the community:**

### Online Form (EASIEST):
```
Visit: https://frw.network/register-node

Fill in:
- Node URL: http://your-ip-or-domain:3030
- Location: Your country/city
- Contact: your@email.com (optional, for updates)
- Operator: Your name/handle
```

### API (Advanced):
```bash
curl -X POST https://api.frw.network/nodes/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://your-ip:3030",
    "location": "Germany",
    "operator": "YourName",
    "contact": "your@email.com"
  }'
```

**Your node will appear on:** https://frw.network/nodes

---

## 🔧 Configuration

### Environment Variables:

```bash
# Optional customization
NODE_ID=my-custom-node-name    # Default: auto-generated
HTTP_PORT=3030                  # Default: 3030
IPFS_URL=http://localhost:5001 # Default: http://localhost:5001
```

### With Docker:
```bash
docker run -d \
  -p 3030:3030 \
  -e NODE_ID="my-node" \
  -e HTTP_PORT=3030 \
  frw/bootstrap-node
```

---

## 📊 Monitoring

### Check Node Health:
```bash
# Local check
curl http://localhost:3030/health

# External check
curl http://your-public-ip:3030/health

# Should return:
{
  "status": "ok",
  "nodeId": "your-node-id",
  "indexSize": 123,
  "uptime": 3600
}
```

### View Logs:
```bash
# Docker
docker logs -f frw-bootstrap

# PM2
pm2 logs frw-bootstrap

# Check what names are indexed
curl http://localhost:3030/api/stats
```

---

## 🔒 Security

### Firewall Configuration:
```bash
# Allow FRW bootstrap
sudo ufw allow 3030/tcp

# Allow IPFS (if running IPFS)
sudo ufw allow 4001/tcp  # IPFS swarm
sudo ufw allow 5001/tcp  # IPFS API (only if needed)
```

### HTTPS (Optional but Recommended):
```bash
# If you have a domain pointing to your IP
# Install Nginx + Certbot
sudo apt install nginx certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Configure nginx to proxy to port 3030
# Then your node is accessible via:
https://your-domain.com
```

---

## 🆘 Troubleshooting

### Node not accessible from outside:
```bash
# Check if port 3030 is open
sudo netstat -tulpn | grep 3030

# Check firewall
sudo ufw status

# Test from another machine
curl http://your-public-ip:3030/health
```

### IPFS not connecting:
```bash
# Check IPFS status
ipfs id

# Restart IPFS
pm2 restart ipfs-daemon  # If using PM2
docker restart frw-bootstrap  # If using Docker
```

### High memory usage:
```bash
# Check memory
free -h

# Bootstrap node should use < 500MB
# If higher, check logs for issues
```

---

## 💰 Cost

### Typical Costs:

**VPS (Small):**
- Hetzner CPX11: €4/month (~$4.50)
- Linode Nanode: $5/month
- DigitalOcean Basic: $6/month

**Home Server:**
- Electricity: ~$2-5/month
- Internet: Already paying for it

**Raspberry Pi 4:**
- One-time: $35-75 (device)
- Monthly: $1-3 (electricity)

**Worth it?**
- ✅ Help thousands of users
- ✅ Support decentralization
- ✅ Community recognition
- ✅ Future benefits (revenue share, etc.)

---

## 📈 Impact

### Your Node Helps:

**100 users/day:**
- Serve ~1,000 name resolutions
- Save ~10ms latency for local users
- Provide redundancy for network

**1000 users/day:**
- Serve ~10,000 name resolutions
- Critical infrastructure node
- Significant community contribution

**Every node matters!** Even a single node in an underserved region helps thousands of users.

---

## 🌍 Where to Run Nodes

### Most Needed Regions (as of launch):

**High Priority:**
- 🇺🇸 USA (no nodes yet)
- 🇸🇬 Singapore / 🇯🇵 Japan (no nodes yet)
- 🇧🇷 Brazil (no nodes yet)
- 🇮🇳 India (no nodes yet)

**Already Covered:**
- 🇨🇭 Switzerland (2 nodes - founder's)

**Your region not listed?**  
Run a node anyway! Every location helps someone.

---

## 🤝 Community Support

### Questions?
- 💬 Discord: discord.gg/frw
- 📧 Email: support@frw.network
- 📖 Docs: docs.frw.network
- 🐛 Issues: github.com/frw/issues

### Node Operators Group:
- Private Discord channel for node operators
- Monthly video calls
- Early access to features
- Direct communication with core team

---

## 🎯 Next Steps

### After Running Your Node:

1. **Register it** at frw.network/register-node
2. **Join Discord** and introduce yourself
3. **Monitor** via frw.network/nodes
4. **Help others** run nodes in their regions
5. **Stay updated** on node operator benefits

---

## 💪 You're Building the Future

**Every node you run:**
- ✅ Makes FRW faster for local users
- ✅ Makes censorship harder
- ✅ Makes network more resilient
- ✅ Proves decentralization works

**Together we're building a web that:**
- Cannot be shut down
- Cannot be censored
- Cannot be controlled

**Thank you for being part of this!** 🌍

---

## 📋 Quick Reference

```bash
# Check health
curl http://localhost:3030/health

# View stats
curl http://localhost:3030/api/stats

# View logs (Docker)
docker logs -f frw-bootstrap

# View logs (PM2)
pm2 logs frw-bootstrap

# Restart (Docker)
docker restart frw-bootstrap

# Restart (PM2)
pm2 restart frw-bootstrap
```

---

**Ready to run a node?** 🚀

**Choose your method above and get started in 5 minutes!**

**Questions?** Join our Discord: discord.gg/frw
