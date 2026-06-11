import { z } from 'zod';
import { UserStatus } from '@prisma/client';
import { timeSchema, workTimeRangeRefine } from './time';

export const userQuerySchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
});

export const updateProfileSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
    email: z.string().email('E-mail inválido').optional(),
    workStartTime: timeSchema.optional(),
    workEndTime: timeSchema.optional(),
  })
  .superRefine(workTimeRangeRefine)
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
