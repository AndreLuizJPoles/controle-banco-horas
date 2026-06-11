import { UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';

export interface SerializedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  createdAt: string;
}

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  createdAt: Date;
}): SerializedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function listUsers(status?: UserStatus): Promise<SerializedUser[]> {
  const users = await prisma.user.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return users.map(serializeUser);
}

export async function approveUser(id: string): Promise<SerializedUser> {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  if (user.status !== UserStatus.PENDING) {
    throw new AppError('Usuário não está pendente', 400);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: UserStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return serializeUser(updated);
}

export async function rejectUser(id: string): Promise<SerializedUser> {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  if (user.status !== UserStatus.PENDING) {
    throw new AppError('Usuário não está pendente', 400);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: UserStatus.REJECTED },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return serializeUser(updated);
}
