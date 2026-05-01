#!/bin/sh
set -eu

# Prisma SQLite URLs must start with `file:`.
# On Railway, users sometimes set DATABASE_URL to a path like "./dev.db".
case "${DATABASE_URL:-}" in
  file:*)
    ;;
  "")
    export DATABASE_URL="file:./dev.db"
    ;;
  *)
    # If it's not a SQLite URL, fall back to local SQLite to keep the service up.
    # (If you intend to use Postgres on Railway, change prisma/schema.prisma provider/url accordingly.)
    export DATABASE_URL="file:./dev.db"
    ;;
esac

prisma db push --skip-generate
node src/server.js

