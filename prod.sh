#!/bin/bash

# Production mode startup script for LLM LoreSmith

echo "Starting LLM LoreSmith in production mode..."

# Ensure Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Start the containers
docker compose up -d

echo ""
echo "Production environment is starting..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo ""
echo "To view logs, run: docker compose logs -f"
echo "To stop, run: docker compose down" 