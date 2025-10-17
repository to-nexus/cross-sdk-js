#!/bin/bash

# CDN 파일 업데이트 스크립트

echo "🔄 CDN 파일 업데이트 중..."
echo "=================================="

# CDN 패키지 경로
CDN_DIST_PATH="../../packages/cdn/dist"

# 업데이트할 대상 디렉토리들
TARGET_DIRS=(
    "."
    "../cocos-creator/build/web-desktop/external"
    "../cocos-creator/build/web-mobile/external"
    "../cocos-creator/build-templates/web-desktop/external"
    "../cocos-creator/build-templates/web-mobile/external"
)

# CDN 패키지가 존재하는지 확인
if [ ! -d "$CDN_DIST_PATH" ]; then
    echo "❌ 오류: CDN 패키지를 찾을 수 없습니다."
    echo "먼저 packages/cdn 패키지를 빌드해주세요:"
    echo "cd ../../packages/cdn && npm run build"
    exit 1
fi

# 기존 CDN 파일 정리 및 새 파일 복사 함수
update_directory() {
    local target_dir=$1
    
    # 디렉토리가 존재하는지 확인
    if [ ! -d "$target_dir" ]; then
        echo "⚠️  경고: 디렉토리를 찾을 수 없습니다: $target_dir"
        return
    fi
    
    echo ""
    echo "📁 업데이트 중: $target_dir"
    
    # 기존 CDN 파일들 제거
    echo "  🧹 기존 파일 정리..."
    rm -f "$target_dir"/cross-sdk*.js "$target_dir"/cross-sdk*.js.map
    rm -f "$target_dir"/index-*.js "$target_dir"/index-*.js.map "$target_dir"/index.es-*.js
    rm -f "$target_dir"/secp256k1-*.js "$target_dir"/secp256k1-*.js.map
    rm -f "$target_dir"/w3m-modal-*.js "$target_dir"/w3m-modal-*.js.map
    
    # 새 파일들 복사
    echo "  📦 새 파일 복사..."
    cp "$CDN_DIST_PATH"/*.js "$target_dir/" 2>/dev/null || echo "  일부 JS 파일 복사 실패"
    cp "$CDN_DIST_PATH"/*.map "$target_dir/" 2>/dev/null || echo "  일부 소스맵 파일 복사 실패"
    
    echo "  ✅ 완료!"
}

# 각 디렉토리 업데이트
for dir in "${TARGET_DIRS[@]}"; do
    update_directory "$dir"
done

echo ""
echo "=================================="
echo "✅ 모든 CDN 파일 업데이트 완료!"
echo ""
echo "업데이트된 위치:"
for dir in "${TARGET_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir"
    fi
done

echo ""
echo "복사된 파일들 (sdk-cdn):"
ls -la *.js 2>/dev/null | grep -E "(cross-sdk|index-|secp256k1-|w3m-modal-)" | awk '{print "  - " $9}'

echo ""
echo "🌐 로컬 서버를 재시작하여 변경사항을 확인하세요:"
echo "npm run dev"
