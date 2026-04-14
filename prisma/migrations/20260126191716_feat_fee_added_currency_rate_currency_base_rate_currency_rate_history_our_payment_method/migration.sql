-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('BUY', 'SELL', 'MARKET', 'BCV');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TicketStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "TicketStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "CurrencyBaseRate" ADD COLUMN     "bcvRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "CurrencyRate" ADD COLUMN     "feePercentage" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "CurrencyRateHistory" ADD COLUMN     "bcvRate" DOUBLE PRECISION,
ADD COLUMN     "feePercentage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "OurPaymentMethod" ADD COLUMN     "feePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "consecutiveId" SERIAL NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "currencyRateId" TEXT NOT NULL,
    "amountSent" DOUBLE PRECISION NOT NULL,
    "appliedRate" DOUBLE PRECISION NOT NULL,
    "rateSource" "RateType" NOT NULL,
    "feeRatePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feePaymentPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDepositRequired" DOUBLE PRECISION NOT NULL,
    "totalToReceive" DOUBLE PRECISION NOT NULL,
    "referenceNumber" TEXT,
    "receiptImage" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_consecutiveId_key" ON "Ticket"("consecutiveId");

-- CreateIndex
CREATE INDEX "Ticket_status_createdAt_idx" ON "Ticket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "OurPaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_currencyRateId_fkey" FOREIGN KEY ("currencyRateId") REFERENCES "CurrencyRate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
