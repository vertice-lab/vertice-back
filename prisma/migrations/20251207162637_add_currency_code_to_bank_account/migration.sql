/*
  Warnings:

  - You are about to drop the column `accountId` on the `BankAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BankAccount" DROP COLUMN "accountId",
ADD COLUMN     "currencyCode" TEXT;
