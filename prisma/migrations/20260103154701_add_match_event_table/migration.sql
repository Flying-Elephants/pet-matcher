-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "MatchEvent_shop_idx" ON "MatchEvent"("shop");

-- CreateIndex
CREATE INDEX "MatchEvent_shop_createdAt_idx" ON "MatchEvent"("shop", "createdAt");
