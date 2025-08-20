# Use the official Node.js 18 image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Create data directory and set permissions for the entire app
RUN mkdir -p /app/data/features && \
    mkdir -p /app/data/events && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Build the Next.js application
RUN pnpm build

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/features || exit 1

# Start the application with hostname 0.0.0.0 for Docker
CMD ["pnpm", "start", "--hostname", "0.0.0.0"]
