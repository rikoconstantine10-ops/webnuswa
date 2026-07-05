#!/usr/bin/env bash
# Backup harian: database SQLite + folder uploads. Menyimpan 14 arsip terakhir.
# Pasang di cron VPS, mis: 0 3 * * * /var/www/marketplace/marketplace/scripts/backup.sh
set -euo pipefail

DATA_DIR="${MARKETPLACE_DATA_DIR:-/var/www/marketplace-data}"
BACKUP_DIR="${MARKETPLACE_BACKUP_DIR:-/var/backups/nuswamart}"
KEEP=14
STAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup DB konsisten via .backup (aman saat aplikasi berjalan) bila sqlite3 ada.
if command -v sqlite3 >/dev/null 2>&1 && [ -f "$DATA_DIR/prod.db" ]; then
  sqlite3 "$DATA_DIR/prod.db" ".backup '$BACKUP_DIR/db-$STAMP.sqlite'"
elif [ -f "$DATA_DIR/prod.db" ]; then
  cp "$DATA_DIR/prod.db" "$BACKUP_DIR/db-$STAMP.sqlite"
fi

# Backup uploads (jika ada).
if [ -d "$DATA_DIR/uploads" ]; then
  tar czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$DATA_DIR" uploads
fi

# Rotasi: simpan hanya KEEP arsip terbaru per jenis.
ls -1t "$BACKUP_DIR"/db-*.sqlite 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
ls -1t "$BACKUP_DIR"/uploads-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "backup selesai: $STAMP -> $BACKUP_DIR"
