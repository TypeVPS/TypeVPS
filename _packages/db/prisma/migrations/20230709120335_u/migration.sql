/*
  Warnings:

  - You are about to drop the column `autoRenew` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "autoRenew",
ADD COLUMN     "autoRenews" BOOLEAN NOT NULL DEFAULT false;
