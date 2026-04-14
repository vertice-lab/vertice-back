/*
  Warnings:

  - You are about to drop the column `consecutiveId` on the `Ticket` table. All the data in the column will be lost.
  - Added the required column `ticketNumber` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Ticket_consecutiveId_key";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "consecutiveId",
ADD COLUMN     "ticketNumber" TEXT NOT NULL;
