import type { HourSummary } from '../types';
import { formatHours } from '../types';

interface HourSummaryCardsProps {
  summary: HourSummary;
  loading?: boolean;
}

const cards = [
  {
    key: 'approvedHours' as const,
    label: 'Horas aprovadas',
    colorClass: 'border-green-200 bg-green-50 text-green-700',
    valueClass: 'text-green-600',
  },
  {
    key: 'pendingHours' as const,
    label: 'Horas pendentes',
    colorClass: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    valueClass: 'text-yellow-600',
  },
  {
    key: 'totalHours' as const,
    label: 'Total',
    colorClass: 'border-blue-200 bg-blue-50 text-blue-700',
    valueClass: 'text-blue-600',
  },
];

export function HourSummaryCards({ summary, loading }: HourSummaryCardsProps) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {cards.map(({ key, label, colorClass, valueClass }) => (
        <div key={key} className={`rounded-xl border p-5 shadow-sm ${colorClass}`}>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${valueClass}`}>
            {loading ? '...' : formatHours(summary[key])}
          </p>
        </div>
      ))}
    </div>
  );
}
