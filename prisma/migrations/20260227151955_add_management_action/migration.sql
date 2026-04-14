-- CreateEnum
CREATE TYPE "ManagementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ManagementAction" (
    "id" TEXT NOT NULL,
    "status" "ManagementStatus" NOT NULL DEFAULT 'PENDING',
    "advisorId" TEXT NOT NULL,
    "managerId" TEXT,
    "ticketId" TEXT NOT NULL,
    "advisorImage" TEXT,
    "managerImage" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagementAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ManagementAction" ADD CONSTRAINT "ManagementAction_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementAction" ADD CONSTRAINT "ManagementAction_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementAction" ADD CONSTRAINT "ManagementAction_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
