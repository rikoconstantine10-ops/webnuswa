-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "userId" DROP NOT NULL,
ADD COLUMN     "guestId" TEXT;

-- CreateIndex
CREATE INDEX "CartItem_guestId_idx" ON "CartItem"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_guestId_productId_variantId_key" ON "CartItem"("guestId", "productId", "variantId");
