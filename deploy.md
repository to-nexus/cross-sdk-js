### 배포 개요

- **환경**: dev, stage, prod
- **브랜치 규칙**:
  - `release/*` 브랜치: dev, stage 배포만 허용 (manual 트리거)
  - `main` 브랜치: prod 배포만 허용 (manual 트리거, main 머지 시 자동 퍼블리시/태깅 포함)
- **배포 대상 서비스**:
  - SDK Sample Page: Docker → ECR 푸시(이미지 등록만 수행)
  - SDK Package Publish: Nexus(NPM) 퍼블리시
  - CDN Publish: S3 업로드 → CloudFront 캐시 무효화

### 도메인/인프라

- Dev: `dev-cross-sdk-js.crosstoken.io`
- Stage: `stage-cross-sdk-js.crosstoken.io` (신규 권장)
- Prod: `cross-sdk-js.crosstoken.io` (신규 권장)
- Nginx 설정은 `server_name *.crosstoken.io`로 와일드카드 수용 가능. DNS/ALB/CloudFront 라우팅만 조정하면 무리 없이 전환 가능

### 트리거 및 권한 가드

- 모든 배포는 `workflow_dispatch`(수동 실행) 입력값으로 `environment(dev|stage|prod)`와 `services(all|sample-page|package-publish|cdn-publish)` 선택
- 가드 로직:
  - `startsWith(github.ref, 'refs/heads/release/')` → `environment`는 `dev|stage`만 허용
  - `github.ref == 'refs/heads/main'` → `environment`는 `prod`만 허용

### Changeset 전략

- 모노레포 버전 일관성, 자동 버전 범프, 릴리스 노트, 퍼블리시 파이프라인을 위해 Changeset 사용이 필수
- 현재 레포는 다음 구성을 이미 포함
  - `.changeset/config.json`의 `baseBranch: main`, `linked` 패키지 설정
  - `scripts/auto-changeset.js` 및 `RELEASE_PROCESS.md`의 `version.json` 기반 자동 changeset 프로세스
  - `.github/workflows/release.yml`의 auto-changeset 스텝

### version.json 관리 가이드 (선택)

- 역할: 릴리스 메타데이터의 단일 소스. 자동 changeset 생성 스크립트(`scripts/auto-changeset.js`)가 이 파일을 읽어 `.changeset/*.md`를 생성하고, Changesets가 이를 기반으로 버전 범프/퍼블리시 수행
- 선택 사항: `version.json`이 없더라도 동작합니다. 없을 경우 스크립트가 `release/vX.Y.Z` 브랜치명에서 버전을 파싱하고, 릴리스 타입은 `RELEASE_TYPE`(env) 또는 기본 `minor`로 처리하며, 패키지 목록은 `.changeset/config.json`의 `linked` 그룹을 사용합니다.
- 필드:
  - `version`: 목표 릴리스 버전(예: `1.17.0`)
  - `releaseType`: `major | minor | patch`
  - `releaseTitle`: 릴리스 제목
  - `releaseNotes`: 요약 노트(선택)
  - `packages`: 각 패키지의 목표 버전 맵
  - `changelog`: 항목별 변경 기록 배열(`type`, `message`, `breaking`)
- 언제 편집하나:
  - (선택) 더 풍부한 릴리스 노트/개별 패키지 버전 지정이 필요할 때만 업데이트
  - 기본적으로는 `release/vX.Y.Z` 브랜치명만으로도 자동 처리됩니다
- 절차:
  1) `release/vX.Y.Z` 브랜치 푸시(필수) → 워크플로우가 `auto-changeset` → `changeset:pre` → `changeset:version` 실행 및 커밋/태깅 자동 수행
  2) (옵션) `version.json`을 함께 커밋하면 해당 내용(릴리스 타입/노트/패키지 맵)이 반영됨
  3) 필요 시 dev/stage 수동 배포(workflow_dispatch) → dist-tag(alpha/beta) 퍼블리시 + 프리릴리스 태그 자동 생성
  4) main 머지 시 워크플로우가 `changeset:pre:exit` → 안정 버전 확정 → latest 퍼블리시 + 릴리스 태그 생성

#### 권장 적용 방식(Pre-release 모드)

### Changeset 실행 트리거 정책

- `release/*` 브랜치에서 Changeset 생성은 자동으로 돌지 않습니다. 수동 실행만 허용합니다.
- 실행 방법: GitHub Actions → Release Management → Run workflow → `run_auto_changeset=true`로 실행
- 권장 입력값
  - `environment`: dev 또는 stage (pre 버전 증가 검증 용도)
  - `run_auto_changeset`: true (체크 필수)
  - main(prod) 릴리스는 Release Management 워크플로우의 나머지 단계가 수행합니다.

