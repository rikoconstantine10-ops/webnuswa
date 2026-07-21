-- Landing Page jadi fitur default-aktif untuk semua toko (bukan lagi gated-off),
-- termasuk toko yang sudah ada sebelumnya. Admin tetap bisa nonaktifkan per-toko.

ALTER TABLE "Store" ALTER COLUMN "landingPageEnabled" SET DEFAULT true;
UPDATE "Store" SET "landingPageEnabled" = true;
