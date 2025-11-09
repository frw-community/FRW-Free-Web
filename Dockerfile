# FRW CLI - Multi-stage Docker build
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY tsconfig.json ./

# Copy workspace packages
COPY packages/ ./packages/
COPY apps/cli/ ./apps/cli/

# Install dependencies
RUN npm ci --workspace=packages --workspace=apps/cli

# Build packages and CLI
RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache tini curl

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/cli/dist/ ./apps/cli/dist/
COPY --from=builder /app/apps/cli/package*.json ./apps/cli/

# Copy root package files
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --workspace=packages --workspace=apps/cli --omit=dev

# Create directories for FRW data
RUN mkdir -p /root/.frw/keys && \
    mkdir -p /data/sites

# Link CLI globally
RUN cd apps/cli && npm link

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD frw --version || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Default command
CMD ["frw", "--help"]
