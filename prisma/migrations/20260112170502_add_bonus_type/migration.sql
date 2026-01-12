/*
  Warnings:

  - Made the column `appliedRate` on table `Commission` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bonusType` on table `CommissionTier` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
UPDATE "Commission" SET "appliedRate" = 0 WHERE "appliedRate" IS NULL;
UPDATE "CommissionTier" SET "bonusType" = 'PERCENTAGE' WHERE "bonusType" IS NULL;
ALTER TABLE "Commission" ALTER COLUMN "appliedRate" SET NOT NULL;

-- AlterTable
ALTER TABLE "CommissionTier" ALTER COLUMN "bonusType" SET NOT NULL;
