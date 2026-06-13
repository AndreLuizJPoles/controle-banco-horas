import { Request, Response, NextFunction } from 'express';
import { UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from './errorHandler';

export async function requireActiveUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError('Não autenticado', 401));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      next(new AppError('Conta não ativa', 403));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
