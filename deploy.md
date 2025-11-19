### 배포 가이드 (cross-sdk-js)

이 문서는 monorepo(패키지/프로바이더) 기반 `pnpm + turbo` 프로젝트의 빌드/퍼블리시/이미지/CDN 배포 절차를 정리합니다. 모든 정식 배포는 GitHub Actions 워크플로우를 통해 수행합니다.

## 사전 준비

- **권한/시크릿**: 레포지토리의 GitHub Actions에 다음이 구성되어 있어야 합니다.
  - **Nexus**: `NEXUS_REGISTRY_URL`, `NEXUS_DEV_REGISTRY_URL`, `NEXUS_STAGE_REGISTRY_URL`, `NEXUS_NPM_TOKEN`
  - **AWS(ECR/CDN)**: `ACCOUNT_ID`, `CDN_ACCOUNT_ID`, `OIDC_ROLE_ARN`, `AWS_REGION`, `S3_BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`
  - **기타**: `GITHUB_TOKEN`(기본), `SONAR_TOKEN`(선택), `READ_ONLY_REPO`(선택)

## 브랜치 및 버전 정책

- **dev**: `develop` 브랜치에서 실행합니다. 입력한 `publish_version`에 프리릴리즈 접미사가 없으면 자동으로 `-alpha`가 붙습니다.
- **stage**: `release/<version>` 브랜치에서 실행합니다. 입력한 `publish_version`에 프리릴리즈 접미사가 없으면 자동으로 `-beta`가 붙습니다.
- **prod**: `main` 브랜치에서 실행합니다. `publish_version`의 프리릴리즈 접미사는 제거되어 `latest`로 퍼블리시됩니다.
- 퍼블리시 후 태깅/릴리스:
  - dev/stage: `release/<version-with-prerelease>` 태그 + GitHub Pre-Release
  - prod: `release/<version>` 태그 + GitHub Release

## 주요 워크플로우

- 파일: `.github/workflows/publish_and_build.yml` (퍼블리시/빌드/이미지/CDN 통합)
- 파일: `.github/workflows/version_bump.yml` (외부 의존성 버전 정렬 및 게이트)

공통 입력 값

- **environment**: `dev | stage | prod`
- **services**: `all | changeset | package-publish | sample-page | cdn-publish`
- **publish_version**: 배포 버전 (dev에서 필수, release/\*(stage) 브랜치에서는 선택)
- **dry_run**: 실제 퍼블리시/푸시/태깅 없이 검증만 (`true | false`)
- **package_versions**: 외부 의존성 오버라이드. 예: `core=2.19.11,universal=2.19.11,sign-client=2.19.11-alpha.2,sdk=1.16.6`
  - 별칭 → 실제 패키지 매핑: `core=@to-nexus/core`, `universal=@to-nexus/universal-provider`, `sign-client=@to-nexus/sign-client`, `sdk=@to-nexus/sdk`

## NPM 퍼블리시 (Nexus)

dist-tag 매핑: dev → `alpha`, stage → `beta`, prod → `latest`

### Dev (alpha)

1. 브랜치: `release/<version>`
2. 워크플로우 수동 실행:
   - environment: `dev`
   - services: `package-publish` (또는 `all`)
   - publish_version: 예) `1.2.3-alpha.1` 또는 `1.2.3`(없으면 `-alpha` 자동 부착)
3. 성공 시 프리릴리즈 태그/릴리스가 생성됩니다.

예시 (GitHub CLI):

```bash
gh workflow run .github/workflows/publish_and_build.yml \
  -f environment=dev -f services=package-publish -f publish_version=1.2.3 -f dry_run=false
```

### Stage (beta)

1. 브랜치: `release/<version>`
2. 입력은 Dev와 동일하되 environment만 `stage`로 설정합니다.

```bash
gh workflow run .github/workflows/publish_and_build.yml \
  -f environment=stage -f services=package-publish -f publish_version=1.2.3 -f dry_run=false
```

### Prod (latest)

1. 브랜치: `main`
2. environment: `prod`, services: `package-publish`, publish_version: `1.2.3`

```bash
gh workflow run .github/workflows/publish_and_build.yml \
  -f environment=prod -f services=package-publish -f publish_version=1.2.3 -f dry_run=false
```

참고

