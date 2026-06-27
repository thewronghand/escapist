FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/client/package.json ./packages/client/
COPY packages/server/package.json ./packages/server/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY packages/client ./packages/client
COPY packages/server ./packages/server

# shared 타입 빌드 → client 빌드 → server 타입 빌드
RUN pnpm build


FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

RUN pnpm install --frozen-lockfile --filter @escapist/server --filter @escapist/shared

COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/server/src ./packages/server/src
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/client/dist ./packages/client/dist

ENV NODE_ENV=production
ENV PORT=8888

EXPOSE 8888

CMD ["node", "--import", "tsx/esm", "packages/server/src/index.ts"]
