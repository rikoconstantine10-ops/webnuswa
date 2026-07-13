-- CreateTable
CREATE TABLE "AiCreditPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "priceRupiah" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCreditPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCreditPurchase" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "priceRupiah" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentType" TEXT,
    "louvinTrxId" TEXT,
    "paymentInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "AiCreditPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCreditEntry" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCreditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiCreditPurchase_louvinTrxId_key" ON "AiCreditPurchase"("louvinTrxId");

-- CreateIndex
CREATE INDEX "AiCreditPurchase_storeId_idx" ON "AiCreditPurchase"("storeId");

-- CreateIndex
CREATE INDEX "AiCreditEntry_storeId_idx" ON "AiCreditEntry"("storeId");

-- AddForeignKey
ALTER TABLE "AiCreditPurchase" ADD CONSTRAINT "AiCreditPurchase_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCreditEntry" ADD CONSTRAINT "AiCreditEntry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
