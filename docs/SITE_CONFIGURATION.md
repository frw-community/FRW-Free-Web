# FRW Site Configuration Guide

Complete guide for configuring and organizing your FRW sites.

---

## Overview

The FRW site configuration system provides:

- **Interactive setup** for new sites
- **Structured configuration** (`frw.config.json`)
- **Domain integration** with automatic DNS setup guidance
- **Build directory** specification
- **Metadata management** (title, description, author)

---

## Quick Start

### Configure a New Site

```bash
# Navigate to your site directory
cd sites/my-site

# Run configuration
frw configure .
```

**Interactive prompts:**
```
Site identifier: my-site
Site title: My Awesome Site
Description: A decentralized website
Author: Your Name
Custom domain: example.com
FRW name: mysite
Build directory: .
```

**Result:**
- Creates `frw.config.json` with your settings
- Shows next steps for publishing
- Provides DNS configuration instructions

---

## Docker Commands

### Using Makefile

```bash
# Configure a site
make configure SITE=sites/my-site

# View configuration
docker-compose exec frw-cli frw config /data/sites/my-site
```

### Using Docker Compose

```bash
# Configure interactively
docker-compose exec frw-cli frw configure /data/sites/my-site

# View configuration
docker-compose exec frw-cli frw config /data/sites/my-site
```

---

## Configuration File Format

### `frw.config.json`

```json
{
  "name": "my-site",
  "title": "My Awesome Site",
  "description": "A decentralized website on FRW",
  "author": "Your Name",
  "domain": "example.com",
  "frwName": "mysite",
  "buildDir": ".",
  "createdAt": "2025-11-09T12:00:00.000Z",
  "updatedAt": "2025-11-09T12:00:00.000Z"
}
```

### Field Descriptions

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Site identifier (lowercase, no spaces) |
| `title` | Yes | Human-readable site title |
| `description` | No | Brief description of the site |
| `author` | No | Author or organization name |
| `domain` | No | Custom domain (e.g., example.com) |
| `frwName` | Yes | Registered FRW name |
| `buildDir` | Yes | Relative path to build output |
| `createdAt` | Auto | ISO timestamp of creation |
| `updatedAt` | Auto | ISO timestamp of last update |

---

## Site Structure

### Recommended Layout

```
my-site/
├── frw.config.json      # Site configuration
├── index.html           # Home page
├── about.html           # About page
├── css/
│   └── style.css        # Stylesheets
├── js/
│   └── app.js           # JavaScript
├── images/
│   └── logo.png         # Assets
└── README.md            # Documentation
```

### With Build Process

```
my-site/
├── frw.config.json      # Configure buildDir: "dist"
├── src/                 # Source files
│   ├── index.html
│   └── styles.css
├── dist/                # Build output (published)
│   ├── index.html
│   └── styles.css
├── package.json         # Build scripts
└── README.md
```

---

## Complete Workflow

### From Scratch to Published

#### 1. Create Site Directory

```bash
mkdir -p sites/my-site
cd sites/my-site
```

#### 2. Create Content

```bash
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>My FRW Site</title>
    <meta name="frw-version" content="1.0">
    <meta name="frw-author" content="@mysite">
    <meta name="frw-date" content="2025-11-09T00:00:00Z">
</head>
<body>
    <h1>Welcome to My Site</h1>
    <p>This is hosted on the decentralized web!</p>
</body>
</html>
EOF
```

#### 3. Configure Site

```bash
# Docker
docker-compose exec frw-cli frw configure /data/sites/my-site

# Native
frw configure sites/my-site
```

**Fill in the prompts:**
- Site identifier: `my-site`
- Site title: `My FRW Site`
- FRW name: `mysite`
- Domain: `example.com` (optional)

#### 4. Register FRW Name

```bash
# Docker
docker-compose exec frw-cli frw register mysite

# Native
frw register mysite
```

#### 5. Link Domain (Optional)

