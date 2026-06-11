import { z } from 'zod';
import { isValidTime, timeToMinutes } from '../lib/workHours';

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido (HH:mm)')
  .refine(isValidTime, 'Horário inválido (HH:mm)');

export function workTimeRangeRefine(
  data: { workStartTime?: string; workEndTime?: string },
  ctx: z.RefinementCtx,
): void {
  if (data.workStartTime && data.workEndTime) {
    if (timeToMinutes(data.workEndTime) <= timeToMinutes(data.workStartTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Horário de saída deve ser posterior ao de entrada',
        path: ['workEndTime'],
      });
    }
  }
}

export function clockTimeRangeRefine(
  data: { clockIn?: string; clockOut?: string },
  ctx: z.RefinementCtx,
): void {
  if (data.clockIn && data.clockOut) {
    if (timeToMinutes(data.clockOut) <= timeToMinutes(data.clockIn)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Horário de saída deve ser posterior ao de entrada',
        path: ['clockOut'],
      });
    }
  }
}
