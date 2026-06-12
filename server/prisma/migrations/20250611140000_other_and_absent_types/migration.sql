-- Replace AdjustmentType enum (DURING_DAY -> OTHER, add ABSENT)
CREATE TYPE "AdjustmentType_new" AS ENUM ('ENTRY', 'EXIT', 'OTHER', 'ABSENT');
ALTER TABLE "HourEntry" ALTER COLUMN "adjustmentType" TYPE "AdjustmentType_new" USING (
  CASE "adjustmentType"::text
    WHEN 'DURING_DAY' THEN 'OTHER'
    ELSE "adjustmentType"::text
  END::"AdjustmentType_new"
);
DROP TYPE "AdjustmentType";
ALTER TYPE "AdjustmentType_new" RENAME TO "AdjustmentType";

-- Replace DuringDayKind enum (LUNCH_EXTRA -> ADD, DAY_DEFICIT -> SUBTRACT)
CREATE TYPE "DuringDayKind_new" AS ENUM ('ADD', 'SUBTRACT');
ALTER TABLE "HourEntry" ALTER COLUMN "duringDayKind" TYPE "DuringDayKind_new" USING (
  CASE "duringDayKind"::text
    WHEN 'LUNCH_EXTRA' THEN 'ADD'
    WHEN 'DAY_DEFICIT' THEN 'SUBTRACT'
    ELSE "duringDayKind"::text
  END::"DuringDayKind_new"
);
DROP TYPE "DuringDayKind";
ALTER TYPE "DuringDayKind_new" RENAME TO "DuringDayKind";
