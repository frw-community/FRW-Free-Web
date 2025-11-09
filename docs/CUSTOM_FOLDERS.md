# FRW Custom Folder Configuration

Guide for configuring FRW sites in custom folders and locations.

---

## Overview

FRW supports configuring and publishing sites from **any folder location**:

- **Native**: Any path on your filesystem
- **Docker**: Any folder you mount as a volume
- **Multiple locations**: Configure different mount points for different projects

---

## Native Installation (Any Folder)

### Absolute Paths

```bash
# Configure site in any location
frw configure /home/user/projects/my-site
frw configure C:\Users\Name\Documents\websites\blog
frw configure ~/work/client-website

# Publish from any location
frw publish /home/user/projects/my-site
frw publish C:\Users\Name\Documents\websites\blog
```

### Relative Paths

```bash
# From current directory
frw configure ./my-site
frw configure ../other-project
frw configure ../../websites/portfolio

# Publish from relative paths
frw publish ./my-site
frw publish ../other-project
```

### Current Directory

```bash
# Configure the current folder
cd ~/my-website
frw configure .

# Publish current folder
frw publish .
```

---

## Docker Installation (Custom Mounts)

### Option 1: Mount Multiple Folders

**Edit `docker-compose.yml`:**

```yaml
services:
  frw-cli:
    volumes:
      - frw_config:/root/.frw
      # Mount multiple folders
      - ./sites:/data/sites           # Default sites
      - ./projects:/data/projects     # Additional projects
      - ./clients:/data/clients       # Client work
      - C:\MyWebsites:/data/websites  # Windows path
```

**Then use:**

```bash
# Configure from different mount points
docker-compose exec frw-cli frw configure /data/sites/blog
docker-compose exec frw-cli frw configure /data/projects/app
docker-compose exec frw-cli frw configure /data/clients/website
docker-compose exec frw-cli frw configure /data/websites/personal
```

### Option 2: Mount Entire Parent Directory

**docker-compose.yml:**

```yaml
services:
  frw-cli:
    volumes:
      - frw_config:/root/.frw
      # Mount entire work directory
      - ~/work:/data/work
      - C:\Projects:/data/projects  # Windows
```

**Access any subfolder:**

```bash
docker-compose exec frw-cli frw configure /data/work/client-a/website
docker-compose exec frw-cli frw configure /data/work/client-b/blog
docker-compose exec frw-cli frw configure /data/projects/FRW/test-site
```

### Option 3: Dynamic Volume Mount

**Mount on-demand using docker run:**

```bash
# Mount any folder temporarily
docker run --rm -it \
  -v ~/.frw:/root/.frw \
  -v /path/to/any/folder:/site \
  frw-cli \
  frw configure /site
```

### Option 4: Bind Mount Specific Project

**For a single project:**

```bash
# Temporary mount for one-off publish
docker run --rm \
  -v ~/.frw:/root/.frw \
  -v $(pwd):/site \
  frw-cli \
  frw publish /site
```

---

## Configuration Examples

### Multiple Projects in Different Locations

**Windows:**

```powershell
# Personal site
docker-compose exec frw-cli frw configure /data/sites/personal

# Work projects
docker-compose exec frw-cli frw configure /data/projects/company-site

# Client work
docker-compose exec frw-cli frw configure /data/clients/client-a
```

**Linux/Mac:**

```bash
# Home directory projects
docker-compose exec frw-cli frw configure /data/home/projects/blog

# Shared projects
docker-compose exec frw-cli frw configure /data/shared/team-site

# External drive
docker-compose exec frw-cli frw configure /data/external/backup-site
```

---

## Custom docker-compose.yml Examples

### Example 1: Developer with Multiple Projects

```yaml
version: '3.8'

services:
  ipfs:
    image: ipfs/kubo:latest
    # ... (standard config)

  frw-cli:
    build: .
    volumes:
      - frw_config:/root/.frw
      
      # Personal projects
      - ~/personal/websites:/data/personal
      
      # Work projects
      - ~/work:/data/work
      
      # Client projects
      - ~/clients:/data/clients
      
      # GitHub clones
      - ~/github:/data/github
    
    networks:
      - frw-network

volumes:
  frw_config:

networks:
  frw-network:
```

**Usage:**

```bash
# Personal blog
docker-compose exec frw-cli frw configure /data/personal/blog

# Work company site
docker-compose exec frw-cli frw configure /data/work/company-website

# Client project
docker-compose exec frw-cli frw configure /data/clients/acme-corp

# Open source project
docker-compose exec frw-cli frw configure /data/github/my-oss-project
```

### Example 2: Agency with Client Sites

```yaml
services:
  frw-cli:
    volumes:
      - frw_config:/root/.frw
      # Each client gets a folder
      - ./clients/client-a:/data/clients/client-a
      - ./clients/client-b:/data/clients/client-b
      - ./clients/client-c:/data/clients/client-c
      # Templates
      - ./templates:/data/templates:ro  # Read-only
```

**Usage:**

