/*
  Warnings:

  - You are about to drop the column `fee` on the `CurrencyRate` table. All the data in the column will be lost.
  - You are about to drop the column `from` on the `CurrencyRate` table. All the data in the column will be lost.
  - You are about to drop the column `rate` on the `CurrencyRate` table. All the data in the column will be lost.
  - You are about to drop the column `to` on the `CurrencyRate` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `CurrencyRate` table. All the data in the column will be lost.
  - You are about to drop the column `exchangeRate` on the `Ticket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[currency]` on the table `CurrencyRate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `buyRate` to the `CurrencyRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `CurrencyRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastUpdated` to the `CurrencyRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `CurrencyRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellRate` to the `CurrencyRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `appliedRate` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."CurrencyRate_from_to_key";

-- AlterTable
ALTER TABLE "public"."CurrencyRate" DROP COLUMN "fee",
DROP COLUMN "from",
DROP COLUMN "rate",
DROP COLUMN "to",
DROP COLUMN "updatedAt",
ADD COLUMN     "buyRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "sellRate" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."Ticket" DROP COLUMN "exchangeRate",
ADD COLUMN     "appliedRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "buyRate" DOUBLE PRECISION,
ADD COLUMN     "sellRate" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyRate_currency_key" ON "public"."CurrencyRate"("currency");
