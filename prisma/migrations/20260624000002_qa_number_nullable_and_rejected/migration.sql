-- QATest.qaNumber nullable로 변경
ALTER TABLE "QATest" ALTER COLUMN "qaNumber" DROP NOT NULL;

-- QATestResult에 REJECTED 추가
ALTER TYPE "QATestResult" ADD VALUE IF NOT EXISTS 'REJECTED';
