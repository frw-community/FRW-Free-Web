# FRW Domain Management Guide

Complete guide for linking custom domains to your FRW sites.

---

## Overview

FRW's domain management system implements the **DNS Bridge** feature from the FRW naming specification, allowing you to:

- **Link custom domains** to your FRW names
- **Dual-host content**: Serve via both `https://example.com` and `frw://name/`
- **Verify DNS configuration** automatically
- **Resolve domains** transparently through the FRW gateway

---

## Quick Start

### 1. Register FRW Name

First, register a human-readable FRW name:

```bash
frw register mysite
```

### 2. Link Domain

Link your custom domain to your FRW name:

```bash
frw domain add example.com mysite
```

### 3. Configure DNS

Add a TXT record to your domain's DNS:

```
Type:  TXT
Name:  _frw (or @)
Value: frw-key=GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb;frw-name=mysite
TTL:   3600
```

### 4. Verify

After DNS propagation (up to 48 hours):

```bash
frw domain verify example.com
```

### 5. Access

Your site is now accessible at both:
- `https://example.com` (via gateway)
- `frw://mysite/`

---

## Docker Commands

### Using Makefile

```bash
# Add domain
make domain-add DOMAIN=example.com NAME=mysite

# Verify domain
make domain-verify DOMAIN=example.com

# List all domains
make domain-list

# Show domain info
make domain-info DOMAIN=example.com
```

### Using Docker Compose

```bash
# Add domain
docker-compose exec frw-cli frw domain add example.com mysite

# Verify domain
docker-compose exec frw-cli frw domain verify example.com

# List domains
docker-compose exec frw-cli frw domain list

# Remove domain
docker-compose exec frw-cli frw domain remove example.com

# Show info
docker-compose exec frw-cli frw domain info example.com
```

---

## DNS Configuration

### TXT Record Format

```
frw-key=<PUBLIC_KEY>;frw-name=<FRW_NAME>
```

**Components:**
- `frw-key`: Your Ed25519 public key (from `frw register`)
- `frw-name`: Your registered FRW name

### Where to Add Record

**Option 1: Subdomain (_frw)**
```
_frw.example.com  TXT  "frw-key=...;frw-name=mysite"
```

**Option 2: Root domain (@)**
```
example.com  TXT  "frw-key=...;frw-name=mysite"
```

### DNS Provider Examples

**Cloudflare:**
1. Dashboard → DNS → Add Record
2. Type: TXT
3. Name: `_frw` or `@`
4. Content: `frw-key=...;frw-name=...`
5. TTL: Auto

**AWS Route 53:**
```json
{
  "Name": "_frw.example.com",
  "Type": "TXT",
  "TTL": 3600,
  "ResourceRecords": [{
    "Value": "\"frw-key=...;frw-name=...\""
  }]
}
```

**Google Domains:**
1. DNS → Custom records
2. Type: TXT
3. Host: `_frw`
4. Data: `frw-key=...;frw-name=...`
5. TTL: 3600

**Namecheap:**
1. Advanced DNS → Add New Record
2. Type: TXT
3. Host: `_frw`
4. Value: `frw-key=...;frw-name=...`
5. TTL: Automatic

---

## Command Reference

### `frw domain add <domain> <frwName>`

Link a domain to your FRW name.

```bash
frw domain add example.com mysite
```

**Output:**
```
Add Domain: example.com
──────────────────────────
[x] Domain "example.com" linked to "mysite"

DNS Configuration Required
──────────────────────────
Add the following TXT record to your DNS:

Type:  TXT
Name:  _frw or @
Value: frw-key=GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb;frw-name=mysite
TTL:   3600

After adding the DNS record, verify with:
  frw domain verify example.com
```

### `frw domain verify <domain>`

Verify DNS configuration for a domain.

```bash
frw domain verify example.com
```

**Success:**
```
Verify Domain: example.com
──────────────────────────────
✔ Checking DNS records...
✔ Domain verified successfully!

[x] example.com → frw://mysite/

Your site is now accessible at both:
  • https://example.com
  • frw://mysite/
```

**Failure:**
```
Verify Domain: example.com
──────────────────────────────
✔ Checking DNS records...
✖ DNS record not found

Make sure you have added the TXT record and it has propagated
DNS propagation can take up to 48 hours
```

### `frw domain list`

List all configured domains.

```bash
frw domain list
```

