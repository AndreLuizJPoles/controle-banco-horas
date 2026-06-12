import { CalendarX, Clock, LogIn, LogOut, Stethoscope } from 'lucide-react';
import type { HourEntry } from '../types';
import {
  formatAdjustmentLabel,
  formatHours,
  getAdjustmentTypeLabel,
} from '../types';
import { Badge } from './Badge';

function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function groupEntriesByDate(entries: HourEntry[]): [string, HourEntry[]][] {
  const groups = new Map<string, HourEntry[]>();

  for (const entry of entries) {
    const list = groups.get(entry.date) ?? [];
    list.push(entry);
    groups.set(entry.date, list);
  }

  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
}

function AdjustmentIcon({ type }: { type: HourEntry['adjustmentType'] }) {
  const className = 'h-4 w-4 shrink-0';

  switch (type) {
    case 'ENTRY':
      return <LogIn className={className} />;
    case 'EXIT':
      return <LogOut className={className} />;
    case 'OTHER':
      return <Clock className={className} />;
    case 'ABSENT':
      return <CalendarX className={className} />;
    default:
      return <Clock className={className} />;
  }
}

function statusBorderClass(status: HourEntry['status']): string {
  switch (status) {
    case 'APPROVED':
      return 'border-green-200';
    case 'REJECTED':
      return 'border-red-200';
    default:
      return 'border-yellow-200';
  }
}

interface EntryTimelineProps {
  entries: HourEntry[];
}

export function EntryTimeline({ entries }: EntryTimelineProps) {
  const groups = groupEntriesByDate(entries);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
        Nenhum lançamento no período selecionado.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(([date, dayEntries]) => (
        <section key={date}>
          <h3 className="mb-4 text-sm font-semibold capitalize text-slate-700">
            {formatDateLabel(date)}
          </h3>

          <ol className="relative space-y-0">
            {dayEntries.map((entry, index) => {
              const isLast = index === dayEntries.length - 1;

              return (
                <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast && (
                    <span
                      className="absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-0.5 bg-slate-200"
                      aria-hidden
                    />
                  )}

                  <span
                    className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                      entry.status === 'APPROVED'
                        ? 'border-green-500 text-green-600'
                        : entry.status === 'REJECTED'
                          ? 'border-red-400 text-red-500'
                          : 'border-yellow-400 text-yellow-600'
                    }`}
                    aria-hidden
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                  </span>

                  <article
                    className={`min-w-0 flex-1 rounded-xl border bg-white p-4 shadow-sm ${statusBorderClass(entry.status)}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <AdjustmentIcon type={entry.adjustmentType} />
                        <span>{getAdjustmentTypeLabel(entry.adjustmentType)}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-normal text-slate-600">
                          {formatAdjustmentLabel(entry)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            entry.hours >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatHours(entry.hours)}
                        </span>
                        <Badge status={entry.status} />
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">{entry.description}</p>

                    {entry.withMedicalCertificate && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                        <Stethoscope className="h-3.5 w-3.5" />
                        Com atestado médico
                      </p>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