```bash
# Configure each client site
docker-compose exec frw-cli frw configure /data/clients/client-a
docker-compose exec frw-cli frw configure /data/clients/client-b
docker-compose exec frw-cli frw configure /data/clients/client-c

# Use templates (read-only)
docker-compose exec frw-cli cp -r /data/templates/default /data/clients/new-client
```

### Example 3: Cross-Platform Development

**Windows paths in WSL2:**

```yaml
services:
  frw-cli:
    volumes:
      - frw_config:/root/.frw
      # Windows drives
      - /mnt/c/Users/Name/Documents/Websites:/data/websites
      - /mnt/d/Projects:/data/projects
      # WSL home
      - ~/sites:/data/wsl-sites
```

**macOS with external drive:**

```yaml
services:
  frw-cli:
    volumes:
      - frw_config:/root/.frw
      # Internal drive
      - ~/Sites:/data/sites
      # External drive
      - /Volumes/ExternalDrive/Projects:/data/external
```

---

## Makefile for Custom Folders

### Update Makefile for Flexibility

**Add to `Makefile`:**

```makefile
# Configure any folder (usage: make configure-path PATH=/absolute/path)
configure-path: ## Configure site at custom path
	@if [ -z "$(PATH)" ]; then \
		echo "Usage: make configure-path PATH=/absolute/path"; \
		exit 1; \
	fi
	docker-compose exec frw-cli frw configure $(PATH)

# Publish any folder (usage: make publish-path PATH=/absolute/path)
publish-path: ## Publish site at custom path
	@if [ -z "$(PATH)" ]; then \
		echo "Usage: make publish-path PATH=/absolute/path"; \
		exit 1; \
	fi
	docker-compose exec frw-cli frw publish $(PATH)
```

**Usage:**

```bash
# Configure custom path
make configure-path PATH=/data/projects/my-app

# Publish custom path
make publish-path PATH=/data/projects/my-app
```

---

## Environment Variable Configuration

### Create `.env` File

```env
# Custom folder locations
PERSONAL_SITES=./personal-sites
WORK_SITES=~/work/sites
CLIENT_SITES=/mnt/clients

# Or Windows
PERSONAL_SITES=C:\Users\Name\Sites
WORK_SITES=D:\Work\Websites
```

### Use in docker-compose.yml

```yaml
services:
  frw-cli:
    volumes:
      - frw_config:/root/.frw
      - ${PERSONAL_SITES:-./sites}:/data/personal
      - ${WORK_SITES:-./work}:/data/work
      - ${CLIENT_SITES:-./clients}:/data/clients
```

---

## Helper Scripts

### Create Custom Setup Script

**`setup-custom-folders.sh`:**

```bash
#!/bin/bash

# Setup script for custom folder configuration

echo "FRW Custom Folder Setup"
echo "======================="
echo ""

# Prompt for folders
read -p "Personal sites folder: " PERSONAL
read -p "Work sites folder: " WORK
read -p "Client sites folder: " CLIENTS

# Create .env file
cat > .env << EOF
# Generated by setup-custom-folders.sh
PERSONAL_SITES=${PERSONAL:-./sites/personal}
WORK_SITES=${WORK:-./sites/work}
CLIENT_SITES=${CLIENTS:-./sites/clients}
EOF

echo ""
echo "✓ Configuration saved to .env"
echo ""
echo "Add to docker-compose.yml:"
echo "  volumes:"
echo "    - \${PERSONAL_SITES}:/data/personal"
echo "    - \${WORK_SITES}:/data/work"
echo "    - \${CLIENT_SITES}:/data/clients"
```

**Windows version (`setup-custom-folders.ps1`):**

```powershell
# FRW Custom Folder Setup

Write-Host "FRW Custom Folder Setup" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

$personal = Read-Host "Personal sites folder"
$work = Read-Host "Work sites folder"
$clients = Read-Host "Client sites folder"

$content = @"
# Generated by setup-custom-folders.ps1
PERSONAL_SITES=$personal
WORK_SITES=$work
CLIENT_SITES=$clients
"@

Set-Content -Path .env -Value $content

Write-Host ""
Write-Host "✓ Configuration saved to .env" -ForegroundColor Green
Write-Host ""
Write-Host "Add to docker-compose.yml:"
Write-Host "  volumes:"
Write-Host "    - `${PERSONAL_SITES}:/data/personal"
Write-Host "    - `${WORK_SITES}:/data/work"
Write-Host "    - `${CLIENT_SITES}:/data/clients"
```

---

## Real-World Examples

### Example 1: Freelance Developer

**Folder structure:**

```
D:\Projects\
├── personal\
│   ├── blog\
│   └── portfolio\
├── clients\
│   ├── acme-corp\
│   ├── widget-inc\
│   └── startup-x\
└── experiments\
    ├── test-site\
    └── demo\
```

**docker-compose.yml:**

```yaml
services:
  frw-cli:
    volumes:
      - frw_config:/root/.frw
      - D:\Projects:/data/projects
