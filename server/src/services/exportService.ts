import { EntryStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function buildCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\n');
}

async function getApprovedEntries(userId?: string) {
  const entries = await prisma.hourEntry.findMany({
    where: {
      status: EntryStatus.APPROVED,
      ...(userId ? { userId } : {}),
    },
    include: {
      user: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
    orderBy: [{ user: { name: 'asc' } }, { date: 'asc' }],
  });

  return entries;
}

function entriesToCsv(entries: Awaited<ReturnType<typeof getApprovedEntries>>): string {
  const header = [
    'nome_usuario',
    'data',
    'entrada',
    'saida',
    'horas',
    'com_atestado',
    'descricao',
    'status',
    'aprovado_por',
  ];
  const rows = entries.map((entry) => [
    entry.user.name,
    formatDate(entry.date),
    entry.clockIn ?? '',
    entry.clockOut ?? '',
    Number(entry.hours).toFixed(2),
    entry.withMedicalCertificate ? 'sim' : 'nao',
    entry.description,
    entry.status,
    entry.approvedBy?.name ?? '',
  ]);

  return buildCsv([header, ...rows]);
}

export async function exportUserCsv(userId: string): Promise<{ csv: string; filename: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const entries = await getApprovedEntries(userId);
  const safeName = user.name.replace(/[^a-zA-Z0-9_-]/g, '_');

  return {
    csv: entriesToCsv(entries),
    filename: `banco_horas_${safeName}.csv`,
  };
}

export async function exportAllCsv(): Promise<{ csv: string; filename: string }> {
  const entries = await getApprovedEntries();

  return {
    csv: entriesToCsv(entries),
    filename: 'banco_horas_todos.csv',
  };
}
