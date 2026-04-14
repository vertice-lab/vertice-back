-- CreateTable
CREATE TABLE "BankAccount" (
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
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
