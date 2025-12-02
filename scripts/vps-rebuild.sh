#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting FRW VPS Rebuild & Update Script...${NC}"

# 1. Environment Checks
echo -e "${YELLOW}🔍 Checking environment...${NC}"
if [ ! -d "packages" ]; then
    echo -e "${RED}❌ Error: Please run this script from the root of the FRW repository.${NC}"
    exit 1
fi

# Check memory (Low memory often causes TSC to crash)
FREE_MEM=$(free -m | awk '/^Mem:/{print $7}')
if [ "$FREE_MEM" -lt 500 ]; then
    echo -e "${YELLOW}⚠️  Warning: Low free memory ($FREE_MEM MB). Enabling temporary swap if possible...${NC}"
fi

# 2. Clean Slate
echo -e "${YELLOW}🧹 Cleaning old build artifacts...${NC}"
rm -rf packages/*/dist apps/*/dist
rm -f packages/*/*.tsbuildinfo
# We don't delete node_modules unless asked, to save time, but we clean cache
npm cache clean --force > /dev/null 2>&1

# 3. Build Function
build_package() {
    PKG_DIR=$1
    PKG_NAME=$2
    if [ -d "$PKG_DIR" ]; then
        echo -e "${GREEN}📦 Building $PKG_NAME...${NC}"
        npx tsc -b "$PKG_DIR"
        
        # Robustness Trick: Copy built package to node_modules to ensure detection
        # This fixes the "Cannot find module" error on constrained VPS environments
        if [ "$PKG_NAME" != "@frw/common" ]; then # Common is handled differently
            DEST="node_modules/$PKG_NAME"
            mkdir -p "$(dirname "$DEST")"
            rm -rf "$DEST"
            cp -r "$PKG_DIR" "$DEST"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping $PKG_NAME (Directory not found)${NC}"
    fi
}

# 4. Build Sequence (Dependency Order is Critical)

# Level 0: Common
build_package "packages/common" "@frw/common"
# Link common explicitly
rm -rf node_modules/@frw/common
cp -r packages/common node_modules/@frw/

# Level 1: Crypto & V2 Core
build_package "packages/crypto" "@frw/crypto"
build_package "packages/crypto-pq" "@frw/crypto-pq"
build_package "packages/pow-v2" "@frw/pow-v2"

# Level 2: Storage & Registry
build_package "packages/storage" "@frw/storage"
build_package "packages/name-registry" "@frw/name-registry"

# Level 3: Protocol & IPFS
build_package "packages/protocol-v2" "@frw/protocol-v2"
build_package "packages/ipfs" "@frw/ipfs"
build_package "packages/protocol" "@frw/protocol"

# 5. Application Build
echo -e "${GREEN}🚀 Building Bootstrap Node Application...${NC}"
cd apps/bootstrap-node
npm run build
cd ../..

# 6. Restart Services
echo -e "${GREEN}🔄 Restarting Services...${NC}"

# Ensure IPFS is running with PubSub
if ! pm2 list | grep -q "ipfs-daemon"; then
    echo "Starting IPFS Daemon..."
    pm2 start "ipfs daemon --enable-pubsub-experiment" --name "ipfs-daemon"
    sleep 5
fi

# Restart Node
pm2 delete bootstrap-node 2>/dev/null || true
cd apps/bootstrap-node
pm2 start dist/index.js --name "bootstrap-node" --update-env
cd ../..

# Save state
pm2 save

# 7. Verification
echo -e "${GREEN}🌍 Verification: Checking API Status...${NC}"
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/api/list)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS! Node is online and responding.${NC}"
    echo -e "   Use 'pm2 logs bootstrap-node' to monitor."
else
    echo -e "${RED}❌ Error: Node responded with HTTP $HTTP_CODE${NC}"
    echo -e "   Check logs with: pm2 logs bootstrap-node"
fi
