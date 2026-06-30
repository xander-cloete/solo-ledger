#!/bin/bash
# Deploy Solo Ledger on the home server.
# Run this from the repo checkout at ~/docker/solo-ledger after every release.
# It pulls the latest code, rebuilds the static site inside Docker, and swaps
# the running container — mirroring deploy-padeltrack.sh.
set -e

cd ~/docker/solo-ledger
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
echo "Solo Ledger deployed at $(date)"
