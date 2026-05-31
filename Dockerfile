# ============================================================
# 🧱 Runtime Image (uses prebuilt Next.js output)
# ============================================================

FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS runtime

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

# Start the production server
CMD ["npm", "start"]
