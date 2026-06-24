-- AlterTable: WorkLog에 srNumber 추가
ALTER TABLE "WorkLog" ADD COLUMN "srNumber" TEXT;

-- CreateEnum: QATestStatus
CREATE TYPE "QATestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum: QATestResult
CREATE TYPE "QATestResult" AS ENUM ('PASS', 'FAIL', 'SKIP');

-- CreateTable: QATest
CREATE TABLE "QATest" (
    "id" TEXT NOT NULL,
    "qaNumber" TEXT NOT NULL,
    "srNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" "QATestStatus" NOT NULL DEFAULT 'PENDING',
    "result" "QATestResult",
    "tester" TEXT,
    "testDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workLogId" TEXT,

    CONSTRAINT "QATest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QATest_qaNumber_key" ON "QATest"("qaNumber");

-- AddForeignKey
ALTER TABLE "QATest" ADD CONSTRAINT "QATest_workLogId_fkey" FOREIGN KEY ("workLogId") REFERENCES "WorkLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
