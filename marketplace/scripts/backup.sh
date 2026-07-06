#!/usr/bin/env bash
# Backup harian: database PostgreSQL (pg_dump) + folder uploads. Simpan 14 arsip terakhir.
# Pasang di cron VPS, mis: 0 3 * * * /var/www/marketplace/marketplace/scripts/backup.sh
# Membaca DATABASE_URL dari .env aplikasi (postgresql://...).
set -euo pipefail

APP_DIR="${MARKETPLACE_APP_DIR:-/var/www/marketplace/marketplace}"
DATA_DIR="${MARKETPLACE_DATA_DIR:-/var/www/marketplace-data}"
BACKUP_DIR="${MARKETPLACE_BACKUP_DIR:-/var/backups/nuswamart}"
KEEP=14
STAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

# Ambil DATABASE_URL dari .env aplikasi bila belum diset di environment.
if [ -z "${DATABASE_URL:-}" ] && [ -f "$APP_DIR/.env" ]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | head -1 | sed -E 's/^DATABASE_URL=//; s/^"//; s/"$//')
fi

# Backup PostgreSQL via pg_dump (custom format, terkompresi) bila URL postgres.
if [ -n "${DATABASE_URL:-}" ] && printf '%s' "$DATABASE_URL" | grep -q '^postgres'; then
  pg_dump --dbname="$DATABASE_URL" --format=custom --file="$BACKUP_DIR/db-$STAMP.dump"
elif command -v sqlite3 >/dev/null 2>&1 && [ -f "$DATA_DIR/prod.db" ]; then
  # Fallback legacy SQLite.
  sqlite3 "$DATA_DIR/prod.db" ".backup '$BACKUP_DIR/db-$STAMP.sqlite'"
fi

# Backup uploads (jika ada).
if [ -d "$DATA_DIR/uploads" ]; then
  tar czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$DATA_DIR" uploads
fi

# Rotasi: simpan hanya KEEP arsip terbaru per jenis.
ls -1t "$BACKUP_DIR"/db-*.dump 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
ls -1t "$BACKUP_DIR"/db-*.sqlite 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
ls -1t "$BACKUP_DIR"/uploads-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "backup selesai: $STAMP -> $BACKUP_DIR"
