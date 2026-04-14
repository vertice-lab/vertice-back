/*
  Warnings:

  - A unique constraint covering the columns `[financialInstitutionName]` on the table `BankAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accountNumberOrCode]` on the table `BankAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emailAddress]` on the table `BankAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_financialInstitutionName_key" ON "BankAccount"("financialInstitutionName");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_accountNumberOrCode_key" ON "BankAccount"("accountNumberOrCode");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_emailAddress_key" ON "BankAccount"("emailAddress");
