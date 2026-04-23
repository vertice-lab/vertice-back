/*
  Warnings:

  - The values [PREPAID_CARD] on the enum `PaymentMethodType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethodType_new" AS ENUM ('TRANSFER', 'CASH', 'PAGO_MOVIL', 'NEQUI', 'ZELLE', 'WISE', 'PAYPAL', 'BINANCE', 'SEPA');
ALTER TABLE "PaymentDetail" ALTER COLUMN "paymentMethod" TYPE "PaymentMethodType_new" USING ("paymentMethod"::text::"PaymentMethodType_new");
ALTER TYPE "PaymentMethodType" RENAME TO "PaymentMethodType_old";
ALTER TYPE "PaymentMethodType_new" RENAME TO "PaymentMethodType";
DROP TYPE "public"."PaymentMethodType_old";
COMMIT;

-- DropIndex
DROP INDEX "PaymentDetail_recipientId_key";

-- CreateIndex
CREATE INDEX "PaymentDetail_recipientId_idx" ON "PaymentDetail"("recipientId");
