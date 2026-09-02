# ============================================================
# 🧱 Runtime Image (uses prebuilt Next.js output)
# ============================================================

FROM node:22-alpine@sha256:9385cd9f3001dfc3431e8ead12c43e9e1f87cc1b9b5c6cfd0f73865d405b27c4 AS runtime

# Set working directory
WORKDIR /app

# Copy dependency files (for runtime only)
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy prebuilt Next.js app from CI build artifacts
COPY .next/ .next/
COPY public/ public/
COPY next.config.* ./
COPY package.json ./

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs
USER nextjs

# Expose the Next.js port
EXPOSE 3000

# Verify the docs content dependency is mounted and the server is serving
# traffic before the orchestrator considers this container healthy. Uses
# Node's built-in http client so no extra package (e.g. curl) is required.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/healthz', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the production server
CMD ["npm", "start"]
