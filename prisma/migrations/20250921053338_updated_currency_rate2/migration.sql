/*
  Warnings:

  - You are about to drop the column `lastUpdated` on the `CurrencyRate` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `CurrencyRate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CurrencyRate" DROP COLUMN "lastUpdated",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
