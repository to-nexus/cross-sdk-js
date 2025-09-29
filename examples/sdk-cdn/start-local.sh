#!/bin/bash

# Cross SDK CDN 로컬 테스트 서버 실행 스크립트

echo "🚀 Cross SDK CDN 로컬 테스트 환경 시작"
echo "=================================="

# 현재 디렉토리 확인
if [ ! -f "index.html" ]; then
    echo "❌ 오류: index.html 파일을 찾을 수 없습니다."
    echo "examples/sdk-cdn 디렉토리에서 실행해주세요."
    exit 1
fi

# 의존성 설치 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성 설치 중..."
    npm install
fi

echo ""
echo "🌐 로컬 서버 실행 중..."
echo "브라우저에서 다음 주소로 접속하세요:"
echo ""

# 서버 실행 (CORS 지원)
npm run dev
