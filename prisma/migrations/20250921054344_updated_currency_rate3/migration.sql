/*
  Warnings:

  - You are about to drop the `_TicketMessages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_TicketMessages" DROP CONSTRAINT "_TicketMessages_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_TicketMessages" DROP CONSTRAINT "_TicketMessages_B_fkey";

-- DropTable
DROP TABLE "public"."_TicketMessages";
