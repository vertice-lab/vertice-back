-- AlterTable
ALTER TABLE "PaymentDetail" ADD COLUMN     "accountVerified" BOOLEAN,
ADD COLUMN     "addressOrDetails" TEXT,
ADD COLUMN     "aliasOrReference" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;
