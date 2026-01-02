#!/bin/bash

# WebRX Deploy Script
# Usage: ./deploy.sh

set -e

echo "Pulling latest changes..."
git pull

echo "Rebuilding and restarting container..."
docker compose down
docker compose up -d --build

echo "Waiting for container to be healthy..."
sleep 5

echo "Container status:"
docker compose ps

echo "Deploy complete!"
