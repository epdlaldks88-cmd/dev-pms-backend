-- 기존 모든 유저를 ACTIVE로 설정 (승인 시스템 도입 이전 가입자)
UPDATE "User" SET "status" = 'ACTIVE' WHERE "status" = 'PENDING';
