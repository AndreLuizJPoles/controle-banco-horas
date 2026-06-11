import bcrypt from 'bcryptjs';
import { Role, UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { AppError } from '../middlewares/errorHandler';
import type { LoginInput, RegisterInput } from '../schemas/auth';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  workStartTime: string;
  workEndTime: string;
}

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  workStartTime: string;
  workEndTime: string;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    workStartTime: user.workStartTime,
    workEndTime: user.workEndTime,
  };
}

function tokenPayload(user: AuthUser) {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export async function register(data: RegisterInput): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });

  if (existing) {
    throw new AppError('E-mail já cadastrado', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: Role.USER,
      status: UserStatus.PENDING,
      workStartTime: data.workStartTime,
      workEndTime: data.workEndTime,
    },
  });

  return toAuthUser(user);
}

export async function login(data: LoginInput): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new AppError('Credenciais inválidas', 401);
  }

  const validPassword = await bcrypt.compare(data.password, user.password);

  if (!validPassword) {
    throw new AppError('Credenciais inválidas', 401);
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError('Conta aguardando aprovação ou rejeitada', 403);
  }

  const authUser = toAuthUser(user);
  const payload = tokenPayload(authUser);

  return {
    user: authUser,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new AppError('Token inválido', 401);
  }

  const authUser = toAuthUser(user);
  const newPayload = tokenPayload(authUser);

  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload),
  };
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  return toAuthUser(user);
}
