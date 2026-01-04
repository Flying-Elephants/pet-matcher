/*
  Warnings:

  - Added the required column `updatedAt` to the `ProductRule` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" TEXT NOT NULL,
    "productIds" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductRule" ("conditions", "id", "isActive", "name", "priority", "productIds", "shop") SELECT "conditions", "id", "isActive", "name", "priority", "productIds", "shop" FROM "ProductRule";
DROP TABLE "ProductRule";
ALTER TABLE "new_ProductRule" RENAME TO "ProductRule";
CREATE INDEX "ProductRule_shop_isActive_idx" ON "ProductRule"("shop", "isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
