/*
  Warnings:

  - A unique constraint covering the columns `[shop,name]` on the table `ProductRule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProductRule_shop_name_key" ON "ProductRule"("shop", "name");
