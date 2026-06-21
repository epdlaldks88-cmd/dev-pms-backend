-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "taskId" TEXT;

-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
