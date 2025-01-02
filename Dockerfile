# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies (dev + prod)
COPY package*.json ./
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the Next.js application for production
RUN npm run build

# Production Stage
FROM node:18-alpine AS runner

WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Copy the package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Expose the port for the app
EXPOSE 3000

# Start the Next.js application in production
CMD ["npm", "start"]