```bash
# Docker
docker-compose exec frw-cli frw domain add example.com mysite

# Native
frw domain add example.com mysite
```

#### 6. Publish

```bash
# Docker
docker-compose exec frw-cli frw publish /data/sites/my-site

# Native
frw publish sites/my-site
```

#### 7. Verify Domain (Optional)

```bash
# Add DNS TXT record first
# Then verify:

# Docker
docker-compose exec frw-cli frw domain verify example.com

# Native
frw domain verify example.com
```

---

## Configuration Commands

### `frw configure [directory]`

Interactive site configuration.

```bash
frw configure sites/my-site
```

**What it does:**
- Prompts for site details
- Creates/updates `frw.config.json`
- Shows next steps
- Provides DNS instructions if domain specified

### `frw config [directory]`

Display current site configuration.

```bash
frw config sites/my-site
```

**Output:**
```
Site Configuration
──────────────────

Name:        my-site
Title:       My FRW Site
Description: A decentralized website
Author:      Your Name
Domain:      https://example.com
FRW Name:    frw://mysite/
Build Dir:   .

Created:     11/9/2025, 12:00:00 PM
Updated:     11/9/2025, 12:00:00 PM
```

---

## Build Integration

### Static Site Generators

#### Jekyll

```json
{
  "name": "my-blog",
  "title": "My Blog",
  "frwName": "myblog",
  "buildDir": "_site"
}
```

**Build and publish:**
```bash
jekyll build
frw publish .
```

#### Hugo

```json
{
  "name": "my-site",
  "title": "My Hugo Site",
  "frwName": "mysite",
  "buildDir": "public"
}
```

**Build and publish:**
```bash
hugo
frw publish .
```

#### Next.js

```json
{
  "name": "my-app",
  "title": "My Next.js App",
  "frwName": "myapp",
  "buildDir": "out"
}
```

**Build and publish:**
```bash
npm run build
frw publish .
```

### Custom Build Script

**package.json:**
```json
{
  "scripts": {
    "build": "npm run build:assets && npm run build:html",
    "build:assets": "...",
    "build:html": "...",
    "publish": "npm run build && frw publish ."
  }
}
```

---

## HTML Metadata

### Required FRW Headers

Add these meta tags to your HTML:

```html
<head>
    <meta charset="UTF-8">
    <title>Page Title</title>
    
    <!-- FRW Required -->
    <meta name="frw-version" content="1.0">
    <meta name="frw-author" content="@yourname">
    <meta name="frw-date" content="2025-11-09T00:00:00Z">
    
    <!-- Optional FRW -->
    <meta name="frw-signature" content="...">
    <meta name="frw-keywords" content="decentralized, web3">
</head>
```

### Recommended SEO Tags

```html
<head>
    <!-- FRW tags -->
    <meta name="frw-version" content="1.0">
    <meta name="frw-author" content="@yourname">
    
    <!-- SEO -->
    <meta name="description" content="Site description">
    <meta name="keywords" content="keyword1, keyword2">
    <meta name="author" content="Your Name">
    
    <!-- Open Graph -->
    <meta property="og:title" content="Page Title">
    <meta property="og:description" content="Description">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://example.com">
    <meta property="og:image" content="https://example.com/image.jpg">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Page Title">
    <meta name="twitter:description" content="Description">
</head>
```

---

## Multi-Site Management

### Organize Multiple Sites

```
sites/
├── personal-site/
│   ├── frw.config.json
│   └── index.html
├── blog/
│   ├── frw.config.json
│   └── index.html
└── portfolio/
    ├── frw.config.json
    └── index.html
```

### Configure Each Site

```bash
# Configure personal site
frw configure sites/personal-site
frw register personal
frw publish sites/personal-site

# Configure blog
frw configure sites/blog
frw register blog
frw publish sites/blog

# Configure portfolio
frw configure sites/portfolio
frw register portfolio
frw domain add portfolio.com portfolio
frw publish sites/portfolio
```

