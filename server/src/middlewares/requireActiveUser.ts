import { Request, Response, NextFunction } from 'express';
import { UserStatus } from '@prisma/client';
import { AppError } from './errorHandler';

export function requireActiveUser(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError('Não autenticado', 401));
    return;
  }

  if (req.user.status !== UserStatus.ACTIVE) {
    next(new AppError('Conta não ativa', 403));
    return;
  }

  next();
}
