-- AlterTable
ALTER TABLE "Store"
  ADD COLUMN "aiImageEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "aiVideoEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "aiCaptionEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "aiChatEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: toko yang sudah di-approve admin (aiGenerationEnabled) pertahankan akses
-- ke semua fitur granular yang baru, supaya tidak mendadak kehilangan akses saat cutover.
UPDATE "Store"
SET "aiImageEnabled" = true, "aiVideoEnabled" = true, "aiCaptionEnabled" = true, "aiChatEnabled" = true
WHERE "aiGenerationEnabled" = true;
