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
    SELECTED_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
    if [ -n "$SELECTED_VERSION" ]; then
      node scripts/set-workspace-version.cjs "$SELECTED_VERSION" || true
    fi
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
    # URL 정규화 (trailing slash 보장)
    if [ -n "$REGISTRY_URL" ] && [ "${REGISTRY_URL: -1}" != "/" ]; then
      REGISTRY_URL="${REGISTRY_URL}/"
    fi
    # 토큰 추출: env 우선, 없으면 .npmrc에서 현재 호스트 기준으로 추출
    TOKEN="$NPM_TOKEN"
    if [ -z "$TOKEN" ] && [ -f ".npmrc" ] && [ -n "$REGISTRY_URL" ]; then
      HOST_PATH=${REGISTRY_URL#https://}; HOST_PATH=${HOST_PATH%/}
      TOKEN=$(grep -E "^//${HOST_PATH}/:_authToken=" .npmrc 2>/dev/null | head -1 | cut -d'=' -f2)
      if [ -z "$TOKEN" ]; then
        TOKEN=$(grep -E "^//${HOST_PATH}:_authToken=" .npmrc 2>/dev/null | head -1 | cut -d'=' -f2)
      fi
      if [ -z "$TOKEN" ]; then
        TOKEN=$(grep -E '^//[^ ]+/:_authToken=' .npmrc 2>/dev/null | head -1 | cut -d'=' -f2)
      fi
      if [ -z "$TOKEN" ]; then
        TOKEN=$(grep -E '^//[^ ]+:_authToken=' .npmrc 2>/dev/null | head -1 | cut -d'=' -f2)
      fi
    fi
    if [ -n "$REGISTRY_URL" ]; then
      echo "Using registry: $REGISTRY_URL"
      TMP_FILE=$(mktemp)
      if [ -n "$TOKEN" ]; then
        HTTP_CODE=$(curl -sS -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/json" -o "$TMP_FILE" -w "%{http_code}" "${REGISTRY_URL}%40to-nexus%2Fsdk" 2>/dev/null || echo "000")
      else
        HTTP_CODE=$(curl -sS -H "Accept: application/json" -o "$TMP_FILE" -w "%{http_code}" "${REGISTRY_URL}%40to-nexus%2Fsdk" 2>/dev/null || echo "000")
      fi
      META_RAW=$(cat "$TMP_FILE" 2>/dev/null || echo "")
      rm -f "$TMP_FILE" || true
      TOKEN_STATE=$( [ -n "$TOKEN" ] && echo present || echo absent )
      echo "ℹ️ registry GET status: $HTTP_CODE, token: $TOKEN_STATE"
    else
      echo "Registry URL not available; defaulting to stable"
      META_RAW=""
    fi
    node -e "
const fs = require('fs');
let metaStr = process.env.META_RAW || '';
let meta = {}; try { meta = JSON.parse(metaStr || '{}'); } catch (e) {}
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const baseVersion = pkg.version.replace(/-alpha.*$/, '').replace(/-beta.*$/, '');
const candidatePrefix = baseVersion + '-beta';
const distTags = (meta && meta['dist-tags']) || {};
const versions = (meta && meta.versions) || {};
const betaTag = typeof distTags.beta === 'string' ? distTags.beta : '';
const hasBeta = (betaTag && betaTag.startsWith(candidatePrefix)) || Object.keys(versions).some(v => v.startsWith(candidatePrefix));
if (hasBeta) {
  const betaVersion = candidatePrefix;
  console.log('✅ Beta version exists in registry, using:', betaVersion);
  pkg.version = betaVersion;
} else {
  console.log('⚠️  Beta version not found, using stable:', baseVersion);
  pkg.version = baseVersion;
}
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Workspace version set to:', pkg.version);
" META_RAW="$META_RAW"
    SELECTED_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
    if [ -n "$SELECTED_VERSION" ]; then
      node scripts/set-workspace-version.cjs "$SELECTED_VERSION" || true
    fi
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
    SELECTED_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
    if [ -n "$SELECTED_VERSION" ]; then
      node scripts/set-workspace-version.cjs "$SELECTED_VERSION" || true
    fi
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid options: dev, stage, prod"
    exit 1
    ;;
esac

echo "✅ Workspace version configuration completed for $ENVIRONMENT"
