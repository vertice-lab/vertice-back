/*
  Warnings:

  - You are about to drop the column `feePercentage` on the `CurrencyRate` table. All the data in the column will be lost.
  - You are about to drop the column `feePercentage` on the `CurrencyRateHistory` table. All the data in the column will be lost.
  - You are about to drop the column `feePercentage` on the `OurPaymentMethod` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CurrencyRate" DROP COLUMN "feePercentage";

-- AlterTable
ALTER TABLE "CurrencyRateHistory" DROP COLUMN "feePercentage";

-- AlterTable
ALTER TABLE "OurPaymentMethod" DROP COLUMN "feePercentage";

-- CreateTable
CREATE TABLE "CurrencyPaymentMethod" (
    "id" TEXT NOT NULL,
    "feePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currencyRateId" TEXT NOT NULL,
    "ourPaymentMethodId" TEXT NOT NULL,

    CONSTRAINT "CurrencyPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CurrencyPaymentMethod_currencyRateId_idx" ON "CurrencyPaymentMethod"("currencyRateId");

-- AddForeignKey
ALTER TABLE "CurrencyPaymentMethod" ADD CONSTRAINT "CurrencyPaymentMethod_currencyRateId_fkey" FOREIGN KEY ("currencyRateId") REFERENCES "CurrencyRate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrencyPaymentMethod" ADD CONSTRAINT "CurrencyPaymentMethod_ourPaymentMethodId_fkey" FOREIGN KEY ("ourPaymentMethodId") REFERENCES "OurPaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
