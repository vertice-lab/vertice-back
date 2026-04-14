/*
  Warnings:

  - Added the required column `countryName` to the `CurrencyBaseRate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."CurrencyBaseRate" ADD COLUMN     "countryName" TEXT NOT NULL;
