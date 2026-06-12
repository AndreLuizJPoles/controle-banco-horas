import { EntryStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  calculateDuringDayHours,
  calculateEntryAdjustmentHours,
  calculateExitAdjustmentHours,
} from '../lib/workHours';
import { AppError } from '../middlewares/errorHandler';
import type { CreateEntryInput } from '../schemas/hourEntry';

export interface SerializedHourEntry {
  id: string;
  userId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  adjustmentType: 'ENTRY' | 'EXIT' | 'DURING_DAY' | null;
  duringDayKind: 'LUNCH_EXTRA' | 'DAY_DEFICIT' | null;
  duringDayHours: number | null;
  withMedicalCertificate: boolean;
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

export interface HourSummary {
  approvedHours: number;
  pendingHours: number;
  totalHours: number;
}

type EntryWithRelations = Prisma.HourEntryGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    approvedBy: { select: { id: true; name: true } };
  };
}>;

function effectiveHours(entry: { hours: Prisma.Decimal | number }): number {
  return Number(entry.hours);
}

function serializeEntry(entry: EntryWithRelations): SerializedHourEntry {
  return {
    id: entry.id,
    userId: entry.userId,
    date: entry.date.toISOString().split('T')[0],
    clockIn: entry.clockIn,
    clockOut: entry.clockOut,
    adjustmentType: entry.adjustmentType,
    duringDayKind: entry.duringDayKind,
    duringDayHours: entry.duringDayHours !== null ? Number(entry.duringDayHours) : null,
    withMedicalCertificate: entry.withMedicalCertificate,
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

function calculateHoursForEntry(
  user: { workStartTime: string; workEndTime: string },
  data: CreateEntryInput,
): number {
  try {
    switch (data.adjustmentType) {
      case 'ENTRY':
        return calculateEntryAdjustmentHours(
          user.workStartTime,
          data.clockIn,
          data.withMedicalCertificate,
        );
      case 'EXIT':
        return calculateExitAdjustmentHours(
          user.workEndTime,
          data.clockOut,
          data.withMedicalCertificate,
        );
      case 'DURING_DAY':
        return calculateDuringDayHours(
          data.duringDayKind,
          data.duringDayHours,
          data.withMedicalCertificate,
        );
    }
  } catch (error) {
    throw new AppError(error instanceof Error ? error.message : 'Erro ao calcular horas', 400);
  }
}

export async function createHourEntry(userId: string, data: CreateEntryInput): Promise<SerializedHourEntry> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const hours = calculateHoursForEntry(user, data);

  const entryData: Prisma.HourEntryCreateInput = {
    user: { connect: { id: userId } },
    date: new Date(data.date),
    withMedicalCertificate: data.withMedicalCertificate,
    hours,
    description: data.description,
    status: EntryStatus.PENDING,
    adjustmentType: data.adjustmentType,
    clockIn: null,
    clockOut: null,
    duringDayKind: null,
    duringDayHours: null,
  };

  switch (data.adjustmentType) {
    case 'ENTRY':
      entryData.clockIn = data.clockIn;
      break;
    case 'EXIT':
      entryData.clockOut = data.clockOut;
      break;
    case 'DURING_DAY':
      entryData.duringDayKind = data.duringDayKind;
      entryData.duringDayHours = data.duringDayHours;
      break;
  }

  const entry = await prisma.hourEntry.create({
    data: entryData,
    include: entryInclude,
  });

  return serializeEntry(entry);
}

export async function getSummary(userId: string): Promise<HourSummary> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const entries = await prisma.hourEntry.findMany({
    where: {
      userId,
      status: { in: [EntryStatus.APPROVED, EntryStatus.PENDING] },
    },
    select: { hours: true, status: true },
  });

  let approvedHours = 0;
  let pendingHours = 0;

  for (const entry of entries) {
    const value = effectiveHours(entry);
    if (entry.status === EntryStatus.APPROVED) {
      approvedHours += value;
    } else {
      pendingHours += value;
    }
  }

  approvedHours = Math.round(approvedHours * 100) / 100;
  pendingHours = Math.round(pendingHours * 100) / 100;

  return {
    approvedHours,
    pendingHours,
    totalHours: Math.round((approvedHours + pendingHours) * 100) / 100,
  };
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
