# Development Dockerfile for frontend
FROM node:18-alpine

WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./
RUN npm ci

# Copy all files
COPY . .

# Expose the dev server port
EXPOSE 3000

# Add a healthcheck to verify the dev server is running
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Start the development server with hot reloading enabled
CMD ["npm", "start", "--", "--host", "0.0.0.0"] 