-- DropForeignKey
ALTER TABLE "CurrencyPaymentMethod" DROP CONSTRAINT "CurrencyPaymentMethod_ourPaymentMethodId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_paymentMethodId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "paymentMethodSnapshot" JSONB,
ALTER COLUMN "paymentMethodId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CurrencyPaymentMethod" ADD CONSTRAINT "CurrencyPaymentMethod_ourPaymentMethodId_fkey" FOREIGN KEY ("ourPaymentMethodId") REFERENCES "OurPaymentMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
