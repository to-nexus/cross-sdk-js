# Cocos Creator Cross SDK Example

Cocos Creator 3.8.7 게임 프로젝트에 Cross SDK를 통합한 예제입니다.
블록체인 기능이 포함된 게임 UI 템플릿으로, 상점, 인벤토리 등의 일반적인 게임 UI 인터페이스를 제공합니다.

## 🚀 빌드 방법

### 로컬 빌드
```bash
# Cocos Creator 프로젝트 빌드
npm run build

# 개별 플랫폼 빌드
npm run build:web-desktop  # 데스크톱 웹용
npm run build:web-mobile   # 모바일 웹용
```

### GitHub Actions를 통한 자동 배포
1. **독립 실행**: `cocos-creator-deploy.yml` 워크플로우 직접 실행
2. **통합 실행**: `publish_and_build.yml`에서 `services: cocos-creator` 선택

빌드 결과물은 S3에 자동 업로드되며, CloudFront 캐시가 무효화됩니다.

## 📁 구조
- `build-templates/` - 사전 빌드된 템플릿 (Cross SDK 포함)
- `assets/` - 게임 에셋 (스크립트, 텍스처, 애니메이션 등)
- `settings/` - Cocos Creator 프로젝트 설정

## Screenshots

<img width="319" alt="ui-image" src="https://user-images.githubusercontent.com/32630749/158115467-5bf10b77-c5e1-464a-8703-0f368fc29110.png">
