# FRW Docker Deployment Guide

Complete guide for deploying FRW using Docker containers to accelerate protocol adoption.

---

## Overview

Docker deployment provides:
- **Easy Setup**: One command to start FRW + IPFS
- **Isolated Environment**: No conflicts with existing software
- **Peer-to-Peer Ready**: Automatic IPFS node setup
- **Scalable**: Deploy multiple nodes easily
- **Cross-Platform**: Works on Linux, macOS, Windows

---

## Quick Start

### 1. Prerequisites

```bash
# Install Docker
https://docs.docker.com/get-docker/

# Install Docker Compose
https://docs.docker.com/compose/install/

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
git clone https://github.com/frw-community/frw-free-web-modern.git
cd frw-free-web-modern
```

### 3. Start Services

```bash
# Start all services (IPFS + FRW)
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Initialize FRW

```bash
# Access FRW CLI container
docker-compose exec frw-cli sh

# Initialize FRW
frw init

# Register your name
frw register myname

# Exit container
exit
```

---

## Architecture

### Services Overview

```
┌─────────────────────────────────────────┐
│          Docker Network                 │
│                                         │
│  ┌──────────┐    ┌──────────┐         │
│  │   IPFS   │◄───┤ FRW CLI  │         │
│  │  Node    │    │ Service  │         │
│  └────┬─────┘    └──────────┘         │
│       │                                │
│       │          ┌──────────┐         │
│       └──────────┤   FRW    │         │
│                  │ Gateway  │         │
│                  └────┬─────┘         │
│                       │                │
└───────────────────────┼────────────────┘
                        │
                   HTTP :3000
```

### Container Details

**1. IPFS Node (`frw-ipfs`)**
- Official Kubo IPFS implementation
- Ports: 4001 (P2P), 5001 (API), 8080 (Gateway)
- Persistent storage for IPFS data
- Server-optimized profile

**2. FRW CLI (`frw-cli`)**
- Command-line interface for publishing
- Connected to IPFS node
- Shared configuration volume
- Management and publishing operations

**3. FRW Gateway (`frw-gateway`)**
- HTTP gateway for browser access
- Port: 3000
- Translates HTTP → FRW protocol
- Access FRW content via regular browsers

---

## Usage

### Publishing Content

```bash
# Method 1: From host machine
docker-compose exec frw-cli frw publish /data/sites/my-site

# Method 2: Interactive shell
docker-compose exec frw-cli sh
> cd /data/sites/my-site
> frw publish .
> exit
```

**Local directories are mounted at `/data/sites`**

### Accessing Content

**Via FRW Gateway (HTTP):**
```bash
# Access by name
http://localhost:3000/frw/myname/index.html

# Access by IPFS CID
http://localhost:3000/ipfs/Qm.../index.html

# Access by IPNS
http://localhost:3000/ipns/k51qzi.../index.html
```

**Via IPFS Gateway:**
```bash
http://localhost:8080/ipfs/Qm...
```

### Managing Services

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f frw-cli
docker-compose logs -f ipfs

# Update containers
docker-compose pull
docker-compose up -d
```

---

## Configuration

### Environment Variables

Create `.env` file in project root:

```env
# IPFS Configuration
IPFS_PROFILE=server
IPFS_SWARM_PORT=4001
IPFS_API_PORT=5001
IPFS_GATEWAY_PORT=8080

# FRW Configuration
FRW_IPFS_API=/dns/ipfs/tcp/5001
FRW_GATEWAY_PORT=3000
NODE_ENV=production

# Optional: Custom IPFS settings
IPFS_ROUTING=dhtclient
IPFS_STORAGE_MAX=100GB
```

### Volume Mounts

**Persistent Data:**
```yaml
volumes:
  - ipfs_data:/data/ipfs        # IPFS blocks and config
  - frw_config:/root/.frw       # FRW keys and config
  - ./sites:/data/sites         # Your websites
```

**Access host files:**
```bash
# Place your site in ./sites/my-site/
# Access from container: /data/sites/my-site/
```

---

## Production Deployment

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  ipfs:
    image: ipfs/kubo:latest
    container_name: frw-ipfs-prod
    restart: always
    environment:
      - IPFS_PROFILE=server
    volumes:
      - /var/lib/frw/ipfs:/data/ipfs
    ports:
      - "4001:4001"
      - "5001:5001"
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  frw-cli:
    build: .
    container_name: frw-cli-prod
    restart: always
    environment:
      - NODE_ENV=production
    volumes:
      - /etc/frw:/root/.frw
      - /var/www/sites:/data/sites
    depends_on:
      - ipfs

  frw-gateway:
    build:
      context: .
      dockerfile: Dockerfile.gateway
    container_name: frw-gateway-prod
    restart: always
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    depends_on:
      - ipfs
```

### Deploy to Server

```bash
# Copy to server
scp -r . user@server:/opt/frw/

# SSH to server
ssh user@server

# Start production
cd /opt/frw
docker-compose -f docker-compose.prod.yml up -d

