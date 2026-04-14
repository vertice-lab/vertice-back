-- CreateEnum
CREATE TYPE "OperationMethod" AS ENUM ('CREATE', 'UPDATE');

-- CreateTable
CREATE TABLE "CurrencyRateHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operation" TEXT NOT NULL,
    "method" "OperationMethod" NOT NULL,
    "firstCreatedAt" TIMESTAMP(3) NOT NULL,
    "buyRate" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "name" TEXT NOT NULL,
    "sellRate" DOUBLE PRECISION NOT NULL,
    "newUpdatedAt" TIMESTAMP(3) NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "uniqueRate" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "currencyRateId" TEXT NOT NULL,

    CONSTRAINT "CurrencyRateHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CurrencyRateHistory" ADD CONSTRAINT "CurrencyRateHistory_currencyRateId_fkey" FOREIGN KEY ("currencyRateId") REFERENCES "CurrencyRate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrencyRateHistory" ADD CONSTRAINT "CurrencyRateHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
