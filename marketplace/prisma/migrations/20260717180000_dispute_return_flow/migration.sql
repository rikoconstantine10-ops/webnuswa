-- AlterTable
ALTER TABLE "Dispute"
  ADD COLUMN "returnCourier" TEXT,
  ADD COLUMN "returnTrackingNumber" TEXT,
  ADD COLUMN "returnShippedAt" TIMESTAMP(3),
  ADD COLUMN "returnDeadlineAt" TIMESTAMP(3);
