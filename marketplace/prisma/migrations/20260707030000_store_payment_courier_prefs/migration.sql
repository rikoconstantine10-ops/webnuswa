-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "enabledPaymentTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "enabledCouriers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
