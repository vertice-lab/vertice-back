/*
  Warnings:

  - You are about to drop the column `rateSource` on the `Ticket` table. All the data in the column will be lost.
  - Added the required column `ticketType` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('SELF', 'THIRD_PARTY');

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "rateSource",
ADD COLUMN     "ticketType" "TicketType" NOT NULL;

-- DropEnum
DROP TYPE "RateType";
