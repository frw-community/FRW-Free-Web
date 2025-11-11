#!/bin/bash
# Quick update script for bootstrap node

echo "Updating FRW Bootstrap Node..."

cd ~/FRW-Free-Web || exit 1

# Backup current version
cp apps/bootstrap-node/dist/index.js apps/bootstrap-node/dist/index.js.backup

# Rebuild
echo "Rebuilding..."
npx tsc -b apps/bootstrap-node

# Restart service
echo "Restarting service..."
sudo systemctl restart frw-bootstrap

# Check status
echo "Status:"
sudo systemctl status frw-bootstrap --no-pager

echo ""
echo "Done! Check logs with:"
echo "  sudo journalctl -u frw-bootstrap -f"
