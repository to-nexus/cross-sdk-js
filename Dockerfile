FROM node:20 AS builder

ARG SERVICE_NAME
ARG WORKDIR
ARG VITE_PROJECT_ID

ENV SERVICE_NAME=$SERVICE_NAME
ENV WORKDIR=$WORKDIR
ENV VITE_PROJECT_ID=$VITE_PROJECT_ID

WORKDIR $WORKDIR

# 먼저 package.json과 pnpm-lock.yaml만 복사해서 의존성 설치
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY examples/*/package.json ./examples/

# GitHub Token으로 private 레포 접근 설정
RUN --mount=type=secret,id=github_token \
  git config --global url."https://$(cat /run/secrets/github_token)@github.com/to-nexus".insteadOf "https://github.com/to-nexus"

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN --mount=type=secret,id=npmrc,dst=$WORKDIR/.npmrc \
  echo ".npmrc mounted"

# Docker 환경에서 새로 의존성 설치
RUN pnpm install --no-frozen-lockfile

# 소스 코드 복사
COPY . .
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

# nginx 설정 복사
COPY --chown=nexus:nexus nginx.conf /etc/nginx/nginx.conf

# 권한 설정
RUN chmod -R a-w /usr/share/nginx/html
RUN chown -R nexus:nexus /var/cache/nginx /var/run /var/log/nginx

USER nexus

# 포트 8080에서 서빙 (non-root 사용자는 1024 이상 포트 사용)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