```

**Configure each site:**

```bash
# Personal blog
docker-compose exec frw-cli frw configure /data/projects/personal/blog

# Client sites
docker-compose exec frw-cli frw configure /data/projects/clients/acme-corp
docker-compose exec frw-cli frw configure /data/projects/clients/widget-inc
docker-compose exec frw-cli frw configure /data/projects/clients/startup-x

# Experiments
docker-compose exec frw-cli frw configure /data/projects/experiments/test-site
```

### Example 2: Agency Team

**Shared network drive:**

```
\\server\websites\
├── client-a\
├── client-b\
└── templates\
```

**docker-compose.yml:**

```yaml
services:
  frw-cli:
    volumes:
      - frw_config:/root/.frw
      - //server/websites:/data/websites
```

**Team workflow:**

```bash
# Each team member can configure
docker-compose exec frw-cli frw configure /data/websites/client-a
docker-compose exec frw-cli frw configure /data/websites/client-b
```

### Example 3: Multi-Environment Setup

**Production, staging, development:**

```yaml
services:
  frw-cli:
    volumes:
      - frw_config:/root/.frw
      - ./sites/production:/data/production
      - ./sites/staging:/data/staging
      - ./sites/development:/data/development
```

**Deploy to different environments:**

```bash
# Development
docker-compose exec frw-cli frw configure /data/development/app
docker-compose exec frw-cli frw register app-dev
docker-compose exec frw-cli frw publish /data/development/app

# Staging
docker-compose exec frw-cli frw configure /data/staging/app
docker-compose exec frw-cli frw register app-staging
docker-compose exec frw-cli frw publish /data/staging/app

# Production
docker-compose exec frw-cli frw configure /data/production/app
docker-compose exec frw-cli frw register app
docker-compose exec frw-cli frw domain add app.com app
docker-compose exec frw-cli frw publish /data/production/app
```

---

## Best Practices

### 1. Organize by Purpose

```
Good:
~/frw-sites/
├── personal/
├── work/
└── clients/

Better:
~/projects/
├── personal/
│   ├── blog/
│   └── portfolio/
├── work/
│   └── company-site/
└── clients/
    ├── client-a/
    └── client-b/
```

### 2. Use Descriptive Names

```
✓ Good:
  - /data/clients/acme-corp
  - /data/personal/tech-blog
  - /data/work/company-marketing

✗ Avoid:
  - /data/site1
  - /data/project
  - /data/test
```

### 3. Mount Read-Only When Appropriate

```yaml
volumes:
  # Editable sites
  - ./sites:/data/sites
  
  # Read-only templates
  - ./templates:/data/templates:ro
  
  # Read-only assets
  - ./shared-assets:/data/assets:ro
```

### 4. Use Environment Variables

```yaml
volumes:
  - ${SITES_PATH:-./sites}:/data/sites
  - ${PROJECTS_PATH:-./projects}:/data/projects
```

### 5. Document Your Setup

Create `FOLDER_SETUP.md` in your project:

```markdown
# FRW Folder Setup

## Mounted Folders

- `/data/sites` → `./sites` (personal sites)
- `/data/work` → `~/work/websites` (work projects)
- `/data/clients` → `D:\Clients` (client work)

## Usage

Configure sites:
- Personal: `docker-compose exec frw-cli frw configure /data/sites/blog`
- Work: `docker-compose exec frw-cli frw configure /data/work/company`
- Clients: `docker-compose exec frw-cli frw configure /data/clients/acme`
```

---

## Troubleshooting

### Folder Not Accessible

**Problem:** "No such file or directory"

**Solution:**

```bash
# Check volume mounts
docker-compose config | grep volumes

# List mounted folders
docker-compose exec frw-cli ls /data

# Restart after changing docker-compose.yml
docker-compose down
docker-compose up -d
```

### Permission Issues

**Problem:** "Permission denied"

**Linux/Mac Solution:**

```yaml
services:
  frw-cli:
    user: "${UID}:${GID}"
    volumes:
      - ./sites:/data/sites
```

```bash
# Set in .env
echo "UID=$(id -u)" >> .env
echo "GID=$(id -g)" >> .env
```

**Windows Solution:**

```yaml
# Usually works by default
# If issues, try running Docker Desktop as administrator
```

### Relative Paths Not Working

**Problem:** Relative paths don't resolve

**Solution:**

```bash
# Always use absolute paths in Docker
# Or use $PWD for current directory

docker run --rm \
  -v $(pwd):/site \
  frw-cli \
  frw configure /site
```

---

## Summary

**FRW supports ANY folder location:**

✅ **Native**: Any path on your system  
✅ **Docker**: Mount any folder as volume  
✅ **Multiple folders**: Mount as many as needed  
✅ **Dynamic**: Use environment variables  
✅ **Flexible**: Relative or absolute paths  

**Key Points:**

1. Native installation = unlimited flexibility
2. Docker = mount folders you need
3. Use environment variables for portability
4. Document your folder structure
5. Follow best practices for organization

---

**No limitations on where your sites can live! 📁**
