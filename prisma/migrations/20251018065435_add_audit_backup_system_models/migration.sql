/*
  Warnings:

  - The values [MONTHLY,YEARLY,CUSTOM,AUDIT] on the enum `ReportType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `newValue` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `oldValue` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `backups` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `backups` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `backups` table. All the data in the column will be lost.
  - You are about to drop the column `storagePath` on the `backups` table. All the data in the column will be lost.
  - You are about to drop the column `aiInsights` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `dataSnapshot` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `generatedById` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `periodEnd` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `periodStart` on the `reports` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[filename]` on the table `backups` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `signature` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `action` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `entityType` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `entityId` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ipAddress` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userAgent` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `checksum` to the `backups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `backups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filename` to the `backups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `format` to the `backups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `backups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `format` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `generatedBy` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodFrom` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodTo` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'VIEW', 'REVERT', 'BACKUP', 'RESTORE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('InventoryItem', 'User', 'Report', 'Backup', 'Settings', 'AuditLog');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('MANUAL', 'AUTOMATIC', 'PRE_RESTORE');

-- CreateEnum
CREATE TYPE "BackupFormat" AS ENUM ('CSV', 'JSON', 'SQL');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL', 'PPTX');

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterEnum
ALTER TYPE "BackupStatus" ADD VALUE 'CORRUPTED';

-- AlterEnum
BEGIN;
CREATE TYPE "ReportType_new" AS ENUM ('MONTHLY_INVENTORY', 'YEARLY_SUMMARY', 'CUSTOM_RANGE', 'AUDIT_REPORT', 'USER_ACTIVITY', 'CATEGORY_ANALYSIS');
ALTER TABLE "reports" ALTER COLUMN "type" TYPE "ReportType_new" USING ("type"::text::"ReportType_new");
ALTER TYPE "ReportType" RENAME TO "ReportType_old";
ALTER TYPE "ReportType_new" RENAME TO "ReportType";
DROP TYPE "ReportType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_entityId_fkey";

-- DropForeignKey
ALTER TABLE "backups" DROP CONSTRAINT "backups_createdById_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_generatedById_fkey";

-- DropIndex
DROP INDEX "audit_logs_userId_timestamp_idx";

-- DropIndex
DROP INDEX "reports_createdAt_idx";

-- DropIndex
DROP INDEX "reports_type_periodStart_idx";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "newValue",
DROP COLUMN "oldValue",
ADD COLUMN     "changes" JSONB,
ADD COLUMN     "signature" TEXT NOT NULL,
DROP COLUMN "action",
ADD COLUMN     "action" "ActionType" NOT NULL,
DROP COLUMN "entityType",
ADD COLUMN     "entityType" "EntityType" NOT NULL,
ALTER COLUMN "entityId" SET NOT NULL,
ALTER COLUMN "ipAddress" SET NOT NULL,
ALTER COLUMN "userAgent" SET NOT NULL;

-- AlterTable
ALTER TABLE "backups" DROP COLUMN "createdById",
DROP COLUMN "fileName",
DROP COLUMN "fileType",
DROP COLUMN "storagePath",
ADD COLUMN     "checksum" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "dateRangeFrom" TIMESTAMP(3),
ADD COLUMN     "dateRangeTo" TIMESTAMP(3),
ADD COLUMN     "encrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "format" "BackupFormat" NOT NULL,
ADD COLUMN     "includeAuditLogs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "includeSettings" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "includeUserData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "type" "BackupType" NOT NULL,
ADD COLUMN     "validated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ALTER COLUMN "fileSize" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "aiInsights",
DROP COLUMN "createdAt",
DROP COLUMN "dataSnapshot",
DROP COLUMN "fileUrl",
DROP COLUMN "generatedById",
DROP COLUMN "periodEnd",
DROP COLUMN "periodStart",
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "fileSize" BIGINT NOT NULL,
ADD COLUMN     "format" "ReportFormat" NOT NULL,
ADD COLUMN     "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "generatedBy" TEXT NOT NULL,
ADD COLUMN     "includeAIInsights" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "periodFrom" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodTo" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "frequency" "ScheduleFrequency" NOT NULL,
    "time" TEXT NOT NULL,
    "recipients" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_configs" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleTime" TEXT NOT NULL DEFAULT '02:00',
    "formats" "BackupFormat"[],
    "includeAuditLogs" BOOLEAN NOT NULL DEFAULT true,
    "retentionDailyDays" INTEGER NOT NULL DEFAULT 30,
    "retentionWeeklyWeeks" INTEGER NOT NULL DEFAULT 12,
    "retentionMonthlyMonths" INTEGER NOT NULL DEFAULT 12,
    "storagePath" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "backup_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_schedules_nextRun_idx" ON "report_schedules"("nextRun");

-- CreateIndex
CREATE INDEX "report_schedules_enabled_idx" ON "report_schedules"("enabled");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "backups_filename_key" ON "backups"("filename");

-- CreateIndex
CREATE INDEX "backups_type_idx" ON "backups"("type");

-- CreateIndex
CREATE INDEX "reports_generatedAt_idx" ON "reports"("generatedAt");

-- CreateIndex
CREATE INDEX "reports_type_idx" ON "reports"("type");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backups" ADD CONSTRAINT "backups_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_configs" ADD CONSTRAINT "backup_configs_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
