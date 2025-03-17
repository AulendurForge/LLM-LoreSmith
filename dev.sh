#!/bin/bash

# Development mode startup script for LLM LoreSmith

echo "Starting LLM LoreSmith in development mode..."

# Ensure Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Start the dev containers
docker compose -f docker-compose.dev.yml up -d

echo ""
echo "Development environment is starting..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo ""
echo "To view logs, run: docker compose -f docker-compose.dev.yml logs -f"
echo "To stop, run: docker compose -f docker-compose.dev.yml down"
echo ""
echo "Happy coding!" 