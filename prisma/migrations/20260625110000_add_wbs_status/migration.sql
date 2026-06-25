-- CreateEnum
CREATE TYPE "WbsStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE', 'ON_HOLD');

-- AlterTable
ALTER TABLE "WbsItem" ADD COLUMN "status" "WbsStatus" NOT NULL DEFAULT 'NOT_STARTED';
