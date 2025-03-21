#FROM node:20
#
#
##ENV BUILD_PATH="./cmd/main.go"
#ARG SERVICE_NAME
#ENV SERVICE_NAME=$SERVICE_NAME
#ARG WORKDIR
#ENV WORKDIR=$WORKDIR
#ARG VITE_PROJECT_ID
#ENV VITE_PROJECT_ID=$VITE_PROJECT_ID
#
#WORKDIR $WORKDIR
#
#COPY . .
#
#RUN --mount=type=secret,id=github_token \
#  git config --global url."https://$(cat /run/secrets/github_token)@github.com/to-nexus".insteadOf "https://github.com/to-nexus" 
#
#
#RUN corepack enable && corepack prepare pnpm@latest --activate
#RUN pnpm i
#RUN npm run build
#
#
#RUN echo "$VITE_PROJECT_ID" > examples/cross-sdk-react/.env
#
#RUN groupadd --system nexus && useradd --system --gid nexus nexus
#RUN chown -R nexus:nexus /nexus
#USER nexus
#
#
#
#WORKDIR $WORKDIR/examples/cross-sdk-react
#CMD ["npm", "run", "dev"]
#
#
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
RUN pnpm i
RUN npm run build

WORKDIR $WORKDIR/examples/cross-sdk-react
RUN echo "$VITE_PROJECT_ID" > .env
RUN pnpm i
RUN npm run build


FROM node:20-alpine AS runner

# serve 설치 (정적 서버)
RUN npm install -g serve

# 실행 디렉토리 설정
WORKDIR /app

# 빌드 결과만 복사
COPY --from=builder /nexus/apps/cross-sdk-js/examples/cross-sdk-react/dist ./dist

# 정적 파일 호스팅, 포트 3012
CMD ["serve", "-s", "dist", "-l", "3012"]