**Output:**
```
Domain Mappings
───────────────

[x] example.com
  → frw://mysite/
  Status: Verified

[!] test.com
  → frw://testsite/
  Status: Not verified
  Action: Run frw domain verify test.com
```

### `frw domain info <domain>`

Show detailed information about a domain.

```bash
frw domain info example.com
```

**Output:**
```
Domain Info: example.com
────────────────────────

Domain:     example.com
FRW Name:   mysite
Public Key: GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb
Status:     [x] Verified
Added:      11/9/2025, 12:00:00 PM
Last Check: 11/9/2025, 12:15:00 PM

URLs:
  • https://example.com
  • frw://mysite/
  • frw://GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb/
```

### `frw domain remove <domain>`

Remove a domain mapping.

```bash
frw domain remove example.com
```

**Output:**
```
Remove Domain: example.com
──────────────────────────
[x] Domain "example.com" removed
```

---

## Gateway Configuration

### Docker Setup

The FRW gateway automatically resolves custom domains.

**Environment Variables:**

```env
# .env file
FRW_CONFIG_PATH=/root/.frw/config.json
GATEWAY_DOMAIN_RESOLUTION=true
```

**docker-compose.yml:**

```yaml
frw-gateway:
  volumes:
    - frw_config:/root/.frw:ro  # Read-only access to config
  environment:
    - FRW_CONFIG_PATH=/root/.frw/config.json
```

### How It Works

1. Request arrives: `https://example.com/page.html`
2. Gateway checks `Host` header: `example.com`
3. Looks up domain in config: `example.com` → `mysite`
4. Resolves FRW name: `mysite` → `GMZjnckbhcdPxn...`
5. Fetches from IPNS: `/ipns/GMZjnckbhcdPxn.../page.html`
6. Returns content with appropriate headers

### Reverse Proxy Setup

