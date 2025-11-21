#!/usr/bin/env bash
set -euo pipefail

# Wait for DB (simple check) - optional if you use a sidecar/wait-for
echo "Starting entrypoint..."

# Run migrations (TypeORM CLI) — adjust to your migration tool
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running migrations..."
  npm run migration:run || true
fi

# Seed superadmin if required
if [ "${SEED_SUPERADMIN:-false}" = "true" ]; then
  echo "Seeding superadmin..."
  npm run seed || true
fi

# Start the server (production)
echo "Starting server..."
node dist/main.js
