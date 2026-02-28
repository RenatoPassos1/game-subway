# ============================================================
# Click Win Frontend - Multi-stage Dockerfile
# ============================================================

# ---------- Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json* ./

# Copy frontend package
COPY packages/frontend/package.json packages/frontend/

# Install dependencies
RUN npm ci --workspace=packages/frontend

# Copy frontend source and public assets
COPY packages/frontend/src/ packages/frontend/src/
COPY packages/frontend/public/ packages/frontend/public/

# Copy Next.js / build config files if they exist
COPY packages/frontend/next.config.* packages/frontend/ 2>/dev/null || true
COPY packages/frontend/tailwind.config.* packages/frontend/ 2>/dev/null || true
COPY packages/frontend/postcss.config.* packages/frontend/ 2>/dev/null || true
COPY packages/frontend/tsconfig.json packages/frontend/ 2>/dev/null || true

# Build the frontend (static export)
RUN npm run build --workspace=packages/frontend

# ---------- Production Stage ----------
FROM node:20-slim AS production

WORKDIR /app

ENV NODE_ENV=production

# Install a lightweight static file server
RUN npm install -g serve@14

# Copy the static build output
COPY --from=builder /app/packages/frontend/out/ /app/out/

# Run as non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
USER appuser

EXPOSE 3000

CMD ["serve", "-s", "out", "-l", "3000"]
