#!/bin/sh
set -eu

# Railway Postgres sets DATABASE_URL like:
# postgres://... or postgresql://...
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required (Railway Postgres). Set it in Railway Variables."
  exit 1
fi
case "$DATABASE_URL" in
  postgres://*|postgresql://*)
    ;;
  *)
    echo "DATABASE_URL must be a Postgres URL (postgres:// or postgresql://)."
    exit 1
    ;;
esac

prisma db push --skip-generate
node src/server.js

