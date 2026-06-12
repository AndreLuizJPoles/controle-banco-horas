export type AdjustmentType = 'ENTRY' | 'EXIT' | 'OTHER' | 'ABSENT';
export type DuringDayKind = 'ADD' | 'SUBTRACT';

export const LUNCH_BREAK_HOURS = 1;

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

function isValidOtherHours(hours: number): boolean {
  return hours >= 0.5 && Math.round(hours * 2) === hours * 2;
}

function applyMedicalCertificate(raw: number, withMedicalCertificate: boolean): number {
  if (withMedicalCertificate && raw < 0) {
    return 0;
  }
  return raw;
}

export function calculateWorkDayHours(workStart: string, workEnd: string): number | null {
  if (!workStart || !workEnd) {
    return null;
  }

  const minutes = timeToMinutes(workEnd) - timeToMinutes(workStart);
  if (minutes <= 0) {
    return null;
  }

  return roundHours(minutes / 60);
}

export function calculateServiceHours(workStart: string, workEnd: string): number | null {
  const gross = calculateWorkDayHours(workStart, workEnd);
  if (gross === null) {
    return null;
  }

  const service = roundHours(gross - LUNCH_BREAK_HOURS);
  return service > 0 ? service : null;
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

export function calculateOtherHours(
  duringDayKind: DuringDayKind,
  duringDayHours: number,
  withMedicalCertificate = false,
): number | null {
  if (!isValidOtherHours(duringDayHours)) {
    return null;
  }

  const raw = duringDayKind === 'ADD' ? duringDayHours : -duringDayHours;
  return applyMedicalCertificate(roundHours(raw), withMedicalCertificate);
}

export function calculateAbsentHours(
  workStart: string,
  workEnd: string,
  withMedicalCertificate = false,
): number | null {
  const serviceHours = calculateServiceHours(workStart, workEnd);
  if (serviceHours === null) {
    return null;
  }

  return applyMedicalCertificate(-serviceHours, withMedicalCertificate);
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
    case 'OTHER':
      if (!input.duringDayKind || input.duringDayHours === undefined) {
        return null;
      }
      return calculateOtherHours(
        input.duringDayKind,
        input.duringDayHours,
        withMedicalCertificate,
      );
    case 'ABSENT':
      return calculateAbsentHours(
        input.workStart ?? '',
        input.workEnd ?? '',
        withMedicalCertificate,
      );
    default:
      return null;
  }
}

export const OTHER_HOUR_OPTIONS = Array.from({ length: 48 }, (_, index) => (index + 1) * 0.5);

export function canUseMedicalCertificate(input: CalculateAdjustmentHoursInput): boolean {
  switch (input.adjustmentType) {
    case 'ABSENT':
      return true;
    case 'OTHER':
      return input.duringDayKind === 'SUBTRACT';
    case 'ENTRY':
    case 'EXIT': {
      const rawHours = calculateAdjustmentHours({ ...input, withMedicalCertificate: false });
      return rawHours !== null && rawHours < 0;
    }
    default:
      return false;
  }
}
