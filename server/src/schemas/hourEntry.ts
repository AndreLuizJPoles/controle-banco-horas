import { z } from 'zod';
import { timeSchema } from './time';

const entryBase = {
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  withMedicalCertificate: z.boolean().default(false),
};

export const createEntrySchema = z
  .discriminatedUnion('adjustmentType', [
    z.object({
      adjustmentType: z.literal('ENTRY'),
      ...entryBase,
      clockIn: timeSchema,
    }),
    z.object({
      adjustmentType: z.literal('EXIT'),
      ...entryBase,
      clockOut: timeSchema,
    }),
    z.object({
      adjustmentType: z.literal('DURING_DAY'),
      ...entryBase,
      duringDayKind: z.enum(['LUNCH_EXTRA', 'DAY_DEFICIT']),
      duringDayHours: z.number().multipleOf(0.5).min(0.5),
    }),
  ])
  .superRefine((data, ctx) => {
    if (
      data.adjustmentType === 'DURING_DAY' &&
      data.duringDayKind === 'LUNCH_EXTRA' &&
      data.duringDayHours > 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Horas a mais no almoço: máximo de 1 h (0,5 ou 1,0)',
        path: ['duringDayHours'],
      });
    }
  });

export const hourEntryQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  userId: z.string().uuid().optional(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type HourEntryQueryInput = z.infer<typeof hourEntryQuerySchema>;
