-- CreateTable
CREATE TABLE "PetProfileSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PetProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Dog',
    "breed" TEXT NOT NULL,
    "birthday" DATETIME,
    "attributes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_PetProfile" ("attributes", "birthday", "breed", "createdAt", "id", "isSelected", "name", "shop", "shopifyId", "updatedAt") SELECT "attributes", "birthday", "breed", "createdAt", "id", "isSelected", "name", "shop", "shopifyId", "updatedAt" FROM "PetProfile";
DROP TABLE "PetProfile";
ALTER TABLE "new_PetProfile" RENAME TO "PetProfile";
CREATE INDEX "PetProfile_shop_idx" ON "PetProfile"("shop");
CREATE INDEX "PetProfile_shop_type_idx" ON "PetProfile"("shop", "type");
CREATE INDEX "PetProfile_shop_breed_idx" ON "PetProfile"("shop", "breed");
CREATE INDEX "PetProfile_shop_shopifyId_isSelected_idx" ON "PetProfile"("shop", "shopifyId", "isSelected");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PetProfileSettings_shop_key" ON "PetProfileSettings"("shop");
