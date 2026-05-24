#!/bin/bash
##############################################################
# Blockchain App — One-Command Deploy Script
# Usage: ./deploy.sh
# Place at: /var/www/blockchain/deploy.sh
# Run once: chmod +x deploy.sh
##############################################################

set -e  # Exit immediately on error

APP_DIR="/var/www/blockchain"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_SERVICE="blockchain-backend"

echo ""
echo "========================================="
echo "  🚀 Blockchain App Deployment Script"
echo "========================================="

# Pull latest code
echo ""
echo "📥 Pulling latest code..."
cd "$APP_DIR"
git pull origin main

# Build frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install --production=false

echo "🔨 Building frontend (production)..."
npm run build

echo "✅ Frontend built at $FRONTEND_DIR/dist/"

# Fix permissions so nginx can read files
sudo chown -R ubuntu:www-data "$FRONTEND_DIR/dist"
sudo chmod -R 755 "$FRONTEND_DIR/dist"

# Restart backend
echo ""
echo "🔄 Restarting backend service..."
sudo systemctl restart "$BACKEND_SERVICE"
sleep 3

# Check backend health
echo ""
echo "🩺 Checking backend health..."
if curl -sf http://localhost:8000/api/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend health check failed — check logs:"
    echo "   sudo journalctl -u $BACKEND_SERVICE -n 20"
fi

# Test and reload nginx
echo ""
echo "🔄 Testing and reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "========================================="
echo "  ✅ Deployment Complete!"
echo "  🌐 http://32.196.165.92"
echo "  📊 http://32.196.165.92/api/health"
echo "  📚 http://32.196.165.92/docs"
echo "========================================="
