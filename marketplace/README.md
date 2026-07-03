# NuswaMarket

Marketplace multi-seller untuk produk **digital** (file download) dan **fisik** (pengiriman kurir),
dengan pembayaran terpusat via [Louvin.dev](https://louvin.dev) (QRIS + Virtual Account) dan
monetisasi **platform fee** per transaksi.

## Stack

- Next.js 15 (App Router, Server Actions) + Tailwind CSS
- Prisma + SQLite (bisa dimigrasi ke PostgreSQL)
- Louvin.dev — payment gateway (QRIS/VA)
- Login OTP via email (fallback console saat dev)

## Fitur MVP

| Peran | Fitur |
|-------|-------|
| Pembeli | Katalog + pencarian + kategori, halaman toko `/s/{slug}`, beli langsung (digital/fisik), bayar QRIS/VA, tracking status order, download produk digital via token aman |
| Seller | Buka toko, CRUD produk (upload file digital), kelola pesanan + input resi, saldo (ledger), request penarikan dana |
| Admin | Approve/suspend toko, proses penarikan dana, atur platform fee, ringkasan GMV & pendapatan fee |

## Alur dana

1. Pembeli bayar via Louvin → dana masuk akun Louvin pemilik platform.
2. Webhook Louvin (`/api/webhooks/louvin`) menandai order lunas.
3. Ledger mencatat: kredit penjualan ke seller − platform fee.
4. Seller request penarikan (saldo di-hold) → admin transfer manual → tandai "Ditransfer".

Saldo seller = `SUM(ledger_entries.amount)` — append-only, tidak pernah di-update langsung.

## Setup

```bash
npm install
cp .env.example .env   # isi LOUVIN_API_KEY, ADMIN_EMAIL, SMTP_*
npx prisma migrate deploy
node prisma/seed.js
npm run dev
```

Tanpa `LOUVIN_API_KEY`, checkout berjalan dalam **mode simulasi** (transaksi tidak nyata) supaya alur bisa diuji.
Tanpa `SMTP_HOST`, kode OTP dicetak ke console server.

Set webhook project Louvin ke: `{APP_URL}/api/webhooks/louvin`.

## Deploy (VPS)

Folder produksi: `/var/www/marketplace`. Build `npm run build`, jalankan dengan PM2,
reverse proxy nginx ke port aplikasi.

## Roadmap

- Fase 2: ongkir real (Biteship), varian produk, harga grosir, analitik seller (traffic, abandoned cart), keranjang multi-item
- Fase 3: custom domain per seller (nginx/Caddy on-demand TLS — kolom `customDomain` sudah ada), notifikasi WA, payout otomatis
