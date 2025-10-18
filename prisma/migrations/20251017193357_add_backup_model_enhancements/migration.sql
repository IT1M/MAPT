/*
  Warnings:

  - Added the required column `fileSize` to the `backups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `backups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recordCount` to the `backups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `backups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storagePath` to the `backups` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BackupFileType" AS ENUM ('CSV', 'JSON', 'SQL');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "backups" ADD COLUMN     "fileSize" INTEGER NOT NULL,
ADD COLUMN     "fileType" "BackupFileType" NOT NULL,
ADD COLUMN     "recordCount" INTEGER NOT NULL,
ADD COLUMN     "status" "BackupStatus" NOT NULL,
ADD COLUMN     "storagePath" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "backups_createdAt_idx" ON "backups"("createdAt");

-- CreateIndex
CREATE INDEX "backups_status_idx" ON "backups"("status");
