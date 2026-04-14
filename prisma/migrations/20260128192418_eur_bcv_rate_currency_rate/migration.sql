/*
  Warnings:

  - You are about to drop the column `uniqueRate` on the `CurrencyRate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CurrencyRate" DROP COLUMN "uniqueRate",
ADD COLUMN     "dolarBcvRate" DOUBLE PRECISION,
ADD COLUMN     "eurBcvRate" DOUBLE PRECISION,
ADD COLUMN     "marketRate" DOUBLE PRECISION;
