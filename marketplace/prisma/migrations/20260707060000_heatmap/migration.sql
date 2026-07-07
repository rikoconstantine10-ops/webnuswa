-- CreateTable
CREATE TABLE "HeatmapClick" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "xPct" DOUBLE PRECISION NOT NULL,
    "yPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeatmapClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatmapScroll" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "depthPct" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeatmapScroll_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HeatmapClick_path_device_createdAt_idx" ON "HeatmapClick"("path", "device", "createdAt");

-- CreateIndex
CREATE INDEX "HeatmapScroll_path_device_createdAt_idx" ON "HeatmapScroll"("path", "device", "createdAt");
