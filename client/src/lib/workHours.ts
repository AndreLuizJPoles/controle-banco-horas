export type AdjustmentType = 'ENTRY' | 'EXIT' | 'DURING_DAY';
export type DuringDayKind = 'LUNCH_EXTRA' | 'DAY_DEFICIT';

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

function isMultipleOf30Minutes(minutes: number): boolean {
  return minutes !== 0 && minutes % 30 === 0;
}

export const LUNCH_EXTRA_MAX_HOURS = 1;

function isValidDuringDayHours(hours: number, duringDayKind: DuringDayKind): boolean {
  if (hours < 0.5 || Math.round(hours * 2) !== hours * 2) {
    return false;
  }
  if (duringDayKind === 'LUNCH_EXTRA' && hours > LUNCH_EXTRA_MAX_HOURS) {
    return false;
  }
  return true;
}

function applyMedicalCertificate(raw: number, withMedicalCertificate: boolean): number {
  if (withMedicalCertificate && raw < 0) {
    return 0;
  }
  return raw;
}

export function calculateEntryAdjustmentHours(
  workStart: string,
  clockIn: string,
  withMedicalCertificate = false,
): number | null {
  if (!workStart || !clockIn) {
    return null;
  }

  const diffMinutes = timeToMinutes(workStart) - timeToMinutes(clockIn);
  if (!isMultipleOf30Minutes(diffMinutes)) {
    return null;
  }

  return applyMedicalCertificate(roundHours(diffMinutes / 60), withMedicalCertificate);
}

export function calculateExitAdjustmentHours(
  workEnd: string,
  clockOut: string,
  withMedicalCertificate = false,
): number | null {
  if (!workEnd || !clockOut) {
    return null;
  }

  const diffMinutes = timeToMinutes(clockOut) - timeToMinutes(workEnd);
  if (!isMultipleOf30Minutes(diffMinutes)) {
    return null;
  }

  return applyMedicalCertificate(roundHours(diffMinutes / 60), withMedicalCertificate);
}

export function calculateDuringDayHours(
  duringDayKind: DuringDayKind,
  duringDayHours: number,
  withMedicalCertificate = false,
): number | null {
  if (!isValidDuringDayHours(duringDayHours, duringDayKind)) {
    return null;
  }

  const raw = duringDayKind === 'LUNCH_EXTRA' ? duringDayHours : -duringDayHours;
  return applyMedicalCertificate(roundHours(raw), withMedicalCertificate);
}

export interface CalculateAdjustmentHoursInput {
  adjustmentType: AdjustmentType;
  workStart?: string;
  workEnd?: string;
  clockIn?: string;
  clockOut?: string;
  duringDayKind?: DuringDayKind;
  duringDayHours?: number;
  withMedicalCertificate?: boolean;
}

export function calculateAdjustmentHours(input: CalculateAdjustmentHoursInput): number | null {
  const { adjustmentType, withMedicalCertificate = false } = input;

  switch (adjustmentType) {
    case 'ENTRY':
      return calculateEntryAdjustmentHours(
        input.workStart ?? '',
        input.clockIn ?? '',
        withMedicalCertificate,
      );
    case 'EXIT':
      return calculateExitAdjustmentHours(
        input.workEnd ?? '',
        input.clockOut ?? '',
        withMedicalCertificate,
      );
    case 'DURING_DAY':
      if (!input.duringDayKind || input.duringDayHours === undefined) {
        return null;
      }
      return calculateDuringDayHours(
        input.duringDayKind,
        input.duringDayHours,
        withMedicalCertificate,
      );
    default:
      return null;
  }
}

export const LUNCH_EXTRA_HOUR_OPTIONS = [0.5, 1] as const;
export const DAY_DEFICIT_HOUR_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4] as const;

export function getDuringDayHourOptions(duringDayKind: DuringDayKind) {
  return duringDayKind === 'LUNCH_EXTRA' ? LUNCH_EXTRA_HOUR_OPTIONS : DAY_DEFICIT_HOUR_OPTIONS;
}