# Setup automatic updates
echo "0 4 * * * cd /opt/frw && docker-compose pull && docker-compose up -d" | crontab -
```

### Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/frw-gateway
server {
    listen 80;
    server_name frw.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL/TLS with Let's Encrypt

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d frw.example.com

# Auto-renewal is configured automatically
```

---

## Scaling & Performance

### Multiple IPFS Nodes

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  ipfs-1:
    image: ipfs/kubo:latest
    # ... config ...

  ipfs-2:
    image: ipfs/kubo:latest
    # ... config with different ports ...

  frw-gateway:
    # Load balance between nodes
    environment:
      - IPFS_API_1=/dns/ipfs-1/tcp/5001
      - IPFS_API_2=/dns/ipfs-2/tcp/5001
```

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml frw

# Scale services
docker service scale frw_frw-gateway=3

# View services
docker service ls
```

### Kubernetes

See `docs/KUBERNETES_DEPLOYMENT.md` for Kubernetes manifests.

---

## Monitoring

### Health Checks

```bash
# Check all services
docker-compose ps

# IPFS health
curl http://localhost:5001/api/v0/version

# Gateway health
curl http://localhost:3000/health

# Container logs
docker-compose logs --tail=100 -f
```

### Prometheus Metrics

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

---

## Troubleshooting

### IPFS Not Starting

```bash
# Check logs
docker-compose logs ipfs

# Reset IPFS data (WARNING: deletes all data)
docker-compose down -v
docker volume rm frw-free-web-modern_ipfs_data
docker-compose up -d

# Initialize manually
docker-compose exec ipfs ipfs init
```

### FRW CLI Errors

```bash
# Reinstall CLI
docker-compose exec frw-cli npm link

# Check IPFS connection
docker-compose exec frw-cli frw ipfs

# View config
docker-compose exec frw-cli cat /root/.frw/config.json
```

### Network Issues

```bash
# Check network
docker network ls
docker network inspect frw-free-web-modern_frw-network

# Restart network
docker-compose down
docker-compose up -d

# Test connectivity
docker-compose exec frw-cli ping ipfs
```

### Port Conflicts

```bash
# Change ports in docker-compose.yml
ports:
  - "14001:4001"  # Changed from 4001
  - "15001:5001"  # Changed from 5001
  - "18080:8080"  # Changed from 8080
```

---

## Security Best Practices

### 1. Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 4001/tcp   # IPFS P2P
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS

# Block direct API access
ufw deny 5001/tcp
```

### 2. Secure Configuration

```bash
# Bind API to localhost only
docker-compose.yml:
  ipfs:
    environment:
      - IPFS_API=/ip4/127.0.0.1/tcp/5001
```

### 3. Key Management

```bash
# Backup keys
docker cp frw-cli:/root/.frw/keys ./backup/

# Encrypt volumes
# Use encrypted Docker volumes in production
```

### 4. Regular Updates

```bash
# Update images weekly
docker-compose pull
docker-compose up -d
```

---

## Migration

### From Local Install to Docker

```bash
# 1. Backup existing data
cp -r ~/.frw ~/.frw.backup

# 2. Copy to Docker volume
docker-compose up -d frw-cli
docker cp ~/.frw/. frw-cli:/root/.frw/

# 3. Verify
docker-compose exec frw-cli frw --version
```

### From Docker to Kubernetes

```bash
# Export volumes
docker run --rm -v frw_config:/data -v $(pwd):/backup \
  alpine tar czf /backup/frw-config.tar.gz /data

# Import to k8s persistent volume
# See KUBERNETES_DEPLOYMENT.md
```

---

## Development

### Local Development with Docker

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up

# Hot reload
volumes:
  - ./apps:/app/apps
  - ./packages:/app/packages

# Debug mode
environment:
  - DEBUG=frw:*
  - NODE_ENV=development
```

### Building Custom Images

```bash
# Build locally
docker build -t my-frw:latest .

# Use in compose
docker-compose.yml:
  frw-cli:
    image: my-frw:latest
```

---

## FAQ

**Q: Can I run FRW without Docker?**  
A: Yes, see `INSTALLATION_GUIDE.md` for native installation.

**Q: How much disk space does IPFS need?**  
A: Start with 10GB minimum. IPFS will cache content but respects storage limits.

**Q: Can multiple machines share IPFS data?**  
A: Not directly. Each node needs its own IPFS repository. Use IPFS Cluster for multi-node setups.

**Q: How do I backup my data?**  
A: Backup the Docker volumes or copy `/root/.frw` and IPFS data.

**Q: Is this production-ready?**  
A: FRW is in active development. Use with caution in production.

---

## Support

- **Documentation**: `docs/`
- **Issues**: https://github.com/frw-community/frw-free-web-modern/issues
- **Community**: Join our Discord/Matrix

---

## Next Steps

- [Production Roadmap](PRODUCTION_ROADMAP.md)
- [Security Guide](SECURITY.md)
- [API Documentation](API_REFERENCE.md)
- [Kubernetes Deployment](KUBERNETES_DEPLOYMENT.md)

**Happy deploying! 🚀**
