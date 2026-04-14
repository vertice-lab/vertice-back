/*
  Warnings:

  - You are about to drop the column `bcvRate` on the `CurrencyRateHistory` table. All the data in the column will be lost.
  - You are about to drop the column `uniqueRate` on the `CurrencyRateHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CurrencyRateHistory" DROP COLUMN "bcvRate",
DROP COLUMN "uniqueRate",
ADD COLUMN     "dolarBcvRate" DOUBLE PRECISION,
ADD COLUMN     "eurBcvRate" DOUBLE PRECISION,
ADD COLUMN     "marketRate" DOUBLE PRECISION;
