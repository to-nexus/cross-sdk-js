FROM node:20 AS builder

ARG SERVICE_NAME
ARG WORKDIR
ARG VITE_PROJECT_ID
ARG VITE_UNIVERSAL_LINK
ARG VITE_ENV_MODE
ARG VITE_METAMASK_PROJECT_ID
ARG REGISTRY_URL

ENV SERVICE_NAME=$SERVICE_NAME
ENV WORKDIR=$WORKDIR
ENV VITE_PROJECT_ID=$VITE_PROJECT_ID
ENV VITE_UNIVERSAL_LINK=$VITE_UNIVERSAL_LINK
ENV VITE_ENV_MODE=$VITE_ENV_MODE
ENV VITE_METAMASK_PROJECT_ID=$VITE_METAMASK_PROJECT_ID

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

# 환경별 workspace 버전 설정
RUN --mount=type=secret,id=npmrc,dst=$WORKDIR/.npmrc \
  chmod +x ./scripts/set-workspace-version.sh && \
  REGISTRY_URL=$REGISTRY_URL ./scripts/set-workspace-version.sh "${VITE_ENV_MODE:-prod}"

# Docker 환경에서 의존성 설치 (소스 코드 복사 후)
RUN --mount=type=secret,id=npmrc,dst=$WORKDIR/.npmrc \
  cp $WORKDIR/.npmrc /root/.npmrc.secret && \
  sh -lc 'printf "@to-nexus:registry=%s\n" "$REGISTRY_URL" > /root/.npmrc' && \
  cat /root/.npmrc.secret >> /root/.npmrc && \
  NPM_CONFIG_USERCONFIG=/root/.npmrc pnpm install

# 빌드 실행
RUN pnpm run build

# Build sdk-react
WORKDIR $WORKDIR/examples/sdk-react
RUN echo "VITE_PROJECT_ID=$VITE_PROJECT_ID" > .env && \
    echo "VITE_UNIVERSAL_LINK=$VITE_UNIVERSAL_LINK" >> .env && \
    echo "VITE_ENV_MODE=$VITE_ENV_MODE" >> .env && \
    echo "VITE_METAMASK_PROJECT_ID=$VITE_METAMASK_PROJECT_ID" >> .env
RUN NPM_CONFIG_USERCONFIG=/root/.npmrc pnpm i
RUN pnpm run build

# Build sdk-wagmi
WORKDIR $WORKDIR/examples/sdk-wagmi
RUN echo "VITE_PROJECT_ID=$VITE_PROJECT_ID" > .env && \
    echo "VITE_UNIVERSAL_LINK=$VITE_UNIVERSAL_LINK" >> .env && \
    echo "VITE_ENV_MODE=$VITE_ENV_MODE" >> .env && \
    echo "VITE_METAMASK_PROJECT_ID=$VITE_METAMASK_PROJECT_ID" >> .env
RUN NPM_CONFIG_USERCONFIG=/root/.npmrc pnpm i
RUN pnpm run build

# Build sdk-vanilla  
WORKDIR $WORKDIR/examples/sdk-vanilla
RUN echo "VITE_PROJECT_ID=$VITE_PROJECT_ID" > .env
RUN NPM_CONFIG_USERCONFIG=/root/.npmrc pnpm i
RUN pnpm run build

# Build packages/cdn explicitly
WORKDIR $WORKDIR/packages/cdn
RUN NPM_CONFIG_USERCONFIG=/root/.npmrc pnpm run build

# Update sdk-cdn files from packages/cdn/dist
WORKDIR $WORKDIR/examples/sdk-cdn
RUN rm -f cross-sdk*.js cross-sdk*.js.map index-*.js index-*.js.map index.es-*.js secp256k1-*.js secp256k1-*.js.map w3m-modal-*.js w3m-modal-*.js.map sha2-*.js sha2-*.js.map && \
    cp ../../packages/cdn/dist/*.js . && \
    cp ../../packages/cdn/dist/*.map .

FROM nginx:alpine AS runner

# nginx 사용자 설정
RUN addgroup -S nexus && adduser -S -G nexus nexus

# 각 앱의 빌드 결과를 다른 경로에 복사
COPY --from=builder --chown=nexus:nexus /nexus/apps/cross-sdk-js/examples/sdk-react/dist /usr/share/nginx/html/react
COPY --from=builder --chown=nexus:nexus /nexus/apps/cross-sdk-js/examples/sdk-wagmi/dist /usr/share/nginx/html/wagmi
COPY --from=builder --chown=nexus:nexus /nexus/apps/cross-sdk-js/examples/sdk-vanilla/dist /usr/share/nginx/html/vanilla
COPY --from=builder --chown=nexus:nexus /nexus/apps/cross-sdk-js/examples/sdk-cdn /usr/share/nginx/html/cdn
COPY --from=builder --chown=nexus:nexus /nexus/apps/cross-sdk-js/examples/cocos-creator/build/web-desktop /usr/share/nginx/html/cocos

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
