-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "buyerId" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "waReminderSent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subtotal" INTEGER NOT NULL,
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "paymentType" TEXT,
    "louvinTrxId" TEXT,
    "paymentInfo" TEXT,
    "shippingAddress" TEXT,
    "courier" TEXT,
    "trackingNumber" TEXT,
    "paidAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("buyerEmail", "buyerId", "buyerName", "code", "completedAt", "courier", "createdAt", "id", "louvinTrxId", "paidAt", "paymentInfo", "paymentType", "platformFee", "shippingAddress", "shippingCost", "status", "storeId", "subtotal", "total", "trackingNumber") SELECT "buyerEmail", "buyerId", "buyerName", "code", "completedAt", "courier", "createdAt", "id", "louvinTrxId", "paidAt", "paymentInfo", "paymentType", "platformFee", "shippingAddress", "shippingCost", "status", "storeId", "subtotal", "total", "trackingNumber" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");
CREATE UNIQUE INDEX "Order_louvinTrxId_key" ON "Order"("louvinTrxId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
