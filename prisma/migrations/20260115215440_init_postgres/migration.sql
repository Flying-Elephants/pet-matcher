-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
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
    "refreshTokenExpires" TIMESTAMP(3),
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "matchCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetProfile" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Dog',
    "breed" TEXT NOT NULL,
    "weightGram" INTEGER,
    "birthday" TIMESTAMP(3),
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PetProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetProfileSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetProfileSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRule" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "productIds" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedProduct" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerConsent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "isAgreed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "userId" BIGINT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "resourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecuritySettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "limitCollaboratorAccess" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecuritySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_shop_key" ON "Session"("shop");

-- CreateIndex
CREATE INDEX "PetProfile_shop_idx" ON "PetProfile"("shop");

-- CreateIndex
CREATE INDEX "PetProfile_shop_type_idx" ON "PetProfile"("shop", "type");

-- CreateIndex
CREATE INDEX "PetProfile_shop_breed_idx" ON "PetProfile"("shop", "breed");

-- CreateIndex
CREATE INDEX "PetProfile_shop_shopifyId_isSelected_idx" ON "PetProfile"("shop", "shopifyId", "isSelected");

-- CreateIndex
CREATE UNIQUE INDEX "PetProfileSettings_shop_key" ON "PetProfileSettings"("shop");

-- CreateIndex
CREATE INDEX "ProductRule_shop_isActive_idx" ON "ProductRule"("shop", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRule_shop_name_key" ON "ProductRule"("shop", "name");

-- CreateIndex
CREATE INDEX "SyncedProduct_shop_idx" ON "SyncedProduct"("shop");

-- CreateIndex
CREATE INDEX "MatchEvent_shop_idx" ON "MatchEvent"("shop");

-- CreateIndex
CREATE INDEX "MatchEvent_shop_createdAt_idx" ON "MatchEvent"("shop", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerConsent_shop_shopifyId_key" ON "CustomerConsent"("shop", "shopifyId");

-- CreateIndex
CREATE INDEX "AuditLog_shop_idx" ON "AuditLog"("shop");

-- CreateIndex
CREATE INDEX "AuditLog_shop_createdAt_idx" ON "AuditLog"("shop", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecuritySettings_shop_key" ON "SecuritySettings"("shop");
