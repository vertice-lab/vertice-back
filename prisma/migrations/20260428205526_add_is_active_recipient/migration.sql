-- AlterTable
ALTER TABLE "Recipient" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Recipient_isActive_idx" ON "Recipient"("isActive");
