-- CreateTable
CREATE TABLE "OurPaymentMethod" (
    "id" TEXT NOT NULL,
    "financialInstitutionName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Banco',
    "accountHolderName" TEXT,
    "accountHolderId" TEXT,
    "accountNumberOrCode" TEXT,
    "aliasOrReference" TEXT,
    "phoneNumber" TEXT,
    "emailAddress" TEXT,
    "bankAccountType" TEXT,
    "addressOrDetails" TEXT,
    "additionalNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OurPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OurPaymentMethod" ADD CONSTRAINT "OurPaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
