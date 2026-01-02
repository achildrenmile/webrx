FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY src ./src
COPY public ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webrx -u 1001 -G nodejs && \
    chown -R webrx:nodejs /app

USER webrx

# Expose port
EXPOSE 3300

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3300

# Start the application
CMD ["node", "src/server.js"]
