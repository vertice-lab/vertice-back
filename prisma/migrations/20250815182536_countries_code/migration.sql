/*
  Warnings:

  - You are about to drop the column `userId` on the `Country` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[country_code]` on the table `Country` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Country" DROP CONSTRAINT "Country_userId_fkey";

-- DropIndex
DROP INDEX "public"."Country_userId_key";

-- AlterTable
ALTER TABLE "public"."Country" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "countryCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Country_country_code_key" ON "public"."Country"("country_code");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "public"."Country"("country_code") ON DELETE SET NULL ON UPDATE CASCADE;