### List All Configurations

```bash
# View each site's config
frw config sites/personal-site
frw config sites/blog
frw config sites/portfolio
```

---

## Best Practices

### Naming Conventions

**FRW Names:**
- Use lowercase
- Keep it short and memorable
- Avoid special characters
- Example: `myname`, `my-blog`, `company`

**Site Identifiers:**
- Match your FRW name when possible
- Use kebab-case
- Be descriptive
- Example: `personal-site`, `tech-blog`

### Directory Structure

```
[x] Good:
sites/my-blog/
├── frw.config.json
├── index.html
└── assets/

✗ Avoid:
sites/
├── frw.config.json      # Config at wrong level
└── my-blog/
    └── index.html
```

### Content Organization

```
[x] Organized:
my-site/
├── css/
├── js/
├── images/
├── pages/
└── index.html

✗ Messy:
my-site/
├── style.css
├── script.js
├── logo.png
├── about.html
└── index.html
```

---

## Troubleshooting

### Configuration Not Found

**Problem:** `frw config` says "No configuration found"

**Solution:**
```bash
# Create configuration
frw configure .

# Or check path
ls frw.config.json
```

### Invalid Configuration

**Problem:** JSON parsing error

**Solution:**
```bash
# Validate JSON
cat frw.config.json | python -m json.tool

# Or recreate
rm frw.config.json
frw configure .
```

### Build Directory Not Found

**Problem:** Publish fails, can't find build directory

**Solution:**
```json
{
  "buildDir": "dist"  // Make sure this exists
}
```

```bash
# Check directory exists
ls dist/

# Or use current directory
"buildDir": "."
```

---

## Advanced Configuration

### Custom Metadata

While not supported in UI, you can manually add fields:

```json
{
  "name": "my-site",
  "title": "My Site",
  "frwName": "mysite",
  "buildDir": ".",
  
  // Custom fields
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/user/site",
  "dependencies": {
    "framework": "react"
  }
}
```

### Build Commands

Add build commands:

```json
{
  "name": "my-site",
  "frwName": "mysite",
  "buildDir": "dist",
  "buildCommand": "npm run build",
  "cleanCommand": "rm -rf dist"
}
```

### Multiple Domains

```json
{
  "name": "my-site",
  "frwName": "mysite",
  "domains": [
    "example.com",
    "example.org",
    "example.net"
  ]
}
```

---

## Integration Examples

### CI/CD Pipeline

**GitHub Actions:**

```yaml
name: Publish to FRW

on:
  push:
    branches: [ main ]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup FRW
        run: |
          # Install FRW CLI
          npm install -g @frw/cli
          
      - name: Configure FRW
        run: |
          frw init --force
          echo "${{ secrets.FRW_KEY }}" > ~/.frw/keys/default.key
          
      - name: Build and Publish
        run: |
          npm run build
          frw publish .
```

### Docker Volume Mount

```yaml
# docker-compose.yml
services:
  frw-cli:
    volumes:
      - ./sites:/data/sites
      - ./configs:/configs
```

**Then:**
```bash
docker-compose exec frw-cli frw configure /data/sites/my-site
```

---

## FAQ

**Q: Can I edit the configuration file manually?**  
A: Yes, it's just JSON. Edit and save.

**Q: What happens if I don't configure a site?**  
A: You can still publish, but you'll miss metadata and domain integration.

**Q: Can I change the FRW name after configuration?**  
A: Yes, edit `frw.config.json` or run `frw configure` again.

**Q: Does configuration affect already published content?**  
A: No, you need to republish for changes to take effect.

---

## Next Steps

- [Domain Management](DOMAIN_MANAGEMENT.md)
- [Publishing Guide](USER_GUIDE.md)
- [Docker Deployment](DOCKER_DEPLOYMENT.md)

---

**Happy configuring! ⚙️**
