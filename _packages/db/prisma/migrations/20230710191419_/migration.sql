/*
  Warnings:

  - You are about to drop the column `proxmoxTemplateId` on the `InstallTemplate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InstallTemplate" DROP COLUMN "proxmoxTemplateId",
ADD COLUMN     "minimumCpuCores" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "minimumDiskBytes" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "minimumRamBytes" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "qcow2Url" TEXT NOT NULL DEFAULT '';
