import { z } from 'zod';

export const createEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  hours: z.coerce.number().refine((v) => !Number.isNaN(v), 'Horas inválidas'),
  description: z.string().min(1, 'Descrição é obrigatória'),
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
