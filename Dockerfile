FROM node:20 AS builder

ARG SERVICE_NAME
ARG WORKDIR
ARG VITE_PROJECT_ID
ARG VITE_ENV_MODE

ENV SERVICE_NAME=$SERVICE_NAME
ENV WORKDIR=$WORKDIR
ENV VITE_PROJECT_ID=$VITE_PROJECT_ID
ENV VITE_ENV_MODE=$VITE_ENV_MODE

WORKDIR $WORKDIR

# 먼저 package.json과 pnpm-lock.yaml만 복사해서 의존성 설치
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY examples/ ./examples/

# GitHub Token으로 private 레포 접근 설정
RUN --mount=type=secret,id=github_token \
  git config --global url."https://$(cat /run/secrets/github_token)@github.com/to-nexus".insteadOf "https://github.com/to-nexus"

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN --mount=type=secret,id=npmrc,dst=$WORKDIR/.npmrc \
  echo ".npmrc mounted"

# 소스 코드 복사
COPY . .

# 환경별 workspace 버전 설정 및 검증
RUN --mount=type=secret,id=npmrc,dst=$WORKDIR/.npmrc \
  chmod +x ./scripts/resolve-sample-versions.sh && \
  if [ "${VITE_ENV_MODE}" = "stage" ]; then \
    echo "Setting workspace version to beta for stage environment..." && \
    REGISTRY_URL=$(cat .npmrc | grep "@to-nexus:registry" | cut -d'=' -f2) && \
    BETA_CHECK=$(curl -s "${REGISTRY_URL}%40to-nexus%2Fsdk" 2>/dev/null | grep -o '"beta":"[^"]*"' || echo "") && \
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const baseVersion = pkg.version.replace(/-alpha.*$/, '').replace(/-beta.*$/, '');
      const betaCheck = process.env.BETA_CHECK;
      
      if (betaCheck && betaCheck.includes('beta')) {
        const betaVersion = baseVersion + '-beta';
        console.log('✅ Beta version exists in registry, using:', betaVersion);
        pkg.version = betaVersion;
      } else {
        console.log('⚠️  Beta version not found, using stable:', baseVersion);
        pkg.version = baseVersion;
      }
      
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
      console.log('Workspace version set to:', pkg.version);
    " BETA_CHECK="$BETA_CHECK"; \
  elif [ "${VITE_ENV_MODE}" = "dev" ]; then \
    echo "Using alpha version for dev environment"; \
  elif [ "${VITE_ENV_MODE}" = "prod" ]; then \
    echo "Setting stable version for production..." && \
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      pkg.version = pkg.version.replace(/-alpha.*$/, '').replace(/-beta.*$/, '');
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
      console.log('Workspace version updated to:', pkg.version);
    "; \
  fi

# Docker 환경에서 의존성 설치 (소스 코드 복사 후)
RUN --mount=type=secret,id=npmrc,dst=$WORKDIR/.npmrc \
  pnpm install

# 빌드 실행
RUN pnpm run build

# Build sdk-react
WORKDIR $WORKDIR/examples/sdk-react
RUN echo "VITE_PROJECT_ID=$VITE_PROJECT_ID" > .env
RUN pnpm i
RUN pnpm run build

# Build sdk-vanilla  
WORKDIR $WORKDIR/examples/sdk-vanilla
RUN echo "VITE_PROJECT_ID=$VITE_PROJECT_ID" > .env
RUN pnpm i
RUN pnpm run build

# sdk-cdn은 빌드가 필요없으므로 그대로 사용

FROM nginx:alpine AS runner

# nginx 사용자 설정
RUN addgroup -S nexus && adduser -S -G nexus nexus

# 각 앱의 빌드 결과를 다른 경로에 복사
COPY --from=builder --chown=nexus:nexus /nexus/apps/cross-sdk-js/examples/sdk-react/dist /usr/share/nginx/html/react
COPY --from=builder --chown=nexus:nexus /nexus/apps/cross-sdk-js/examples/sdk-vanilla/dist /usr/share/nginx/html/vanilla
COPY --from=builder --chown=nexus:nexus /nexus/apps/cross-sdk-js/examples/sdk-cdn /usr/share/nginx/html/cdn

# 랜딩 페이지 복사
COPY --from=builder --chown=nexus:nexus /nexus/apps/cross-sdk-js/examples/index.html /usr/share/nginx/html/index.html

# nginx 설정 복사
COPY --chown=nexus:nexus nginx.conf /etc/nginx/nginx.conf

# 권한 설정
RUN chmod -R a-w /usr/share/nginx/html
RUN chown -R nexus:nexus /var/cache/nginx /var/run /var/log/nginx

# USER nexus

# 포트 8080에서 서빙 (non-root 사용자는 1024 이상 포트 사용)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
