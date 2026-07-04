# Deploy NuswaMart (VPS Nuswalab)

Ringkasan infrastruktur produksi agar mudah dipulihkan bila VPS di-setup ulang.

## Topologi

```
Pengunjung ──HTTPS──> Cloudflare (edge cert, CDN, DDoS)
                          │  SSL mode: Full (strict)
                          ▼
                   VPS 43.159.60.143
                     nginx :80/:443 (Let's Encrypt)
                          │  proxy_pass
                          ├─> Next.js app  (pm2: marketplace)  :3005
                          └─> wa-service    (pm2: wa-service)   :3006  (127.0.0.1 only)
```

- **App**: `/var/www/marketplace/marketplace` (Next.js 15 + Prisma + SQLite)
- **Data persist** (di luar folder kode, aman saat redeploy): `/var/www/marketplace-data/`
  - `prod.db` — database SQLite
  - `uploads/` — file produk digital + `images/` (foto produk/toko)
  - `wa-sessions/` — kredensial sesi WhatsApp per toko

## Domain & hostname

| Hostname | Perilaku |
|----------|----------|
| `nuswamart.com`, `www` | Storefront + login |
| `admin.nuswamart.com` | root `/` → 302 `/admin` |
| `seller.nuswamart.com` | root `/` → 302 `/dashboard` |

Semua hostname proxy ke app yang sama (`:3005`); redirect diatur di nginx.
Sesi login berlaku lintas-subdomain via `COOKIE_DOMAIN=.nuswamart.com`.

## nginx

- Config: `/etc/nginx/sites-available/marketplace` (symlink di `sites-enabled/`)
- Snippet proxy: `/etc/nginx/snippets/mp-proxy.conf`
- Tiap server block punya `listen 80` + `listen [::]:80` (IPv4 & IPv6).
- `client_max_body_size 110m` (upload produk digital sampai 100MB).
- SSL dikelola certbot (`certbot --nginx`), auto-renew via systemd timer.

Terbitkan / perbarui sertifikat:
```bash
certbot --nginx --no-redirect \
  -d nuswamart.com -d www.nuswamart.com \
  -d admin.nuswamart.com -d seller.nuswamart.com
```
`--no-redirect` penting: biarkan Cloudflare yang urus http→https (hindari redirect loop).

## Cloudflare (dashboard)

- SSL/TLS mode: **Full (strict)** (origin punya cert Let's Encrypt valid).
- Edge Certificates → **Always Use HTTPS: ON**.
- DNS: A record `@`, `www`, `admin`, `seller` → `43.159.60.143` (proxied / orange cloud).

## Environment (`.env`)

Kunci penting (lihat `.env.example` untuk daftar lengkap):
```
DATABASE_URL="file:/var/www/marketplace-data/prod.db"
APP_URL="https://nuswamart.com"
COOKIE_DOMAIN=".nuswamart.com"
UPLOAD_DIR="/var/www/marketplace-data/uploads"
ADMIN_EMAIL="..."               # email ini otomatis jadi ADMIN
LOUVIN_API_KEY="lv_..."         # payment gateway
WEBHOOK_SECRET="..."            # dicek pada /api/webhooks/louvin?key=...
WA_SERVICE_URL="http://127.0.0.1:3006"
WA_SERVICE_KEY="..."            # auth ke wa-service
CRON_SECRET="..."               # dicek pada /api/cron/reminders?key=...
SMTP_HOST=... SMTP_USER=... SMTP_PASS=...   # notifikasi email & OTP
```

Louvin dashboard → Webhook URL:
`https://nuswamart.com/api/webhooks/louvin?key=<WEBHOOK_SECRET>`

## Proses (pm2)

```bash
# App
cd /var/www/marketplace/marketplace
pm2 start npm --name marketplace -- start -- -p 3005

# WhatsApp gateway
WA_SERVICE_KEY=<key> WA_PORT=3006 WA_SESSIONS_DIR=/var/www/marketplace-data/wa-sessions \
  pm2 start wa-service/index.js --name wa-service

pm2 save && pm2 startup   # agar hidup lagi setelah reboot
```

## Cron

Reminder pembayaran otomatis (WA), tiap 15 menit:
```
*/15 * * * * curl -s 'http://localhost:3005/api/cron/reminders?key=<CRON_SECRET>' >/dev/null
```

## Deploy ulang (setelah push ke branch)

```bash
cd /var/www/marketplace && git pull
cd marketplace
npx prisma migrate deploy      # jika ada migrasi baru
npx prisma generate
NODE_OPTIONS=--max-old-space-size=1024 npm run build
pm2 restart marketplace --update-env
```
RAM VPS 2GB: batasi memori build dengan `--max-old-space-size=1024` agar tidak OOM.
