-- Chatbot WhatsApp: persona/jadwal per toko + inbox + knowledge base
ALTER TABLE "Store" ADD COLUMN "waPersonaPrompt" TEXT;
ALTER TABLE "Store" ADD COLUMN "waAutoReplyEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Store" ADD COLUMN "waActiveDays" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Store" ADD COLUMN "waActiveHoursStart" TEXT;
ALTER TABLE "Store" ADD COLUMN "waActiveHoursEnd" TEXT;

CREATE TABLE "WaConversation" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "buyerName" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'BOT',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] NOT NULL DEFAULT '{}',
    "needsHumanSince" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaConversation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WaConversation_storeId_buyerPhone_key" ON "WaConversation"("storeId", "buyerPhone");
CREATE INDEX "WaConversation_storeId_lastMessageAt_idx" ON "WaConversation"("storeId", "lastMessageAt");
ALTER TABLE "WaConversation" ADD CONSTRAINT "WaConversation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WaMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "mediaType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WaMessage_conversationId_createdAt_idx" ON "WaMessage"("conversationId", "createdAt");
ALTER TABLE "WaMessage" ADD CONSTRAINT "WaMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WaConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WaKnowledgeItem" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaKnowledgeItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WaKnowledgeItem_storeId_sortOrder_idx" ON "WaKnowledgeItem"("storeId", "sortOrder");
ALTER TABLE "WaKnowledgeItem" ADD CONSTRAINT "WaKnowledgeItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
