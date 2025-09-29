@echo off
chcp 65001 >nul

echo 🚀 Cross SDK CDN 로컬 테스트 환경 시작
echo ==================================

REM 현재 디렉토리 확인
if not exist "index.html" (
    echo ❌ 오류: index.html 파일을 찾을 수 없습니다.
    echo examples\sdk-cdn 디렉토리에서 실행해주세요.
    pause
    exit /b 1
)

REM 의존성 설치 확인
if not exist "node_modules" (
    echo 📦 의존성 설치 중...
    npm install
)

echo.
echo 🌐 로컬 서버 실행 중...
echo 브라우저에서 다음 주소로 접속하세요:
echo.

REM 서버 실행 (CORS 지원)
npm run dev
