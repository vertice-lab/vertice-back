-- AlterTable
ALTER TABLE "public"."CurrencyRate" ADD COLUMN     "margin" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."CurrencyBaseRate" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "buyRate" DOUBLE PRECISION,
    "sellRate" DOUBLE PRECISION,
    "uniqueRate" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "isVolatile" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrencyBaseRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyBaseRate_currency_key" ON "public"."CurrencyBaseRate"("currency");

-- CreateIndex
CREATE INDEX "CurrencyBaseRate_currency_isActive_idx" ON "public"."CurrencyBaseRate"("currency", "isActive");

-- AddForeignKey
ALTER TABLE "public"."CurrencyRate" ADD CONSTRAINT "CurrencyRate_fromCurrency_fkey" FOREIGN KEY ("fromCurrency") REFERENCES "public"."CurrencyBaseRate"("currency") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CurrencyRate" ADD CONSTRAINT "CurrencyRate_toCurrency_fkey" FOREIGN KEY ("toCurrency") REFERENCES "public"."CurrencyBaseRate"("currency") ON DELETE RESTRICT ON UPDATE CASCADE;
