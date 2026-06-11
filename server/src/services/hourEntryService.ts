import { EntryStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import type { CreateEntryInput } from '../schemas/hourEntry';

export interface SerializedHourEntry {
  id: string;
  userId: string;
  date: string;
  hours: number;
  description: string;
  status: EntryStatus;
  approvedById: string | null;
  approvedBy: { id: string; name: string } | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
}

type EntryWithRelations = Prisma.HourEntryGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    approvedBy: { select: { id: true; name: true } };
  };
}>;

function serializeEntry(entry: EntryWithRelations): SerializedHourEntry {
  return {
    id: entry.id,
    userId: entry.userId,
    date: entry.date.toISOString().split('T')[0],
    hours: Number(entry.hours),
    description: entry.description,
    status: entry.status,
    approvedById: entry.approvedById,
    approvedBy: entry.approvedBy ? { id: entry.approvedBy.id, name: entry.approvedBy.name } : null,
    approvedAt: entry.approvedAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    ...(entry.user && { user: entry.user }),
  };
}

const entryInclude = {
  user: { select: { id: true, name: true, email: true } },
  approvedBy: { select: { id: true, name: true } },
} as const;

export async function listHourEntries(params: {
  requesterId: string;
  requesterRole: Role;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Prisma.HourEntryWhereInput = {};

  if (params.requesterRole === Role.USER) {
    where.userId = params.requesterId;
  } else if (params.userId) {
    where.userId = params.userId;
  }

  if (params.startDate || params.endDate) {
    where.date = {};
    if (params.startDate) {
      where.date.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      where.date.lte = new Date(params.endDate);
    }
  }

  const [entries, total] = await Promise.all([
    prisma.hourEntry.findMany({
      where,
      include: entryInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.hourEntry.count({ where }),
  ]);

  return {
    data: entries.map(serializeEntry),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function createHourEntry(userId: string, data: CreateEntryInput): Promise<SerializedHourEntry> {
  const entry = await prisma.hourEntry.create({
    data: {
      userId,
      date: new Date(data.date),
      hours: data.hours,
      description: data.description,
      status: EntryStatus.PENDING,
    },
    include: entryInclude,
  });

  return serializeEntry(entry);
}

export async function getBalance(userId: string): Promise<{ balance: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const result = await prisma.hourEntry.aggregate({
    where: { userId, status: EntryStatus.APPROVED },
    _sum: { hours: true },
  });

  return { balance: Number(result._sum.hours ?? 0) };
}

export async function approveHourEntry(entryId: string, adminId: string): Promise<SerializedHourEntry> {
  const entry = await prisma.hourEntry.findUnique({ where: { id: entryId } });

  if (!entry) {
    throw new AppError('Lançamento não encontrado', 404);
  }

  if (entry.status !== EntryStatus.PENDING) {
    throw new AppError('Lançamento não está pendente', 400);
  }

  const updated = await prisma.hourEntry.update({
    where: { id: entryId },
    data: {
      status: EntryStatus.APPROVED,
      approvedById: adminId,
      approvedAt: new Date(),
    },
    include: entryInclude,
  });

  return serializeEntry(updated);
}

export async function rejectHourEntry(entryId: string, adminId: string): Promise<SerializedHourEntry> {
  const entry = await prisma.hourEntry.findUnique({ where: { id: entryId } });

  if (!entry) {
    throw new AppError('Lançamento não encontrado', 404);
  }

  if (entry.status !== EntryStatus.PENDING) {
    throw new AppError('Lançamento não está pendente', 400);
  }

  const updated = await prisma.hourEntry.update({
    where: { id: entryId },
    data: {
      status: EntryStatus.REJECTED,
      approvedById: adminId,
      approvedAt: new Date(),
    },
    include: entryInclude,
  });

  return serializeEntry(updated);
}
