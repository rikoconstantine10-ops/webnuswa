-- AlterTable
ALTER TABLE "Order" ADD COLUMN "biteshipOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN "courierCompany" TEXT;
ALTER TABLE "Order" ADD COLUMN "courierType" TEXT;
ALTER TABLE "Order" ADD COLUMN "destAreaId" TEXT;
ALTER TABLE "Order" ADD COLUMN "destPostalCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "shipmentStatus" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "originAddress" TEXT;
ALTER TABLE "Store" ADD COLUMN "originAreaId" TEXT;
ALTER TABLE "Store" ADD COLUMN "originContactName" TEXT;
ALTER TABLE "Store" ADD COLUMN "originContactPhone" TEXT;
ALTER TABLE "Store" ADD COLUMN "originPostalCode" TEXT;
