/*
  Warnings:

  - You are about to drop the column `currency` on the `CurrencyRate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fromCurrency,toCurrency]` on the table `CurrencyRate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fromCurrency` to the `CurrencyRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toCurrency` to the `CurrencyRate` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."CurrencyRate_currency_key";

-- AlterTable
ALTER TABLE "public"."CurrencyRate" DROP COLUMN "currency",
ADD COLUMN     "fromCurrency" TEXT NOT NULL,
ADD COLUMN     "toCurrency" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "CurrencyRate_fromCurrency_toCurrency_isActive_idx" ON "public"."CurrencyRate"("fromCurrency", "toCurrency", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyRate_fromCurrency_toCurrency_key" ON "public"."CurrencyRate"("fromCurrency", "toCurrency");
