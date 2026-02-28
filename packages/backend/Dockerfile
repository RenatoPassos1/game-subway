# ============================================================
# Click Win Backend - Multi-stage Dockerfile
# ============================================================

# ---------- Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./

# Copy shared package
COPY shared/package.json shared/
COPY shared/tsconfig.json shared/
COPY shared/src/ shared/src/

# Copy backend package
COPY packages/backend/package.json packages/backend/
COPY packages/backend/tsconfig.json packages/backend/

# Install all dependencies (including devDependencies for build)
RUN npm ci --workspace=shared --workspace=packages/backend

# Copy backend source
COPY packages/backend/src/ packages/backend/src/

# Build shared first, then backend
RUN npm run build --workspace=shared
RUN npm run build --workspace=packages/backend

# ---------- Production Stage ----------
FROM node:20-slim AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy workspace root files
COPY package.json package-lock.json* ./

# Copy shared package (built)
COPY --from=builder /app/shared/package.json shared/
COPY --from=builder /app/shared/dist/ shared/dist/

# Copy backend package (built)
COPY --from=builder /app/packages/backend/package.json packages/backend/
COPY --from=builder /app/packages/backend/dist/ packages/backend/dist/

# Copy migrations
COPY packages/backend/migrations/ packages/backend/migrations/

# Install production dependencies only
RUN npm ci --workspace=shared --workspace=packages/backend --omit=dev

# Run as non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
USER appuser

EXPOSE 3000

CMD ["node", "packages/backend/dist/server.js"]
