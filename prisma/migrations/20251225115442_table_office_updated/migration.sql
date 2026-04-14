/*
  Warnings:

  - You are about to drop the column `email` on the `Office` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Office` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Office" DROP COLUMN "email",
DROP COLUMN "phone",
ADD COLUMN     "hourClosing" TEXT,
ADD COLUMN     "hourOpening" TEXT;
