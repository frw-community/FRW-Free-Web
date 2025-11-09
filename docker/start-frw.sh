#!/bin/bash

# FRW Quick Start Script
# Automates Docker deployment for FRW

set -e

echo "╔════════════════════════════════════════╗"
echo "║     FRW Quick Start Setup              ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "   Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "   Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✓ Docker found: $(docker --version)"
echo "✓ Docker Compose found: $(docker-compose --version)"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env configuration..."
    cp .env.example .env
    echo "✓ Created .env file"
fi

# Create sites directory
if [ ! -d sites ]; then
    mkdir -p sites
    echo "✓ Created sites directory"
fi

echo ""
echo "Starting FRW services..."
echo ""

# Start services
docker-compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check if IPFS is healthy
echo "Checking IPFS status..."
if docker-compose exec -T ipfs ipfs version &> /dev/null; then
    echo "✓ IPFS is running"
else
    echo "⚠ IPFS may not be ready yet, give it a moment..."
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║     FRW Setup Complete!                ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Your FRW node is now running!"
echo ""
echo "Services:"
echo "  • IPFS Node:     http://localhost:5001"
echo "  • IPFS Gateway:  http://localhost:8080"
echo "  • FRW Gateway:   http://localhost:3000"
echo ""
echo "Next steps:"
echo ""
echo "1. Initialize FRW:"
echo "   docker-compose exec frw-cli frw init"
echo ""
echo "2. Register a name:"
echo "   docker-compose exec frw-cli frw register myname"
echo ""
echo "3. Place your site in ./sites/my-site/ and configure:"
echo "   docker-compose exec frw-cli frw configure /data/sites/my-site"
echo "   (Use custom folders? See docs/CUSTOM_FOLDERS.md)"
echo ""
echo "4. (Optional) Link a custom domain:"
echo "   docker-compose exec frw-cli frw domain add example.com myname"
echo "   Then add DNS TXT record and verify:"
echo "   docker-compose exec frw-cli frw domain verify example.com"
echo ""
echo "5. Publish your site:"
echo "   docker-compose exec frw-cli frw publish /data/sites/my-site"
echo ""
echo "6. Access content:"
echo "   http://localhost:3000/frw/myname/"
echo "   or https://example.com (if domain configured)"
echo ""
echo "View logs:"
echo "   docker-compose logs -f"
echo ""
echo "Stop services:"
echo "   docker-compose down"
echo ""
echo "Useful commands:"
echo "   make help                    # Show all commands"
echo "   make configure SITE=my-site  # Configure site"
echo "   make domain-list             # List domains"
echo ""
echo "Documentation:"
echo "   docs/DOCKER_DEPLOYMENT.md"
echo "   docs/DOMAIN_MANAGEMENT.md"
echo "   docs/SITE_CONFIGURATION.md"
echo "   docs/CUSTOM_FOLDERS.md (use any folder!)"
echo ""
