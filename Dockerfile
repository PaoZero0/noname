FROM node:lts AS builder

RUN npm install -g pnpm@9
WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build:full

FROM node:lts-alpine AS runner

RUN npm install -g pnpm@9
WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./
COPY scripts /app/scripts

RUN cp /app/scripts/server.js /app/scripts/server.cjs

EXPOSE 8089
EXPOSE 8080

CMD ["sh", "-c", "node /app/noname-server.cjs --server & node /app/scripts/server.cjs & wait -n"]