1) release/* 브랜치 생성 시(예: `release/v1.17.0`)
- Changeset Pre 모드 진입 및 pre 버전 범프
  - `pnpm changeset:pre` (enter)
  - `pnpm run auto-changeset` (version.json → changeset 생성)
  - `pnpm changeset:version` (예: 1.17.0-rc.0)
  - 커밋/푸시

2) dev / stage 배포(수시)
- `pnpm changeset:version`으로 rc.번호 증가(예: rc.1, rc.2)
- 배포/퍼블리시 시 dist-tag 사용
  - dev → `pnpm publish:alpha` (또는 canary)
  - stage → `pnpm publish:beta`
- 배포 성공 후 릴리스 태그 자동 생성(아래 자동 태깅 참조)

3) main 머지(prod)
- `pnpm changeset:pre:exit`로 pre 모드 종료
- `pnpm changeset:version`으로 안정 버전 확정(예: 1.17.0)
- `pnpm publish:latest` 퍼블리시
- 배포 성공 후 `release/v1.17.0` 태그 자동 생성/푸시

### 자동 릴리스 태깅 정책

- 개발자가 태그를 수동으로 만들 필요 없음. 워크플로우가 자동으로 태깅 처리
- 태그 규칙:
  - dev(stage 전) 배포: `release/v{VERSION}-dev.{RUN}` (또는 `-rc.{RUN}`)
  - stage 배포: `release/v{VERSION}-rc.{RUN}`
  - main(prod) 머지 후: `release/v{VERSION}`
- 표준 구현(예시 스텝, main 퍼블리시 이후):

```yaml
- name: Create and push release tag
  if: github.ref == 'refs/heads/main'
  run: |
    VERSION=$(node -e "const fs=require('fs'); const p=fs.existsSync('version.json')?JSON.parse(fs.readFileSync('version.json','utf8')).version:null; console.log(p||require('./package.json').version)")
    TAG="release/v${VERSION}"
    if git rev-parse "$TAG" >/dev/null 2>&1; then
      echo "Tag $TAG already exists, skipping"
    else
      git config user.name "github-actions[bot]"
      git config user.email "github-actions[bot]@users.noreply.github.com"
      git tag -a "$TAG" -m "Release $TAG"
      git push origin "$TAG"
    fi
```

- release/* 브랜치의 dev/stage 배포에서도 유사 방식으로 태그를 자동 생성(환경 접미사 포함)해 커밋에 부착

### 서비스별 배포 디테일

#### 1) SDK Sample Page
- Docker Buildx → ECR 푸시(배포 미포함)
- 빌드 인자/환경:
  - `VITE_PROJECT_ID`: GitHub Secrets
  - `VITE_ENV_MODE`: dev|stage|prod

#### 2) SDK Package Publish
- Nexus 레지스트리 인증을 `.npmrc`로 주입
- dist-tag 정책:
  - dev → `--tag alpha` (또는 `canary`)
  - stage → `--tag beta`
  - prod → `latest`
- Changeset Pre 모드 기반 버전 관리로 재배포 충돌 방지(프리릴리스 rc/beta 버전 → main에서 stable 확정)

#### 3) CDN Publish
- 환경별 S3/CloudFront 분리 권장
  - dev: `s3://{dev-bucket}/cross-sdk/dev/{VERSION}/`
  - stage: `s3://{stage-bucket}/cross-sdk/stage/{VERSION}/`
  - prod: `s3://{prod-bucket}/cross-sdk/{VERSION}/` 및 `latest/` 동기화
- 업로드 후 CloudFront 경로 무효화(`/cross-sdk/{VERSION}/*`, 필요 시 `/cross-sdk/latest/*`)
- 버전은 기본적으로 루트 `version.json` 또는 `package.json`에서 추출

### 개발자 오퍼레이션(요약)

- 릴리스 준비: `version.json` 업데이트 후 `release/vX.Y.Z` 브랜치 생성/푸시
- 배포 트리거: GitHub Actions → `workflow_dispatch` 실행(환경/서비스 선택)
- 태깅: 자동 처리(수동 태깅 불필요)

### 체크리스트

- [ ] `release/*`에서 dev/stage만, `main`에서 prod만 실행되는지 가드 확인
- [ ] Changeset Pre 모드가 release/*에서 정상 작동하는지 확인
- [ ] main 머지 시 Pre 종료 → Stable 퍼블리시/태깅 자동화 확인
- [ ] 모든 배포 Job 마지막에 릴리스 태그 자동 생성/푸시 확인
- [ ] 환경별 버킷/도메인 라우팅/권한(AWS, Nexus) 점검


