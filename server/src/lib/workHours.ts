const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export type DuringDayKind = 'ADD' | 'SUBTRACT';

export const LUNCH_BREAK_HOURS = 1;

export function isValidTime(value: string): boolean {
  return TIME_REGEX.test(value);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

function assertMultipleOf30Minutes(minutes: number): void {
  if (minutes === 0 || minutes % 30 !== 0) {
    throw new Error('A diferença deve ser múltipla de 30 minutos (0,5 h)');
  }
}

function assertValidOtherHours(hours: number): void {
  if (hours < 0.5 || Math.round(hours * 2) !== hours * 2) {
    throw new Error('Quantidade deve ser múltipla de 0,5 h');
  }
}

function applyMedicalCertificate(raw: number, withMedicalCertificate: boolean): number {
  if (withMedicalCertificate && raw < 0) {
    return 0;
  }
  return raw;
}

export function calculateWorkDayHours(workStart: string, workEnd: string): number {
  const minutes = timeToMinutes(workEnd) - timeToMinutes(workStart);
  if (minutes <= 0) {
    throw new Error('Jornada de trabalho inválida');
  }
  return roundHours(minutes / 60);
}

export function calculateServiceHours(workStart: string, workEnd: string): number {
  const gross = calculateWorkDayHours(workStart, workEnd);
  const service = roundHours(gross - LUNCH_BREAK_HOURS);
  if (service <= 0) {
    throw new Error('Jornada de trabalho inválida');
  }
  return service;
}

export function calculateEntryAdjustmentHours(
  workStart: string,
  clockIn: string,
  withMedicalCertificate = false,
): number {
  const diffMinutes = timeToMinutes(workStart) - timeToMinutes(clockIn);
  assertMultipleOf30Minutes(diffMinutes);
  return applyMedicalCertificate(roundHours(diffMinutes / 60), withMedicalCertificate);
}

export function calculateExitAdjustmentHours(
  workEnd: string,
  clockOut: string,
  withMedicalCertificate = false,
): number {
  const diffMinutes = timeToMinutes(clockOut) - timeToMinutes(workEnd);
  assertMultipleOf30Minutes(diffMinutes);
  return applyMedicalCertificate(roundHours(diffMinutes / 60), withMedicalCertificate);
}

export function calculateOtherHours(
  duringDayKind: DuringDayKind,
  duringDayHours: number,
  withMedicalCertificate = false,
): number {
  assertValidOtherHours(duringDayHours);
  const raw = duringDayKind === 'ADD' ? duringDayHours : -duringDayHours;
  return applyMedicalCertificate(roundHours(raw), withMedicalCertificate);
}

export function calculateAbsentHours(
  workStart: string,
  workEnd: string,
  withMedicalCertificate = false,
): number {
  const raw = -calculateServiceHours(workStart, workEnd);
  return applyMedicalCertificate(raw, withMedicalCertificate);
}

/** @deprecated Use calculateOtherHours */
export function calculateDuringDayHours(
  duringDayKind: DuringDayKind,
  duringDayHours: number,
  withMedicalCertificate = false,
): number {
  return calculateOtherHours(duringDayKind, duringDayHours, withMedicalCertificate);
}

export interface CalculateHoursInput {
  adjustmentType: 'ENTRY' | 'EXIT' | 'OTHER' | 'ABSENT';
  workStart: string;
  workEnd: string;
  clockIn?: string;
  clockOut?: string;
  duringDayKind?: DuringDayKind;
  duringDayHours?: number;
}

export function canUseMedicalCertificate(input: CalculateHoursInput): boolean {
  switch (input.adjustmentType) {
    case 'ABSENT':
      return true;
    case 'OTHER':
      return input.duringDayKind === 'SUBTRACT';
    case 'ENTRY':
      if (!input.clockIn) {
        return false;
      }
      try {
        return calculateEntryAdjustmentHours(input.workStart, input.clockIn, false) < 0;
      } catch {
        return false;
      }
    case 'EXIT':
      if (!input.clockOut) {
        return false;
      }
      try {
        return calculateExitAdjustmentHours(input.workEnd, input.clockOut, false) < 0;
      } catch {
        return false;
      }
    default:
      return false;
  }
}
