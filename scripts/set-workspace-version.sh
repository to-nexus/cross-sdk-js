#!/bin/bash

# 환경별 workspace 버전 설정 스크립트
# Usage: ./scripts/set-workspace-version.sh <environment>

set -e

ENVIRONMENT=${1:-prod}
# ENVIRONMENT alias normalization
if [ "$ENVIRONMENT" = "development" ]; then
  ENVIRONMENT="dev"
elif [ "$ENVIRONMENT" = "production" ]; then
  ENVIRONMENT="prod"
fi

echo "🔧 Setting workspace version for $ENVIRONMENT environment..."

case "$ENVIRONMENT" in
  "dev")
    echo "Using alpha version for dev environment"
    # 루트 package.json의 버전을 기준으로 -alpha 접미사를 보장
    ROOT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
    BASE_VERSION=$(node -e "try{const v=require('./package.json').version||'';console.log(v.replace(/-alpha.*$/,'').replace(/-beta.*$/,''))}catch(e){console.log('')}" 2>/dev/null || echo "")
    if [ -n "$ROOT_VERSION" ] && echo "$ROOT_VERSION" | grep -q "-alpha"; then
      SELECTED_VERSION="$ROOT_VERSION"
    else
      SELECTED_VERSION="${BASE_VERSION}-alpha"
    fi
    # 가능하면 Nexus에서 최신 alpha 버전 조회 (@to-nexus/sdk 기준)
    if [ -z "$REGISTRY_URL" ] && [ -f ".npmrc" ]; then
      REGISTRY_URL=$(grep "@to-nexus:registry" .npmrc | cut -d'=' -f2 || true)
    fi
    if [ -n "$REGISTRY_URL" ]; then
      LATEST_ALPHA=$(NPM_CONFIG_USERCONFIG="$PWD/.npmrc" npm view "@to-nexus/sdk@alpha" version --registry "$REGISTRY_URL" 2>/dev/null || true)
      if [ -n "$LATEST_ALPHA" ]; then
        SELECTED_VERSION="$LATEST_ALPHA"
        echo "Resolved latest alpha from registry: $SELECTED_VERSION"
      else
        echo "Could not resolve latest alpha from registry; fallback to $SELECTED_VERSION"
      fi
    fi

    if [ -n "$SELECTED_VERSION" ]; then
      node scripts/set-workspace-version.cjs "$SELECTED_VERSION" || true
      # sdkVersion 상수도 동기화하여 런타임 로그가 올바른 버전을 출력하도록 함
      node scripts/set-version.js "$SELECTED_VERSION" || true
      # prebuild 단계에서 사용하는 주입 스크립트와도 버전을 강제 동기화
      APP_VERSION="$SELECTED_VERSION" node scripts/inject-version.js || true
    fi
    ;;
  "stage")
    echo "Setting workspace version to beta for stage environment..."
    
    # If PUBLISH_VERSION is provided, use it as base version
    if [ -n "$PUBLISH_VERSION" ]; then
      echo "Using provided publish version: $PUBLISH_VERSION"
      BASE_VERSION="$PUBLISH_VERSION"
    else
      # Fallback to package.json version
      BASE_VERSION=$(node -p "require('./package.json').version.replace(/-alpha.*$/,'').replace(/-beta.*$/,'')" 2>/dev/null || echo "")
    fi
    
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
    # 토큰/기본인증 추출: env 우선, 없으면 .npmrc에서 추출
    TOKEN="${NPM_TOKEN:-$NEXUS_NPM_TOKEN}"
    BASIC=""
    if [ -z "$TOKEN" ] && [ -f ".npmrc" ]; then
      # 호스트 정합 먼저 시도
      if [ -n "$REGISTRY_URL" ]; then
        HOST_PATH=${REGISTRY_URL#https://}; HOST_PATH=${HOST_PATH%/}
        TOKEN=$(grep -E "^//${HOST_PATH}/:_authToken=" .npmrc 2>/dev/null | head -1 | cut -d'=' -f2)
        [ -z "$TOKEN" ] && TOKEN=$(grep -E "^//${HOST_PATH}:_authToken=" .npmrc 2>/dev/null | head -1 | cut -d'=' -f2)
        BASIC=$(grep -E "^//${HOST_PATH}/:_auth=" .npmrc 2>/dev/null | head -1 | cut -d'=' -f2)
        [ -z "$BASIC" ] && BASIC=$(grep -E "^//${HOST_PATH}:_auth=" .npmrc 2>/dev/null | head -1 | cut -d'=' -f2)
      fi
      # 전역 fallback (_authToken 또는 _auth 라인 아무거나)
      [ -z "$TOKEN" ] && TOKEN=$(grep -E '_authToken=' .npmrc 2>/dev/null | head -1 | cut -d'=' -f2)
      [ -z "$BASIC" ] && BASIC=$(grep -E '^_auth=' .npmrc 2>/dev/null | head -1 | cut -d'=' -f2)
      # username/_password 조합은 복잡하므로 일단 스킵 (BASIC/TOKEN 우선)
    fi
    AUTH_HEADER=()
    if [ -n "$TOKEN" ]; then
      AUTH_HEADER=(-H "Authorization: Bearer ${TOKEN}")
    elif [ -n "$BASIC" ]; then
      AUTH_HEADER=(-H "Authorization: Basic ${BASIC}")
    fi
    if [ -n "$REGISTRY_URL" ]; then
      echo "Using registry: $REGISTRY_URL"
      TMP_FILE=$(mktemp)
      HDR_FILE=$(mktemp)
      if [ ${#AUTH_HEADER[@]} -gt 0 ]; then
        HTTP_CODE=$(curl -sS "${AUTH_HEADER[@]}" -H "Accept: application/json" -D "$HDR_FILE" -o "$TMP_FILE" -w "%{http_code}" "${REGISTRY_URL}%40to-nexus%2Fsdk" 2>/dev/null || echo "000")
      else
        HTTP_CODE=$(curl -sS -H "Accept: application/json" -D "$HDR_FILE" -o "$TMP_FILE" -w "%{http_code}" "${REGISTRY_URL}%40to-nexus%2Fsdk" 2>/dev/null || echo "000")
      fi
      CONTENT_TYPE=$(grep -i '^content-type:' "$HDR_FILE" 2>/dev/null | tail -1 | cut -d' ' -f2- | tr -d '\r')
      META_RAW=$(cat "$TMP_FILE" 2>/dev/null || echo "")
      rm -f "$TMP_FILE" "$HDR_FILE" || true
      TOKEN_STATE=$( [ ${#AUTH_HEADER[@]} -gt 0 ] && echo present || echo absent )
      echo "ℹ️ registry GET status: $HTTP_CODE, token: $TOKEN_STATE, type: ${CONTENT_TYPE:-unknown}"
      # tarball 존재 여부 확인 (e.g., sdk-<base>-beta.tgz)
      if [ -z "$BASE_VERSION" ]; then
        BASE_VERSION=$(node -p "require('./package.json').version.replace(/-alpha.*$/,'').replace(/-beta.*$/,'')" 2>/dev/null || echo "")
      fi
      if [ -n "$BASE_VERSION" ]; then
        TARBALL_URL="${REGISTRY_URL}%40to-nexus%2Fsdk/-/sdk-${BASE_VERSION}-beta.tgz"
        if [ ${#AUTH_HEADER[@]} -gt 0 ]; then
          TARBALL_CODE=$(curl -sI "${AUTH_HEADER[@]}" "$TARBALL_URL" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
        else
          TARBALL_CODE=$(curl -sI "$TARBALL_URL" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
        fi
        echo "ℹ️ beta tarball HEAD status: $TARBALL_CODE"
        if [ "$TARBALL_CODE" = "200" ]; then
          TARBALL_OK=1
        else
          TARBALL_OK=0
        fi
      fi
    else
      echo "Registry URL not available; defaulting to stable"
      META_RAW=""
    fi
    export META_RAW
    export TARBALL_OK="${TARBALL_OK:-0}"
    export BASE_VERSION
    node -e "
 const fs = require('fs');
 let metaStr = process.env.META_RAW || '';
 let meta = {}; try { meta = JSON.parse(metaStr || '{}'); } catch (e) {}
 const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
 const baseVersion = process.env.BASE_VERSION || pkg.version.replace(/-alpha.*$/, '').replace(/-beta.*$/, '');
 const candidatePrefix = baseVersion + '-beta';
 const distTags = (meta && meta['dist-tags']) || {};
 const versions = (meta && meta.versions) || {};
 const betaTag = typeof distTags.beta === 'string' ? distTags.beta : '';
 const hasBetaMeta = (betaTag && betaTag.startsWith(candidatePrefix)) || Object.keys(versions).some(v => v.startsWith(candidatePrefix));
 const hasBeta = hasBetaMeta || process.env.TARBALL_OK === '1';
 if (hasBeta) {
   // Find the latest beta version with the same base version
   const betaVersions = Object.keys(versions).filter(v => v.startsWith(candidatePrefix));
   let selectedBetaVersion = candidatePrefix;
   
   if (betaVersions.length > 0) {
     // Sort versions and get the latest one
     betaVersions.sort((a, b) => {
       const aMatch = a.match(/(\d+)\.(\d+)\.(\d+)-beta(?:\.(\d+))?/);
       const bMatch = b.match(/(\d+)\.(\d+)\.(\d+)-beta(?:\.(\d+))?/);
       if (aMatch && bMatch) {
         const aPatch = parseInt(aMatch[4] || '0');
         const bPatch = parseInt(bMatch[4] || '0');
         return bPatch - aPatch; // Descending order
       }
       return b.localeCompare(a);
     });
     selectedBetaVersion = betaVersions[0];
   } else if (betaTag && betaTag.startsWith(candidatePrefix)) {
     selectedBetaVersion = betaTag;
   }
   
   console.log('✅ Beta version exists (meta/tarball), using:', selectedBetaVersion);
   pkg.version = selectedBetaVersion;
 } else {
   console.log('⚠️  Beta version not found, using stable:', baseVersion);
   pkg.version = baseVersion;
 }
 fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
 console.log('Workspace version set to:', pkg.version);
 " META_RAW="$META_RAW" TARBALL_OK="$TARBALL_OK"
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