- 워크플로우는 내부적으로 Nexus 인증을 검증(`-/whoami`)하고, `@to-nexus/*` 패키지(단, `@to-nexus/sign-client`는 제외)만 퍼블리시합니다.
- `version_bump.yml`은 dev/stage 환경에서 `alpha/beta` 태그가 실제로 존재하지 않으면 퍼블리시를 차단합니다(`can_publish=false`).

## 샘플 페이지 Docker 이미지 (ECR)

서비스: `sample-page`

### Dev/Stage

- 브랜치: dev는 `develop`, stage는 `release/<version>`
- 실행: environment를 각각 `dev` 또는 `stage`로 선택하고 `services=sample-page`
- 결과: `${ACCOUNT_ID}.dkr.ecr/<env>/<repo>:{GIT_SHA, latest}` 태그로 푸시

```bash
gh workflow run .github/workflows/publish_and_build.yml \
  -f environment=dev -f services=sample-page -f publish_version=1.2.3 -f dry_run=false
```

### Prod

- 브랜치: `main`
- 실행: environment=`prod`, services=`sample-page`

## CDN 퍼블리시 (S3 + CloudFront)

서비스: `cdn-publish` (prod 전용)

절차

1. 브랜치 `main`
2. 워크플로우 실행: environment=`prod`, services=`cdn-publish`
3. `packages/cdn/dist`를 S3 `cross-sdk/<version>/`로 업로드, 최신은 `cross-sdk/latest/`에 동기화
4. 해당 경로로 CloudFront 캐시 무효화 수행

```bash
gh workflow run .github/workflows/publish_and_build.yml \
  -f environment=prod -f services=cdn-publish -f publish_version=1.2.3 -f dry_run=false
```

## Cocos Creator 예제 배포

Cocos Creator 프로젝트는 빌드된 정적 파일을 서빙하는 방식으로 배포합니다.

### 로컬 테스트 (간단한 방법)

빌드된 파일을 정적 서버로 바로 실행:

```bash
# web-desktop 빌드 실행
cd examples/cocos-creator/build/web-desktop
npx serve -p 3000 .

# 또는 web-mobile 빌드 실행
cd examples/cocos-creator/build/web-mobile
npx serve -p 3001 .
```

접속: `http://localhost:3000` 또는 `http://localhost:3001`

### Docker를 통한 배포

프로젝트의 Dockerfile과 nginx.conf가 Cocos Creator 배포를 지원하도록 설정되어 있습니다.

1. **빌드된 파일 확인**: `examples/cocos-creator/build/web-desktop/` 경로에 빌드 결과물이 있어야 합니다.
2. **Docker 이미지 빌드**:
   ```bash
   docker build -t cross-sdk-examples .
   ```
3. **컨테이너 실행**:
   ```bash
   docker run -p 8080:8080 cross-sdk-examples
   ```
4. **접속**: `http://localhost:8080/cocos/`

### 배포 경로 구성

Docker/Nginx 배포 시 다음 경로로 접근 가능:

- `/react/` - React 예제
- `/wagmi/` - Wagmi 예제
- `/vanilla/` - Vanilla JS 예제
- `/cdn/` - CDN 예제
- `/cocos/` - Cocos Creator 예제
- `/` - 랜딩 페이지

### Cocos Creator 프로젝트 재빌드

Cocos Creator에서 변경사항이 있을 경우:

1. Cocos Creator 에디터에서 프로젝트 열기
2. **프로젝트** → **빌드 발행** (Ctrl/Cmd + Shift + B)
3. 플랫폼 선택: `Web Desktop` 또는 `Web Mobile`
4. **빌드** 버튼 클릭
5. 빌드 완료 후 Docker 이미지 재빌드

## 로컬 개발/빌드

```bash
pnpm install --no-frozen-lockfile
pnpm -w run build   # monorepo 전체 빌드
```

Nexus 프록시 레지스트리 사용 시(선택): 루트에 `.npmrc` 구성

```ini
registry=https://registry.npmjs.org/
@to-nexus:registry=<NEXUS_REGISTRY_URL>
//<host>/:_authToken=<NEXUS_NPM_TOKEN>
always-auth=true
```

## 새로운 Example 추가하기

새로운 example (예: `sdk-nextjs`)을 배포 파이프라인에 추가하려면 다음 4개 파일을 수정해야 합니다:

