FROM node:20 AS builder


ARG SERVICE_NAME
ARG WORKDIR
ARG VITE_PROJECT_ID

ENV SERVICE_NAME=$SERVICE_NAME
ENV WORKDIR=$WORKDIR
ENV VITE_PROJECT_ID=$VITE_PROJECT_ID

WORKDIR $WORKDIR

COPY . .

# GitHub Token으로 private 레포 접근 설정
RUN --mount=type=secret,id=github_token \
  git config --global url."https://$(cat /run/secrets/github_token)@github.com/to-nexus".insteadOf "https://github.com/to-nexus"

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN --mount=type=secret,id=npmrc,dst=$WORKDIR/.npmrc \
  echo ".npmrc mounted"
RUN pnpm i
RUN npm run build

WORKDIR $WORKDIR/examples/sdk-react
RUN echo "$VITE_PROJECT_ID" > .env
RUN pnpm i
RUN npm run build
RUN pwd 
RUN ls -alh

FROM node:20-alpine AS runner

# serve 설치 (정적 서버)
RUN npm install -g serve

# 실행 디렉토리 설정
WORKDIR /app

# 빌드 결과만 복사
COPY --from=builder /nexus/apps/cross-sdk-js/examples/sdk-react/dist ./dist

# 정적 파일 호스팅, 포트 3012
CMD ["serve", "-s", "dist", "-l", "3012"]
