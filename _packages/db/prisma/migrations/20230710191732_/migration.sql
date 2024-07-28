/*
  Warnings:

  - You are about to drop the column `type` on the `InstallTemplate` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InstallTemplateOsType" AS ENUM ('WINDOWS', 'LINUX');

-- AlterTable
ALTER TABLE "InstallTemplate" DROP COLUMN "type",
ADD COLUMN     "osType" "InstallTemplateOsType" NOT NULL DEFAULT 'LINUX';

-- DropEnum
DROP TYPE "InstallTemplateType";
