# FRW Protocol Documentation

Complete technical documentation for the Free Web Modern (FRW) protocol and implementation.

## Overview

FRW is a decentralized web protocol built on IPFS with cryptographic signing, human-readable names, and DNS bridge capabilities. This documentation covers protocol specification, implementation details, deployment procedures, and operational guidelines.

## Protocol Access Methods

### Primary: FRW Protocol (`frw://`)
Native protocol using FRW browser with full cryptographic verification and peer-to-peer content delivery.

**Resolution mechanisms:**
- FRW names: `frw://mysite/` → DHT lookup
- Domain names: `frw://domain.com/` → DNS TXT lookup
- Direct keys: `frw://publickey/` → Direct IPNS

### Secondary: HTTP Gateway
Bridge layer for standard browsers accessing FRW content via HTTP.

### Tertiary: Custom Domains (HTTP/HTTPS)
DNS integration allowing traditional domain names to resolve to FRW content via gateway.

## Documentation Structure

### Getting Started
- [Installation Guide](INSTALLATION_GUIDE.md) - System requirements and installation procedures
- [Quick Start](../QUICK_START.md) - Minimal setup for immediate use
- [User Guide](USER_GUIDE.md) - End-user operational procedures

### Technical Specification
- [Protocol Specification](SPECIFICATION.md) - FRW protocol version 1.0 technical details
- [Architecture](ARCHITECTURE.md) - System design and component interaction
- [Naming System](NAMING_SYSTEM.md) - Name resolution and registry implementation
- [Security Model](SECURITY.md) - Cryptographic primitives and threat model

### Deployment
- [Docker Deployment](DOCKER_DEPLOYMENT.md) - Containerized deployment procedures
- [Custom Folders](CUSTOM_FOLDERS.md) - Flexible filesystem organization
- [Production Roadmap](roadmap/PRODUCTION_ROADMAP.md) - Production deployment checklist

### Domain Management
- [Domain Management](DOMAIN_MANAGEMENT.md) - DNS bridge configuration
- [DNS Resolution](DNS_RESOLUTION.md) - DNS TXT-based name resolution in FRW browser
- [Site Configuration](SITE_CONFIGURATION.md) - Site structure and metadata

### Development
- [Developer Guide](DEVELOPER_GUIDE.md) - API reference and extension development
- [Contributing](../CONTRIBUTING.md) - Contribution procedures and standards
- [Project Structure](PROJECT_STRUCTURE.md) - Codebase organization

### Operations
- [IPFS Setup](IPFS_SETUP.md) - IPFS node configuration
- [Migration Guide](MIGRATION_GUIDE.md) - Version migration procedures

## Access Method Comparison

| Method | Protocol | Decentralization | Verification | Use Case |
|--------|----------|------------------|--------------|----------|
| FRW Browser (Name) | `frw://mysite/` | Full | Cryptographic | Primary access method |
| FRW Browser (Domain) | `frw://domain.com/` | Full | Cryptographic | Domain convenience |
| FRW Browser (Direct) | `frw://publickey/` | Full | Cryptographic | Maximum security |
| HTTP Gateway | `http://gateway/frw/name/` | Partial | Gateway-dependent | Browser compatibility |
| Custom Domain (HTTPS) | `https://domain.com` | Minimal | Gateway-dependent | Traditional web integration |

## Quick Reference

### CLI Commands

```bash
# Initialization
frw init
frw register <name>

# Site Management
frw configure [directory]
frw publish [directory]

# Domain Management
frw domain add <domain> <name>
frw domain verify <domain>
frw domain list

# Verification
frw verify <file>
frw ipfs
```

### Docker Commands

```bash
# Service Management
docker-compose up -d
docker-compose down
docker-compose logs -f

# FRW Operations
docker-compose exec frw-cli frw init
docker-compose exec frw-cli frw register <name>
docker-compose exec frw-cli frw configure /data/sites/<site>
docker-compose exec frw-cli frw publish /data/sites/<site>
```

### Makefile Shortcuts

```bash
make start              # Start services
make init               # Initialize FRW
make register NAME=x    # Register name
make configure SITE=x   # Configure site
make publish SITE=x     # Publish site
make domain-list        # List domains
```

## System Requirements

### Minimum Requirements
- Node.js 20.0.0 or higher
- 2GB RAM
- 10GB disk space
- IPFS node (Kubo)

### Recommended Requirements
- Node.js 20.x LTS
- 4GB RAM
- 50GB disk space
- Dedicated IPFS node
- SSD storage

### Network Requirements
- Outbound connections to IPFS network
- Port 4001 for IPFS P2P
- Port 5001 for IPFS API (internal)
- Port 3000 for HTTP gateway (optional)

## Support Channels

- GitHub Issues: Technical issues and bug reports
- GitHub Discussions: Feature requests and protocol discussion
- Documentation: Primary reference for all operations

## License

MIT License. See LICENSE file for complete terms.

## Version

Documentation version: 1.0.0  
Protocol version: 1.0  
Last updated: 2025-11-09
