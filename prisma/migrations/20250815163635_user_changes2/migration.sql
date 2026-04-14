/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `InformationUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `UserTemp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."UserTemp" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InformationUser_phone_key" ON "public"."InformationUser"("phone");
