# Build stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (if applicable)
# Uncomment if you're using a build step (like TypeScript)
# RUN npm run build

# Production stage
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy only necessary files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder (or full app if no build step)
COPY --from=builder /app ./

# Expose port (match your .env or use default)
EXPOSE 5000

# Start the application (adjust path as needed)
CMD ["node", "server.js"]

