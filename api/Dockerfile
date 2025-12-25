# Multi-stage Dockerfile for tyOS API (Bun + monorepo)
# This builds the API with awareness of workspace packages (@tyos/db, @tyos/image-utils)

FROM oven/bun:1.3 AS base
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps

# Copy root package.json and lockfile
COPY bun.lock package.json ./

# Copy all workspace directories (needed for workspace resolution)
COPY packages/ ./packages/
COPY api/ ./api/
COPY admin/ ./admin/
COPY web/ ./web/

# Install all dependencies (including workspace packages)
RUN bun install --frozen-lockfile

# Stage 2: Production
FROM base AS production

# Copy everything from deps (includes node_modules and all source)
COPY --from=deps /app ./

# Set working directory to API
WORKDIR /app/api

# Expose port (Fly.io will map this to 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:8080/health').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Run the API server
CMD ["bun", "src/index.ts"]
