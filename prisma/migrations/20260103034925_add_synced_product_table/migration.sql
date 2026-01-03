-- CreateTable
CREATE TABLE "SyncedProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "SyncedProduct_shop_idx" ON "SyncedProduct"("shop");
