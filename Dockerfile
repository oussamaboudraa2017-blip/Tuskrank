# ============================================================
# Tuskrank — root Dockerfile (multi-stage)
# ------------------------------------------------------------
# Builds the API service. Run from repo root:
#   docker build -f Dockerfile .
# ============================================================

FROM node:20-alpine AS build
ENV CI=true
WORKDIR /app

COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci --only=production --ignore-scripts && \
    cp -r node_modules /prod_node_modules && \
    npm ci --ignore-scripts

COPY apps/api/tsconfig*.json ./
COPY apps/api/src ./src
RUN npm run build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /prod_node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

USER node

EXPOSE 4000

ENV APP_PORT=4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${APP_PORT}/api/v1/health/live || exit 1

CMD ["node", "dist/main.js"]
