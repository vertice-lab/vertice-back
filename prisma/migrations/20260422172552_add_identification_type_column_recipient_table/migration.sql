-- CreateEnum
CREATE TYPE "IdentificationType" AS ENUM ('DNI', 'CEDULA', 'PASSPORT');

-- AlterTable
ALTER TABLE "Recipient" ADD COLUMN     "identificationType" "IdentificationType" NOT NULL DEFAULT 'CEDULA';
