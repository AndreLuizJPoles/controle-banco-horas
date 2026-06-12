-- AlterTable
ALTER TABLE "HourEntry" DROP COLUMN IF EXISTS "certificateFileName",
DROP COLUMN IF EXISTS "certificateOriginalName",
DROP COLUMN IF EXISTS "certificateMimeType";
