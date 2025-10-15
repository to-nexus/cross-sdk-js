#!/bin/bash

# CDN 빌드 결과물을 Cocos Creator external 폴더로 복사하는 스크립트

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 소스 및 타겟 디렉토리
CDN_DIST="${PROJECT_ROOT}/packages/cdn/dist"
COCOS_WEB_DESKTOP="${PROJECT_ROOT}/examples/cocos-creator/build-templates/web-desktop/external"
COCOS_WEB_MOBILE="${PROJECT_ROOT}/examples/cocos-creator/build-templates/web-mobile/external"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Syncing CDN to Cocos Creator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# CDN 빌드 결과물 확인
if [ ! -d "$CDN_DIST" ]; then
  echo -e "${YELLOW}Warning: CDN dist folder not found. Building CDN first...${NC}"
  cd "$PROJECT_ROOT"
  pnpm --filter @to-nexus/sdk-cdn build
fi

# Cocos Creator external 폴더 확인 및 생성
mkdir -p "$COCOS_WEB_DESKTOP"
mkdir -p "$COCOS_WEB_MOBILE"

# 복사할 파일들 (CDN에서 빌드된 모든 파일)
echo -e "${GREEN}📦 Copying files from CDN dist to Cocos Creator...${NC}"
echo ""

# web-desktop에 복사
echo -e "  → Copying to web-desktop/external/"
cp -v "$CDN_DIST"/*.js "$COCOS_WEB_DESKTOP/" 2>/dev/null || true
cp -v "$CDN_DIST"/*.map "$COCOS_WEB_DESKTOP/" 2>/dev/null || true

# web-mobile에 복사
echo -e "  → Copying to web-mobile/external/"
cp -v "$CDN_DIST"/*.js "$COCOS_WEB_MOBILE/" 2>/dev/null || true
cp -v "$CDN_DIST"/*.map "$COCOS_WEB_MOBILE/" 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Successfully synced CDN files to Cocos Creator!${NC}"
echo ""
echo -e "${BLUE}Updated locations:${NC}"
echo -e "  - ${COCOS_WEB_DESKTOP}"
echo -e "  - ${COCOS_WEB_MOBILE}"
echo ""

