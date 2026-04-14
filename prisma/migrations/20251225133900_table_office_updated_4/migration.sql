/*
  Warnings:

  - You are about to drop the column `hourClosing` on the `Office` table. All the data in the column will be lost.
  - You are about to drop the column `hourOpening` on the `Office` table. All the data in the column will be lost.
  - Added the required column `closingTime` to the `Office` table without a default value. This is not possible if the table is not empty.
  - Added the required column `openingTime` to the `Office` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Office" DROP COLUMN "hourClosing",
DROP COLUMN "hourOpening",
ADD COLUMN     "closingTime" TEXT NOT NULL,
ADD COLUMN     "openingTime" TEXT NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "address" SET DATA TYPE TEXT;
