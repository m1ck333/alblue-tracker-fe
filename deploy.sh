#!/bin/bash
# Sentry: shared mes-api project, environment=alblue-staging. DSN is public
# (baked into JS bundle), so committing it here is no extra exposure.
set -e

SENTRY_DSN="https://315954545e637502fd5497b3090b5c9c@o4511398917177344.ingest.de.sentry.io/4511398994313296"
SENTRY_ENV="alblue-staging"
SENTRY_RELEASE=$(git rev-parse --short HEAD)

TARGET=${1:-all}

if [ "$TARGET" = "dashboard" ] || [ "$TARGET" = "all" ]; then
  echo "🔨 Building dashboard ($SENTRY_RELEASE)..."
  VITE_API_BASE_URL=https://alblue.duckdns.org/api \
  VITE_SIGNALR_URL=https://alblue.duckdns.org/hubs/production \
  VITE_SENTRY_DSN="$SENTRY_DSN" \
  VITE_SENTRY_ENVIRONMENT="$SENTRY_ENV" \
  VITE_SENTRY_RELEASE="$SENTRY_RELEASE" \
  pnpm --filter dashboard build
  echo "📦 Uploading dashboard..."
  rsync -az --delete apps/dashboard/dist/ root@46.101.166.137:/opt/alblue/dashboard/
  echo "✅ Dashboard deployed!"
fi

if [ "$TARGET" = "tablet" ] || [ "$TARGET" = "all" ]; then
  echo "🔨 Building tablet ($SENTRY_RELEASE)..."
  VITE_API_BASE_URL=https://alblue-tablet.duckdns.org/api \
  VITE_SIGNALR_URL=https://alblue-tablet.duckdns.org/hubs/production \
  VITE_SENTRY_DSN="$SENTRY_DSN" \
  VITE_SENTRY_ENVIRONMENT="$SENTRY_ENV" \
  VITE_SENTRY_RELEASE="$SENTRY_RELEASE" \
  pnpm --filter tablet build
  echo "📦 Uploading tablet..."
  rsync -az --delete apps/tablet/dist/ root@46.101.166.137:/opt/alblue/tablet/
  echo "✅ Tablet deployed!"
fi

if [ "$TARGET" != "dashboard" ] && [ "$TARGET" != "tablet" ] && [ "$TARGET" != "all" ]; then
  echo "Usage: ./deploy.sh [dashboard|tablet|all]"
  exit 1
fi
