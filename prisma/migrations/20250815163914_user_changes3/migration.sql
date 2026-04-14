/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `UserTemp` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `UserTemp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."UserTemp" DROP COLUMN "expiresAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
