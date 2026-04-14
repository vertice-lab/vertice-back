/*
  Warnings:

  - You are about to drop the `AssessorRating` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SenderPaymentMethod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupportTicket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TicketMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AssessorRating" DROP CONSTRAINT "AssessorRating_assessorId_fkey";

-- DropForeignKey
ALTER TABLE "AssessorRating" DROP CONSTRAINT "AssessorRating_clientId_fkey";

-- DropForeignKey
ALTER TABLE "SenderPaymentMethod" DROP CONSTRAINT "SenderPaymentMethod_userId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_assessorId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_clientId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_senderPaymentMethodId_fkey";

-- AlterTable
ALTER TABLE "CurrencyBaseRate" ADD COLUMN     "isCripto" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "AssessorRating";

-- DropTable
DROP TABLE "SenderPaymentMethod";

-- DropTable
DROP TABLE "SupportTicket";

-- DropTable
DROP TABLE "Ticket";

-- DropTable
DROP TABLE "TicketMessage";

-- DropTable
DROP TABLE "Transaction";
