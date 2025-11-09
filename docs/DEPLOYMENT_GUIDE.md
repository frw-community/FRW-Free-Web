# FRW Deployment Guide

Production deployment procedures for FRW infrastructure.

## Deployment Options

### 1. Docker Deployment (Recommended)

Containerized deployment with Docker Compose provides isolation, reproducibility, and simplified management.

**Components:**
- IPFS node (Kubo)
- FRW CLI service
- HTTP gateway
- Shared configuration volume

**Advantages:**
- Consistent environment across platforms
- Simple dependency management
- Easy scaling and updates
- Development/production parity

**Requirements:**
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 50GB disk space

### 2. Native Deployment

Direct installation on host system for maximum performance and flexibility.

**Components:**
- Node.js runtime
- IPFS daemon
- FRW CLI tool
- Nginx reverse proxy (optional)

**Advantages:**
- Lower resource overhead
- Direct system access
- Custom optimizations possible

**Requirements:**
- Node.js 20+
- IPFS Kubo
- 2GB RAM minimum
- 20GB disk space

### 3. Kubernetes Deployment

Orchestrated deployment for high availability and scalability.

**Components:**
- Multiple IPFS pods
- FRW CLI pods
- Gateway pods with load balancing
- Persistent volumes for storage

**Advantages:**
- High availability
- Automatic scaling
- Rolling updates
- Health monitoring

**Requirements:**
- Kubernetes cluster
- Persistent storage provisioner
- Load balancer
- 8GB RAM minimum per node

## Docker Deployment Procedure

### Initial Setup

```bash
# Clone repository
git clone https://github.com/frw-community/frw-free-web-modern.git
cd frw-free-web-modern

# Create environment configuration
cp .env.example .env
# Edit .env with your settings

# Start services
docker-compose up -d

# Verify services running
docker-compose ps

# Check logs
docker-compose logs -f
```

### Service Configuration

**IPFS Node:**
```yaml
ipfs:
  environment:
    - IPFS_PROFILE=server  # Server-optimized profile
  ports:
    - "4001:4001"  # P2P swarm
    - "5001:5001"  # API (internal only)
  volumes:
    - ipfs_data:/data/ipfs  # Persistent storage
```

**FRW CLI:**
```yaml
frw-cli:
  volumes:
    - frw_config:/root/.frw  # Configuration
    - ./sites:/data/sites    # Site content
  environment:
    - FRW_IPFS_API=/dns/ipfs/tcp/5001
```

**Gateway:**
```yaml
frw-gateway:
  ports:
    - "3000:3000"  # HTTP gateway
  volumes:
    - frw_config:/root/.frw:ro  # Read-only config
```

### Initialization

```bash
# Initialize FRW configuration
docker-compose exec frw-cli frw init

# Register names
docker-compose exec frw-cli frw register <name>

# Configure first site
docker-compose exec frw-cli frw configure /data/sites/<site>
```

### Production Configuration

**Security hardening:**
```yaml
services:
  ipfs:
    environment:
      # Bind API to localhost only
      - IPFS_API=/ip4/127.0.0.1/tcp/5001
    # Remove external port exposure
    # ports:
    #   - "5001:5001"  # Commented out

  frw-gateway:
    # Add rate limiting via Nginx reverse proxy
    # Implement authentication if required
```

**Resource limits:**
```yaml
services:
  ipfs:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
        reservations:
          memory: 1G
          cpus: '1'
```

**Health checks:**
```yaml
services:
  ipfs:
    healthcheck:
      test: ["CMD", "ipfs", "version"]
      interval: 30s
      timeout: 10s
      retries: 3

  frw-gateway:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Reverse Proxy Configuration

### Nginx

```nginx
# /etc/nginx/sites-available/frw-gateway

