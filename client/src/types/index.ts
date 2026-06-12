export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  workStartTime: string;
  workEndTime: string;
}

export type Role = 'USER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';
export type EntryStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AdjustmentType = 'ENTRY' | 'EXIT' | 'OTHER' | 'ABSENT';
export type DuringDayKind = 'ADD' | 'SUBTRACT';

export interface HourEntry {
  id: string;
  userId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  adjustmentType: AdjustmentType | null;
  duringDayKind: DuringDayKind | null;
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

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function formatHours(hours: number): string {
  const sign = hours >= 0 ? '+' : '';
  return `${sign}${hours.toFixed(1)}h`;
}

export function formatTime(value: string | null): string {
  return value ?? '—';
}

export function getAdjustmentTypeLabel(type: AdjustmentType | null): string {
  if (!type) return 'Legado';
  switch (type) {
    case 'ENTRY':
      return 'Entrada';
    case 'EXIT':
      return 'Saída';
    case 'OTHER':
      return 'Outros';
    case 'ABSENT':
      return 'Não foi no dia';
  }
}

export function formatAdjustmentLabel(entry: HourEntry): string {
  if (!entry.adjustmentType) {
    if (entry.clockIn && entry.clockOut) {
      return `${entry.clockIn} – ${entry.clockOut}`;
    }
    if (entry.clockIn) return entry.clockIn;
    if (entry.clockOut) return entry.clockOut;
    return '—';
  }

  switch (entry.adjustmentType) {
    case 'ENTRY':
      return entry.clockIn ?? '—';
    case 'EXIT':
      return entry.clockOut ?? '—';
    case 'OTHER': {
      const amount = entry.duringDayHours ?? 0;
      if (entry.duringDayKind === 'ADD') {
        return `+${amount}h`;
      }
      return `-${amount}h`;
    }
    case 'ABSENT':
      return 'Dia inteiro';
  }
}
