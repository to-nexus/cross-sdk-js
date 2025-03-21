FROM node:20


#ENV BUILD_PATH="./cmd/main.go"
ARG SERVICE_NAME
ENV SERVICE_NAME=$SERVICE_NAME
ARG WORKDIR
ENV WORKDIR=$WORKDIR
ARG VITE_PROJECT_ID
ENV VITE_PROJECT_ID=$VITE_PROJECT_ID

WORKDIR $WORKDIR

COPY . .

RUN --mount=type=secret,id=github_token \
  git config --global url."https://$(cat /run/secrets/github_token)@github.com/to-nexus".insteadOf "https://github.com/to-nexus" 


RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm i
RUN npm run build


RUN echo "$VITE_PROJECT_ID" > examples/cross-sdk-react/.env

RUN groupadd --system nexus && useradd --system --gid nexus nexus
RUN chown -R nexus:nexus /nexus
USER nexus



WORKDIR $WORKDIR/examples/cross-sdk-react
CMD ["npm", "run", "dev"]
