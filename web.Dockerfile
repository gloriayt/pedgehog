FROM node:20-slim AS build
RUN npm install -g pnpm@9
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY app/package.json ./app/
COPY shared/package.json ./shared/
RUN pnpm install --frozen-lockfile
COPY shared ./shared
COPY app ./app
RUN pnpm --filter @pedgehog/shared run build
RUN pnpm --filter app run build

FROM caddy:2
COPY --from=build /repo/app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
