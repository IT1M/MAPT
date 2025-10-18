/*
  Warnings:

  - Added the required column `dataSnapshot` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodEnd` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('MONTHLY', 'YEARLY', 'CUSTOM', 'AUDIT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "aiInsights" TEXT,
ADD COLUMN     "dataSnapshot" JSONB NOT NULL,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "periodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "ReportStatus" NOT NULL,
ADD COLUMN     "type" "ReportType" NOT NULL;

-- CreateIndex
CREATE INDEX "reports_type_periodStart_idx" ON "reports"("type", "periodStart");

-- CreateIndex
CREATE INDEX "reports_createdAt_idx" ON "reports"("createdAt");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");
