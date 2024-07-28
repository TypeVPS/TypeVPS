/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `DineroUserAccountLink` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DineroUserAccountLink_userId_key" ON "DineroUserAccountLink"("userId");
