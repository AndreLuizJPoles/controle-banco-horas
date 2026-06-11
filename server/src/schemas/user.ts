import { z } from 'zod';
import { UserStatus } from '@prisma/client';

export const userQuerySchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
