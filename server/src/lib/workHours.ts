const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export type DuringDayKind = 'LUNCH_EXTRA' | 'DAY_DEFICIT';

export const LUNCH_EXTRA_MAX_HOURS = 1;

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

function assertValidDuringDayHours(hours: number, duringDayKind: DuringDayKind): void {
  if (hours < 0.5 || Math.round(hours * 2) !== hours * 2) {
    throw new Error('Quantidade deve ser múltipla de 0,5 h');
  }
  if (duringDayKind === 'LUNCH_EXTRA' && hours > LUNCH_EXTRA_MAX_HOURS) {
    throw new Error('Horas a mais no almoço: máximo de 1 h (0,5 ou 1,0)');
  }
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

export function calculateDuringDayHours(
  duringDayKind: DuringDayKind,
  duringDayHours: number,
  withMedicalCertificate = false,
): number {
  assertValidDuringDayHours(duringDayHours, duringDayKind);
  const raw = duringDayKind === 'LUNCH_EXTRA' ? duringDayHours : -duringDayHours;
  return applyMedicalCertificate(roundHours(raw), withMedicalCertificate);
}
