#!/bin/bash

# Restart development environment with clean state

echo "🔄 Restarting development environment..."

# Stop and remove containers
docker compose -f docker-compose.dev.yml down

# Remove any dangling volumes (optional)
# docker volume prune -f

# Rebuild and start development environment
docker compose -f docker-compose.dev.yml up -d --build frontend

# Check what port Vite is actually running on
sleep 3
VITE_PORT=$(docker logs llm-loresmith-frontend-1 2>&1 | grep -oP 'Local:.*?http://localhost:\K\d+' || echo "3000")

echo ""
echo "✅ Development environment restarted!"
echo "🌐 Frontend: http://localhost:${VITE_PORT}"
echo "⚠️ Important: Clear your browser cache or use incognito mode"
echo ""
echo "To see logs: docker compose -f docker-compose.dev.yml logs -f frontend"
echo "" 