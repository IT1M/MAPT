/*
  Warnings:

  - Added the required column `category` to the `system_settings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "category" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");
