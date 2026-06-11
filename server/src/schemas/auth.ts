import { z } from 'zod';
import { clockTimeRangeRefine, timeSchema, workTimeRangeRefine } from './time';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    workStartTime: timeSchema.default('08:00'),
    workEndTime: timeSchema.default('17:00'),
  })
  .superRefine(workTimeRangeRefine);

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
