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

export interface HourEntry {
  id: string;
  userId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
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
