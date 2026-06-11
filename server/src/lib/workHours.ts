const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

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

export interface CalculateEntryHoursInput {
  workStart: string;
  workEnd: string;
  clockIn: string;
  clockOut: string;
  withMedicalCertificate?: boolean;
}

export function calculateEntryHours(input: CalculateEntryHoursInput): number {
  const { workStart, workEnd, clockIn, clockOut, withMedicalCertificate = false } = input;

  const expectedMinutes = timeToMinutes(workEnd) - timeToMinutes(workStart);
  const workedMinutes = timeToMinutes(clockOut) - timeToMinutes(clockIn);

  if (workedMinutes <= 0) {
    throw new Error('Horário de saída deve ser posterior ao de entrada');
  }

  if (expectedMinutes <= 0) {
    throw new Error('Jornada de trabalho inválida');
  }

  const raw = roundHours((workedMinutes - expectedMinutes) / 60);

  if (withMedicalCertificate && raw < 0) {
    return 0;
  }

  return raw;
}
