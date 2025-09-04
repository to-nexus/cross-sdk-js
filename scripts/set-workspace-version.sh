#!/bin/bash

# 환경별 workspace 버전 설정 스크립트
# Usage: ./scripts/set-workspace-version.sh <environment>

set -e

ENVIRONMENT=${1:-prod}

echo "🔧 Setting workspace version for $ENVIRONMENT environment..."

case "$ENVIRONMENT" in
  "dev")
    echo "Using alpha version for dev environment"
    # alpha 버전은 이미 설정되어 있으므로 변경 없음
    ;;
  "stage")
    echo "Setting workspace version to beta for stage environment..."
    # 우선순위: REGISTRY_URL env > .npmrc(@to-nexus 매핑) > .npmrc(auth 호스트) > 없음
    if [ -z "$REGISTRY_URL" ] && [ -f ".npmrc" ]; then
      REGISTRY_URL=$(grep "@to-nexus:registry" .npmrc | cut -d'=' -f2 || true)
      if [ -z "$REGISTRY_URL" ]; then
        # 토큰 라인에서 호스트 추출해 기본 URL 구성
        AUTH_HOST=$(grep -E '^//[^ ]+:_authToken' .npmrc 2>/dev/null | head -1 | sed -E 's#^//([^/:]+).*#\1#' || true)
        if [ -n "$AUTH_HOST" ]; then
          # dev 레지스트리 경로로 가정 (stage도 dev-cross를 사용)
          REGISTRY_URL="https://${AUTH_HOST}/repository/dev-cross-sdk-js/"
        fi
      fi
    fi
    if [ -n "$REGISTRY_URL" ]; then
      echo "Using registry: $REGISTRY_URL"
      BETA_CHECK=$(curl -s "${REGISTRY_URL}%40to-nexus%2Fsdk" 2>/dev/null | grep -o '"beta":"[^"]*"' || echo "")
    else
      echo "Registry URL not available; defaulting to stable"
      BETA_CHECK=""
    fi
    node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const baseVersion = pkg.version.replace(/-alpha.*$/, '').replace(/-beta.*$/, '');
const betaCheck = process.env.BETA_CHECK;
if (betaCheck && betaCheck.includes('beta')) {
  const betaVersion = baseVersion + '-beta';
  console.log('✅ Beta version exists in registry, using:', betaVersion);
  pkg.version = betaVersion;
} else {
  console.log('⚠️  Beta version not found, using stable:', baseVersion);
  pkg.version = baseVersion;
}
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Workspace version set to:', pkg.version);
" BETA_CHECK="$BETA_CHECK"
    ;;
  "prod")
    echo "Setting stable version for production..."
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      pkg.version = pkg.version.replace(/-alpha.*$/, '').replace(/-beta.*$/, '');
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
      console.log('Workspace version updated to:', pkg.version);
    "
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid options: dev, stage, prod"
    exit 1
    ;;
esac

echo "✅ Workspace version configuration completed for $ENVIRONMENT"
