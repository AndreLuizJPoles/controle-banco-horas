export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface CalculateEntryHoursInput {
  workStart: string;
  workEnd: string;
  clockIn: string;
  clockOut: string;
  withMedicalCertificate?: boolean;
}

export function calculateEntryHours(input: CalculateEntryHoursInput): number | null {
  const { workStart, workEnd, clockIn, clockOut, withMedicalCertificate = false } = input;

  if (!workStart || !workEnd || !clockIn || !clockOut) {
    return null;
  }

  const expectedMinutes = timeToMinutes(workEnd) - timeToMinutes(workStart);
  const workedMinutes = timeToMinutes(clockOut) - timeToMinutes(clockIn);

  if (workedMinutes <= 0 || expectedMinutes <= 0) {
    return null;
  }

  const raw = roundHours((workedMinutes - expectedMinutes) / 60);

  if (withMedicalCertificate && raw < 0) {
    return 0;
  }

  return raw;
}