**Nginx:**

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**With SSL (Let's Encrypt):**

```bash
certbot --nginx -d example.com
```

---

## Complete Workflow Example

### Step-by-Step: example.com → FRW

#### 1. Initialize FRW

```bash
# Docker
docker-compose exec frw-cli frw init

# Native
frw init
```

#### 2. Register Name

```bash
# Docker
docker-compose exec frw-cli frw register mysite

# Native
frw register mysite
```

**Note the public key from output:**
```
Public key: GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb
```

#### 3. Create Site

```bash
mkdir -p sites/mysite
cat > sites/mysite/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>My FRW Site</title>
    <meta name="frw-version" content="1.0">
</head>
<body>
    <h1>Welcome to example.com on FRW!</h1>
</body>
</html>
EOF
```

#### 4. Configure Site

```bash
# Docker
docker-compose exec frw-cli frw configure /data/sites/mysite

# Native
frw configure sites/mysite
```

**Interactive prompts:**
```
Site identifier: mysite
Site title: My FRW Site
Description: Example FRW site
Author: Your Name
Custom domain: example.com
FRW name: mysite
Build directory: .
```

#### 5. Publish

```bash
# Docker
docker-compose exec frw-cli frw publish /data/sites/mysite

# Native
frw publish sites/mysite
```

**Note the CID:**
```
IPFS CID: Qme2Bf61xiZjhcbmLepccwJF9M3jfkuUmYPEtnHwtpY2kM
```

#### 6. Link Domain

```bash
# Docker
docker-compose exec frw-cli frw domain add example.com mysite

# Native
frw domain add example.com mysite
```

#### 7. Configure DNS

Add TXT record to example.com:

```
Type:  TXT
Name:  _frw
Value: frw-key=GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb;frw-name=mysite
TTL:   3600
```

#### 8. Wait for DNS Propagation

Check propagation:

```bash
# Check TXT record
dig _frw.example.com TXT

# Or use online tool
https://dnschecker.org
```

#### 9. Verify Domain

```bash
# Docker
docker-compose exec frw-cli frw domain verify example.com

# Native
frw domain verify example.com
```

#### 10. Access

Your site is now live at:
- `https://example.com` (via gateway at port 3000)
- `frw://mysite/`

---

## Troubleshooting

### DNS Record Not Found

**Problem:** `frw domain verify` fails with "DNS record not found"

**Solutions:**
```bash
# Check if record exists
dig _frw.example.com TXT

# Wait longer (up to 48 hours for full propagation)
# Try different DNS server
dig @8.8.8.8 _frw.example.com TXT

# Verify record format (no extra quotes)
```

### Key Mismatch

**Problem:** DNS record found but key doesn't match

**Solutions:**
```bash
# Check your public key
docker-compose exec frw-cli frw keys --list

# Verify DNS record value
dig _frw.example.com TXT

# Update DNS record with correct key
```

### Domain Already Exists

**Problem:** "Domain already configured"

**Solutions:**
```bash
# Remove and re-add
frw domain remove example.com
frw domain add example.com mysite

# Or just verify existing
frw domain verify example.com
```

### Gateway Not Resolving Domain

**Problem:** Domain doesn't work through gateway

**Solutions:**
```bash
# Check gateway logs
docker-compose logs frw-gateway

# Verify config is mounted
docker-compose exec frw-gateway cat /root/.frw/config.json

# Restart gateway
docker-compose restart frw-gateway

# Check domain mapping exists and is verified
frw domain list
```

---

## Security Considerations

### DNS Security

- **DNSSEC**: Enable if supported by your registrar
- **CAA Records**: Restrict certificate issuance
- **Regular Monitoring**: Check DNS records periodically

### Key Management

- **Backup Keys**: Store private keys securely
- **Rotate Keys**: Consider periodic rotation
- **Limit Access**: Restrict who can modify DNS

### Gateway Security

- **HTTPS Only**: Always use SSL/TLS in production
- **Rate Limiting**: Implement to prevent abuse
- **Firewall**: Restrict access to API ports

---

## Advanced Usage

### Multiple Domains

Link multiple domains to the same FRW name:

```bash
frw domain add example.com mysite
frw domain add example.org mysite
frw domain add example.net mysite
```

### Subdomain Mapping

Map subdomains to different FRW sites:

```bash
frw register blog
frw register shop

frw domain add blog.example.com blog
frw domain add shop.example.com shop
```

### Wildcard Domains

**Not supported directly**, but can be handled via:
- Reverse proxy configuration
- DNS CNAME records
- Gateway custom logic

---

## API Reference

### Configuration File Format

**`~/.frw/config.json`:**

```json
{
  "registeredNames": {
    "mysite": "GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb"
  },
  "domainMappings": {
    "example.com": {
      "domain": "example.com",
      "frwName": "mysite",
      "publicKey": "GMZjnckbhcdPxnZWhAbuRWRpsELbR6fZLbgQacUdErSb",
      "verified": true,
      "addedAt": "2025-11-09T12:00:00.000Z",
      "lastChecked": "2025-11-09T12:15:00.000Z"
    }
  }
}
```

---

## Production Deployment

### Full Production Example

```bash
# 1. Setup VPS with Docker
ssh root@your-server
apt update && apt install docker.io docker-compose

# 2. Clone FRW
git clone https://github.com/frw-community/frw-free-web-modern.git
cd frw-free-web-modern

# 3. Start services
docker-compose up -d

# 4. Configure
docker-compose exec frw-cli frw init
docker-compose exec frw-cli frw register mysite
docker-compose exec frw-cli frw domain add example.com mysite

# 5. Setup Nginx
apt install nginx certbot python3-certbot-nginx

# 6. Configure Nginx (see above)
nano /etc/nginx/sites-available/example.com

# 7. Enable site
ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 8. Get SSL certificate
certbot --nginx -d example.com

# 9. Configure DNS
# Add TXT record as shown above

# 10. Verify
docker-compose exec frw-cli frw domain verify example.com
```

---

## FAQ

**Q: Can I use multiple domains with one FRW name?**  
A: Yes! Add each domain separately with `frw domain add`.

**Q: Do I need to renew DNS records?**  
A: No, TXT records don't expire. But reverify if you change keys.

**Q: Can I transfer a domain to a different FRW name?**  
A: Yes. Remove the old mapping and add a new one.

**Q: Does this work with subdomains?**  
A: Yes, treat subdomains like regular domains.

**Q: What if I don't own a domain?**  
A: You can still use FRW names: `frw://myname/`

---

## Next Steps

- [Site Configuration Guide](SITE_CONFIGURATION.md)
- [Production Deployment](DOCKER_DEPLOYMENT.md)
- [Security Guide](SECURITY.md)
- [Naming System](NAMING_SYSTEM.md)

---

**Happy domain mapping! 🌐**
