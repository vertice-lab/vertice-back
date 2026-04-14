-- CreateEnum
CREATE TYPE "AssessorStatus" AS ENUM ('AVAILABLE', 'BUSY', 'BREAK', 'OFFLINE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastAssignedAt" TIMESTAMP(3),
ADD COLUMN     "maxCapacity" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "status" "AssessorStatus" NOT NULL DEFAULT 'OFFLINE';
