-- AlterTable
ALTER TABLE "User" ADD COLUMN "workStartTime" TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE "User" ADD COLUMN "workEndTime" TEXT NOT NULL DEFAULT '17:00';

-- AlterTable
ALTER TABLE "HourEntry" ADD COLUMN "clockIn" TEXT;
ALTER TABLE "HourEntry" ADD COLUMN "clockOut" TEXT;
ALTER TABLE "HourEntry" ADD COLUMN "withMedicalCertificate" BOOLEAN NOT NULL DEFAULT false;
