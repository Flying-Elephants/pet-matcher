/*
  Warnings:

  - You are about to drop the column `activePetId` on the `Session` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PetProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "birthday" DATETIME,
    "attributes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_PetProfile" ("attributes", "birthday", "breed", "createdAt", "id", "name", "shop", "shopifyId", "updatedAt") SELECT "attributes", "birthday", "breed", "createdAt", "id", "name", "shop", "shopifyId", "updatedAt" FROM "PetProfile";
DROP TABLE "PetProfile";
ALTER TABLE "new_PetProfile" RENAME TO "PetProfile";
CREATE INDEX "PetProfile_shop_idx" ON "PetProfile"("shop");
CREATE INDEX "PetProfile_shop_breed_idx" ON "PetProfile"("shop", "breed");
CREATE INDEX "PetProfile_shop_shopifyId_isSelected_idx" ON "PetProfile"("shop", "shopifyId", "isSelected");
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" DATETIME,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "matchCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Session" ("accessToken", "accountOwner", "collaborator", "email", "emailVerified", "expires", "firstName", "id", "isOnline", "lastName", "locale", "matchCount", "plan", "refreshToken", "refreshTokenExpires", "scope", "shop", "state", "userId") SELECT "accessToken", "accountOwner", "collaborator", "email", "emailVerified", "expires", "firstName", "id", "isOnline", "lastName", "locale", "matchCount", "plan", "refreshToken", "refreshTokenExpires", "scope", "shop", "state", "userId" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE UNIQUE INDEX "Session_shop_key" ON "Session"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
