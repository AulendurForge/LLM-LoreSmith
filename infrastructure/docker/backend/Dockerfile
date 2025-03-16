# Stage 1: Node.js base
FROM node:18-alpine AS node_base

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy Node.js source code
COPY . .

# Stage 2: Python build environment
FROM python:3.10-slim AS python_build

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Final small image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install only runtime dependencies for Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy Node.js files from node_base
COPY --from=node_base /app /app

# Copy Python dependencies from the build stage
COPY --from=python_build /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=python_build /usr/local/bin /usr/local/bin

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
