-- AlterTable
ALTER TABLE "Order" ADD COLUMN "destLat" REAL;
ALTER TABLE "Order" ADD COLUMN "destLng" REAL;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "originLat" REAL;
ALTER TABLE "Store" ADD COLUMN "originLng" REAL;
