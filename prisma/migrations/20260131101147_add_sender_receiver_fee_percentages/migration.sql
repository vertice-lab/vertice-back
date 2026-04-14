/*
  Warnings:

  - You are about to drop the column `feePercentage` on the `CurrencyPaymentMethod` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CurrencyPaymentMethod" DROP COLUMN "feePercentage",
ADD COLUMN     "receiverFeePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "senderFeePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0;
