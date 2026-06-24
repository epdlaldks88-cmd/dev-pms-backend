/*
  Warnings:

  - The values [SKIP] on the enum `QATestResult` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QATestResult_new" AS ENUM ('PASS', 'FAIL', 'REJECTED');
ALTER TABLE "QATest" ALTER COLUMN "result" TYPE "QATestResult_new" USING ("result"::text::"QATestResult_new");
ALTER TYPE "QATestResult" RENAME TO "QATestResult_old";
ALTER TYPE "QATestResult_new" RENAME TO "QATestResult";
DROP TYPE "public"."QATestResult_old";
COMMIT;
