/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `InformationUser` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `InformationUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."InformationUser" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InformationUser_userId_key" ON "public"."InformationUser"("userId");

-- AddForeignKey
ALTER TABLE "public"."InformationUser" ADD CONSTRAINT "InformationUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
