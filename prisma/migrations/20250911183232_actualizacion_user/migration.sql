/*
  Warnings:

  - A unique constraint covering the columns `[provider,providerId]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Provider_providerId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Provider_provider_providerId_key" ON "public"."Provider"("provider", "providerId");
