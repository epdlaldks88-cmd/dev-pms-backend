-- 기존 WorkLog 데이터에 SR번호 일괄 부여 (생성일 순서 기준)
WITH numbered AS (
  SELECT id,
         'SR-' || TO_CHAR(EXTRACT(YEAR FROM "createdAt")::int % 100, 'FM00') ||
         '-' || LPAD(ROW_NUMBER() OVER (ORDER BY "createdAt" ASC)::text, 4, '0') AS sr
  FROM "WorkLog"
  WHERE "srNumber" IS NULL
)
UPDATE "WorkLog"
SET "srNumber" = numbered.sr
FROM numbered
WHERE "WorkLog".id = numbered.id;
