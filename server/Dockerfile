# Use lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY src/ ./src/
COPY seed/ ./seed/

# Expose default backend port
EXPOSE 5000

# Run the server
CMD ["node", "src/server.js"]
