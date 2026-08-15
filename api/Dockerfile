# ---- Build stage ----
FROM node:20-slim AS build

RUN npm install -g pnpm@9

WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY api/package.json ./api/
COPY shared/package.json ./shared/

RUN pnpm install --frozen-lockfile

COPY shared ./shared
COPY api ./api

RUN pnpm --filter @pedgehog/shared run build
RUN pnpm --filter api run build

# ---- Production stage ----
FROM node:20-slim

WORKDIR /repo

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/api/node_modules ./api/node_modules
COPY --from=build /repo/shared/node_modules ./shared/node_modules
COPY --from=build /repo/api/dist ./api/dist
COPY --from=build /repo/api/package.json ./api/package.json
COPY --from=build /repo/shared/dist ./shared/dist
COPY --from=build /repo/shared/package.json ./shared/package.json

WORKDIR /repo/api
EXPOSE 3000
CMD ["node", "dist/server.js"]