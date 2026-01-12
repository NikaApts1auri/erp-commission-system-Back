-- CreateEnum
CREATE TYPE "TierBonusType" AS ENUM ('PERCENTAGE', 'FLAT');

-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "appliedRate" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "CommissionTier" ADD COLUMN     "bonusType" "TierBonusType";

-- CreateIndex
CREATE INDEX "Booking_hotelId_status_completedAt_idx" ON "Booking"("hotelId", "status", "completedAt");

-- CreateIndex
CREATE INDEX "Commission_calculatedAt_idx" ON "Commission"("calculatedAt");

-- CreateIndex
CREATE INDEX "CommissionTier_agreementId_minBookings_idx" ON "CommissionTier"("agreementId", "minBookings");
