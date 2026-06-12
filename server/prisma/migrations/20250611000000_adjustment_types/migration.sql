-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('ENTRY', 'EXIT', 'DURING_DAY');

-- CreateEnum
CREATE TYPE "DuringDayKind" AS ENUM ('LUNCH_EXTRA', 'DAY_DEFICIT');

-- AlterTable
ALTER TABLE "HourEntry" ADD COLUMN "adjustmentType" "AdjustmentType",
ADD COLUMN "duringDayKind" "DuringDayKind",
ADD COLUMN "duringDayHours" DECIMAL(10,2);
