-- Landing Page funnel feature: per-store toggle, per-product landing pages, leads, order attribution.

ALTER TABLE "Store" ADD COLUMN "landingPageEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Order" ADD COLUMN "landingPageId" TEXT,
                    ADD COLUMN "refSource" TEXT;

CREATE TABLE "LandingPage" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LandingPage_slug_key" ON "LandingPage"("slug");
CREATE INDEX "LandingPage_storeId_idx" ON "LandingPage"("storeId");
CREATE INDEX "LandingPage_productId_idx" ON "LandingPage"("productId");

CREATE TABLE "LandingLead" (
    "id" TEXT NOT NULL,
    "landingPageId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LandingLead_landingPageId_phone_key" ON "LandingLead"("landingPageId", "phone");
CREATE INDEX "LandingLead_landingPageId_idx" ON "LandingLead"("landingPageId");

ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LandingLead" ADD CONSTRAINT "LandingLead_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
