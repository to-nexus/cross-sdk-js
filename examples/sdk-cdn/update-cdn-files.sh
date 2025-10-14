#!/bin/bash

# CDN 파일 업데이트 스크립트

echo "🔄 CDN 파일 업데이트 중..."
echo "=================================="

# CDN 패키지 경로
CDN_DIST_PATH="../../packages/cdn/dist"
CURRENT_DIR="."

# CDN 패키지가 존재하는지 확인
if [ ! -d "$CDN_DIST_PATH" ]; then
    echo "❌ 오류: CDN 패키지를 찾을 수 없습니다."
    echo "먼저 packages/cdn 패키지를 빌드해주세요:"
    echo "cd ../../packages/cdn && npm run build"
    exit 1
fi

# 기존 CDN 파일들 제거 (선택적)
echo "🧹 기존 CDN 파일 정리 중..."
rm -f cross-sdk*.js cross-sdk*.js.map
rm -f index-*.js index-*.js.map
rm -f secp256k1-*.js secp256k1-*.js.map
rm -f w3m-modal-*.js w3m-modal-*.js.map

# 새 파일들 복사
echo "📦 새 CDN 파일 복사 중..."
cp "$CDN_DIST_PATH"/*.js "$CURRENT_DIR/" 2>/dev/null || echo "일부 JS 파일 복사 실패"
cp "$CDN_DIST_PATH"/*.map "$CURRENT_DIR/" 2>/dev/null || echo "일부 소스맵 파일 복사 실패"

echo ""
echo "✅ CDN 파일 업데이트 완료!"
echo ""
echo "복사된 파일들:"
ls -la *.js 2>/dev/null | grep -E "(cross-sdk|index-|secp256k1-|w3m-modal-)" | awk '{print "  - " $9}'

echo ""
echo "🌐 로컬 서버를 재시작하여 변경사항을 확인하세요:"
echo "npm run dev"
