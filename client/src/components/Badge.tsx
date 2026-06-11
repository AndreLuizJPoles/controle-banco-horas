import type { EntryStatus, UserStatus } from '../types';

type Status = EntryStatus | UserStatus;

const styles: Record<Status, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-700',
  ACTIVE: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const labels: Record<Status, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  ACTIVE: 'Ativo',
  REJECTED: 'Rejeitado',
};

interface BadgeProps {
  status: Status;
}

export function Badge({ status }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
