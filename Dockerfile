# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Set node to production mode
ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]