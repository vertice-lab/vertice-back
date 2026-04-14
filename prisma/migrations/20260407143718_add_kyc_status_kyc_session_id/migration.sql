/*
  Warnings:

  - You are about to drop the `ManagementAction` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[kycSessionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'APPROVED', 'DECLINED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "TicketReceiptStatus" AS ENUM ('PAYMENT_VERIFIED', 'CUSTOMER_PAID', 'REJECTED');

-- DropForeignKey
ALTER TABLE "ManagementAction" DROP CONSTRAINT "ManagementAction_advisorId_fkey";

-- DropForeignKey
ALTER TABLE "ManagementAction" DROP CONSTRAINT "ManagementAction_managerId_fkey";

-- DropForeignKey
ALTER TABLE "ManagementAction" DROP CONSTRAINT "ManagementAction_ticketId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kycSessionId" TEXT,
ADD COLUMN     "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- DropTable
DROP TABLE "ManagementAction";

-- DropEnum
DROP TYPE "ManagementStatus";

-- CreateTable
CREATE TABLE "TicketReceiptNotification" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "selectedImageUrl" TEXT NOT NULL,
    "status" "TicketReceiptStatus" NOT NULL DEFAULT 'PAYMENT_VERIFIED',
    "managerNote" TEXT,
    "managerResponseImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketReceiptNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketReceiptNotification_managerId_status_createdAt_idx" ON "TicketReceiptNotification"("managerId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_kycSessionId_key" ON "User"("kycSessionId");

-- AddForeignKey
ALTER TABLE "TicketReceiptNotification" ADD CONSTRAINT "TicketReceiptNotification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReceiptNotification" ADD CONSTRAINT "TicketReceiptNotification_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReceiptNotification" ADD CONSTRAINT "TicketReceiptNotification_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
