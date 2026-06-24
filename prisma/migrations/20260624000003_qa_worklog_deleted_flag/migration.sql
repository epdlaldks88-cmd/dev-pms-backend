-- QATest에 연결된 일감 삭제 여부 플래그 추가
ALTER TABLE "QATest" ADD COLUMN "workLogDeleted" BOOLEAN NOT NULL DEFAULT false;

-- 이미 링크가 끊긴(workLogId IS NULL) 기존 QA 중, 일감 연동으로 생성됐던 항목 보정은 불가하므로
-- 향후 삭제분부터 플래그가 기록됩니다.
