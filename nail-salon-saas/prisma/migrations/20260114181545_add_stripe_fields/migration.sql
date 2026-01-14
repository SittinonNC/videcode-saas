-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'PROMPTPAY';

-- AlterTable
ALTER TABLE "booking_payments" ADD COLUMN     "clientSecret" TEXT,
ADD COLUMN     "paymentIntentId" TEXT;
