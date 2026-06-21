-- Step에 status(TaskStatus) 추가: 컬럼(단계)이 진행 상태의 단일 기준이 됨
ALTER TABLE "Step" ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'TODO';

-- 기존 완료 컬럼(isDone=true)은 DONE으로 매핑
UPDATE "Step" SET "status" = 'DONE' WHERE "isDone" = true;

-- isDone 컬럼 제거 (status로 일원화)
ALTER TABLE "Step" DROP COLUMN "isDone";