### 1. Vite 설정 (production base path)

**파일**: `examples/<example-name>/vite.config.js`

```javascript
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/<example-name>/' : '/'
  // ... 기타 설정
})
```

**예시**: wagmi example의 경우

```javascript
base: process.env.NODE_ENV === 'production' ? '/wagmi/' : '/',
```

### 2. Nginx 라우팅 설정

**파일**: `nginx.conf`

React, Vanilla, CDN 섹션 사이에 새로운 location 블록을 추가합니다:

```nginx
# <Example Name> 앱 서빙
location /<example-name> {
    alias /usr/share/nginx/html/<example-name>;
    try_files $uri $uri/ /<example-name>/index.html;

    # 캐시 설정
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**예시**: wagmi example의 경우 (83-93번 줄 참고)

### 3. 배포 문서 업데이트

**파일**: `deploy.md`

"배포 경로 구성" 섹션의 리스트에 추가:

```markdown
- `/react/` - React 예제
- `/wagmi/` - Wagmi 예제
- `/<example-name>/` - <Example Description> ← 추가
- `/vanilla/` - Vanilla JS 예제
- `/cdn/` - CDN 예제
- `/cocos/` - Cocos Creator 예제
- `/` - 랜딩 페이지
```

### 4. 랜딩 페이지 카드 추가

**파일**: `examples/index.html`

`examples-grid` div 안에 새로운 카드를 추가:

```html
<a href="/<example-name>/" class="example-card">
  <div class="example-icon">🔌</div>
  <div class="example-title"><Example Title></div>
  <div class="example-description">
    짧은 설명 첫 줄<br />
    짧은 설명 둘째 줄
  </div>
</a>
```

**예시**: wagmi example의 경우 (124-131번 줄 참고)

```html
<a href="/wagmi/" class="example-card">
  <div class="example-icon">🔌</div>
  <div class="example-title">Wagmi Example</div>
  <div class="example-description">
    Wagmi + React로 구현한<br />
    타입 세이프한 이더리움 앱 예제
  </div>
</a>
```

### 5. Dockerfile 확인 (이미 구성됨)

**파일**: `Dockerfile`

Dockerfile의 92번 줄 근처에 새로운 example 빌드 및 복사 로직을 추가해야 합니다:

```dockerfile
# Build <example-name>
WORKDIR $WORKDIR/examples/<example-name>
RUN echo "VITE_PROJECT_ID=$VITE_PROJECT_ID" > .env && \
    echo "VITE_UNIVERSAL_LINK=$VITE_UNIVERSAL_LINK" >> .env && \
    echo "VITE_ENV_MODE=$VITE_ENV_MODE" >> .env && \
    echo "VITE_METAMASK_PROJECT_ID=$VITE_METAMASK_PROJECT_ID" >> .env
RUN NPM_CONFIG_USERCONFIG=/root/.npmrc pnpm i
RUN pnpm run build

# ... (runner stage에서)
COPY --from=builder --chown=nexus:nexus /nexus/apps/cross-sdk-js/examples/<example-name>/dist /usr/share/nginx/html/<example-name>
```

**참고**: wagmi example은 이미 Dockerfile 60-67, 92번 줄에 포함되어 있습니다.

### 테스트

로컬 빌드 후 확인:

```bash
cd examples/<example-name>
NODE_ENV=production pnpm run build
cd dist
npx serve -p 3000
```

브라우저에서 `http://localhost:3000` 접속하여 `/wagmi/` 경로로 시작하는 asset들이 제대로 로드되는지 확인합니다.

## 문제 해결

- **Nexus 인증 실패**: 토큰/레지스트리 URL 확인 후 워크플로우 로그의 `-/whoami` 응답 코드(200 필요)를 점검합니다.
- **퍼블리시 실패(Dev/Stage)**: 대상 dist-tag(`alpha/beta`)에 실제 버전이 존재하는지 확인하거나 `package_versions` 입력으로 원하는 버전을 명시합니다.
- **버전 롤백**: dev/stage에서 퍼블리시 실패 시 워크플로우가 변경된 버전을 자동 롤백합니다.
- **특정 패키지 제외**: `@to-nexus/sign-client`는 퍼블리시 대상에서 제외됩니다.
