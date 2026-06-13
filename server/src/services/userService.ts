import bcrypt from 'bcryptjs';
import { Role, UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import type { AuthUser } from './authService';
import type { ChangePasswordInput, UpdateProfileInput } from '../schemas/user';

export interface SerializedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  workStartTime: string;
  workEndTime: string;
  createdAt: string;
}

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  workStartTime: string;
  workEndTime: string;
  createdAt: Date;
}): SerializedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    workStartTime: user.workStartTime,
    workEndTime: user.workEndTime,
    createdAt: user.createdAt.toISOString(),
  };
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  workStartTime: true,
  workEndTime: true,
  createdAt: true,
} as const;

export async function listUsers(status?: UserStatus): Promise<SerializedUser[]> {
  const users = await prisma.user.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    select: userSelect,
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
    select: userSelect,
  });

  return serializeUser(updated);
}

export async function rejectUser(id: string, requesterId: string): Promise<SerializedUser> {
  if (id === requesterId) {
    throw new AppError('Não é possível rejeitar a própria conta', 400);
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  if (user.role === Role.ADMIN) {
    throw new AppError('Não é possível rejeitar um administrador', 400);
  }

  if (user.status === UserStatus.REJECTED) {
    throw new AppError('Usuário já está rejeitado', 400);
  }

  if (user.status !== UserStatus.PENDING && user.status !== UserStatus.ACTIVE) {
    throw new AppError('Usuário não pode ser rejeitado', 400);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: UserStatus.REJECTED },
    select: userSelect,
  });

  return serializeUser(updated);
}

export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('E-mail já cadastrado', 409);
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.workStartTime !== undefined && { workStartTime: data.workStartTime }),
      ...(data.workEndTime !== undefined && { workEndTime: data.workEndTime }),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    status: updated.status,
    workStartTime: updated.workStartTime,
    workEndTime: updated.workEndTime,
  };
}

export async function changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const validPassword = await bcrypt.compare(data.currentPassword, user.password);

  if (!validPassword) {
    throw new AppError('Senha atual incorreta', 400);
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}
