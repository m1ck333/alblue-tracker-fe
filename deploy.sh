#!/bin/bash
set -e

TARGET=${1:-all}

if [ "$TARGET" = "dashboard" ] || [ "$TARGET" = "all" ]; then
  echo "🔨 Building dashboard..."
  VITE_API_BASE_URL=https://alblue.duckdns.org/api \
  VITE_SIGNALR_URL=https://alblue.duckdns.org/hubs/production \
  pnpm --filter dashboard build
  echo "📦 Uploading dashboard..."
  rsync -az --delete apps/dashboard/dist/ root@46.101.166.137:/opt/alblue/dashboard/
  echo "✅ Dashboard deployed!"
fi

if [ "$TARGET" = "tablet" ] || [ "$TARGET" = "all" ]; then
  echo "🔨 Building tablet..."
  VITE_API_BASE_URL=https://alblue-tablet.duckdns.org/api \
  VITE_SIGNALR_URL=https://alblue-tablet.duckdns.org/hubs/production \
  pnpm --filter tablet build
  echo "📦 Uploading tablet..."
  rsync -az --delete apps/tablet/dist/ root@46.101.166.137:/opt/alblue/tablet/
  echo "✅ Tablet deployed!"
fi

if [ "$TARGET" != "dashboard" ] && [ "$TARGET" != "tablet" ] && [ "$TARGET" != "all" ]; then
  echo "Usage: ./deploy.sh [dashboard|tablet|all]"
  exit 1
fi