upstream frw_gateway {
    server localhost:3000;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name gateway.example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name gateway.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/gateway.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gateway.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy configuration
    location / {
        proxy_pass http://frw_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=gateway:10m rate=10r/s;
    limit_req zone=gateway burst=20 nodelay;

    # Access logs
    access_log /var/log/nginx/frw-gateway-access.log;
    error_log /var/log/nginx/frw-gateway-error.log;
}
```

### SSL Certificate Setup

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d gateway.example.com

# Verify auto-renewal
certbot renew --dry-run

# Auto-renewal cron job (already configured by certbot)
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Firewall Configuration

### UFW (Ubuntu)

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow IPFS P2P
ufw allow 4001/tcp
ufw allow 4001/udp

# Block IPFS API from external access
# (No rule = blocked by default)

# Enable firewall
ufw enable

# Check status
ufw status verbose
```

### iptables

```bash
# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow IPFS P2P
iptables -A INPUT -p tcp --dport 4001 -j ACCEPT
iptables -A INPUT -p udp --dport 4001 -j ACCEPT

# Block IPFS API (except localhost)
iptables -A INPUT -p tcp --dport 5001 ! -s 127.0.0.1 -j DROP

# Save rules
iptables-save > /etc/iptables/rules.v4
```

## Monitoring

### Service Health

```bash
# Docker health status
docker-compose ps

# Service logs
docker-compose logs -f ipfs
docker-compose logs -f frw-cli
docker-compose logs -f frw-gateway

# Resource usage
docker stats
```

### IPFS Metrics

```bash
# IPFS daemon status
docker-compose exec ipfs ipfs version

# Connected peers
docker-compose exec ipfs ipfs swarm peers | wc -l

# Repository statistics
docker-compose exec ipfs ipfs repo stat

# Bandwidth usage
docker-compose exec ipfs ipfs stats bw
```

### Gateway Metrics

```bash
# Request count from logs
grep "GET /frw/" /var/log/nginx/frw-gateway-access.log | wc -l

# Error rate
grep "500" /var/log/nginx/frw-gateway-error.log | wc -l

# Response times
awk '{print $10}' /var/log/nginx/frw-gateway-access.log | sort -n | tail -n 100
```

## Backup Procedures

### Configuration Backup

```bash
# Backup FRW configuration
docker cp frw-cli:/root/.frw ./backup/frw-config-$(date +%Y%m%d)

# Backup IPFS configuration
docker cp frw-ipfs:/data/ipfs/config ./backup/ipfs-config-$(date +%Y%m%d)
```

### Data Backup

```bash
# Backup IPFS data
docker run --rm \
  -v frw-free-web-modern_ipfs_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/ipfs-data-$(date +%Y%m%d).tar.gz /data

# Backup site content
tar czf backup/sites-$(date +%Y%m%d).tar.gz sites/
```

### Restore Procedures

```bash
# Restore FRW configuration
docker cp ./backup/frw-config-20251109 frw-cli:/root/.frw

# Restore IPFS data
docker run --rm \
  -v frw-free-web-modern_ipfs_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/ipfs-data-20251109.tar.gz -C /
```

## Update Procedures

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose build

# Stop services
docker-compose down

# Start with new images
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs -f
```

### IPFS Updates

```bash
# Pull new IPFS image
docker-compose pull ipfs

# Restart IPFS service
docker-compose up -d ipfs

# Verify version
docker-compose exec ipfs ipfs version
```

## Troubleshooting

### IPFS Not Starting

```bash
# Check logs
docker-compose logs ipfs

# Verify volume exists
docker volume ls | grep ipfs

# Reset IPFS (WARNING: deletes data)
docker-compose down -v
docker-compose up -d
```

### Gateway Not Responding

```bash
# Check gateway logs
docker-compose logs frw-gateway

# Verify configuration mount
docker-compose exec frw-gateway ls /root/.frw

# Check IPFS connectivity
docker-compose exec frw-gateway curl http://ipfs:5001/api/v0/version

# Restart gateway
docker-compose restart frw-gateway
```

### High Resource Usage

```bash
# Check resource consumption
docker stats

# Adjust resource limits in docker-compose.yml
# See Production Configuration section

# Restart with new limits
docker-compose up -d
```

## Security Best Practices

1. Never expose IPFS API port (5001) to internet
2. Use reverse proxy with TLS for gateway
3. Implement rate limiting on gateway
4. Regularly update Docker images
5. Backup encryption keys securely
6. Monitor logs for suspicious activity
7. Use firewall to restrict access
8. Implement authentication for sensitive operations
9. Keep Docker and system packages updated
10. Use read-only volumes where appropriate

## Scaling Considerations

### Horizontal Scaling

Deploy multiple gateway instances behind load balancer:

```yaml
services:
  frw-gateway-1:
    # Configuration
  frw-gateway-2:
    # Configuration
  
  load-balancer:
    image: nginx
    # Load balancer configuration
```

### Vertical Scaling

Increase resources for existing services:

```yaml
services:
  ipfs:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '4'
```

### IPFS Cluster

Deploy IPFS cluster for content replication and availability:

```bash
# See IPFS Cluster documentation
https://cluster.ipfs.io/documentation/
```

## Production Checklist

- [ ] Docker installed and configured
- [ ] Services deployed via docker-compose
- [ ] FRW initialized and names registered
- [ ] Reverse proxy configured with TLS
- [ ] Firewall rules applied
- [ ] Monitoring in place
- [ ] Backup procedures tested
- [ ] Update procedures documented
- [ ] Health checks configured
- [ ] Resource limits set
- [ ] Security hardening applied
- [ ] Documentation reviewed

## Conclusion

Follow these procedures for reliable FRW deployment. Monitor services regularly, maintain backups, and apply security updates promptly. Scale infrastructure based on usage patterns and requirements.
