/*
  Warnings:

  - A unique constraint covering the columns `[slipTransRef]` on the table `booking_payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "booking_payments" ADD COLUMN     "slipImageUrl" TEXT,
ADD COLUMN     "slipTransRef" TEXT,
ADD COLUMN     "slipVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "lineUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "booking_payments_slipTransRef_key" ON "booking_payments"("slipTransRef");
