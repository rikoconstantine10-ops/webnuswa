#!/bin/bash
# Run this once on the VPS to set up the daily article generation cron job
# Usage: bash vps-scripts/setup-cron.sh

CRON_LINE="0 19 * * * /bin/bash /home/ubuntu/nuswalab/scripts/generate-and-deploy.sh >> /home/ubuntu/nuswalab/logs/article-gen.log 2>&1"

# Create logs directory
mkdir -p /home/ubuntu/nuswalab/logs

# Add cron if not already present
(crontab -l 2>/dev/null | grep -qF "generate-and-deploy.sh") && {
  echo "Cron job already exists."
} || {
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "Cron job added: runs daily at 19:00 UTC (02:00 WIB)"
}

crontab -l
