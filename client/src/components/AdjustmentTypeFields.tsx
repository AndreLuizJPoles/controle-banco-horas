import type { AdjustmentType, DuringDayKind } from '../types';
import { calculateServiceHours, OTHER_HOUR_OPTIONS } from '../lib/workHours';
import { Input } from './Input';
import { Select } from './Select';

interface AdjustmentTypeFieldsProps {
  adjustmentType: AdjustmentType;
  clockIn: string;
  clockOut: string;
  duringDayKind: DuringDayKind;
  duringDayHours: number;
  workStartTime?: string;
  workEndTime?: string;
  onClockInChange: (value: string) => void;
  onClockOutChange: (value: string) => void;
  onDuringDayKindChange: (value: DuringDayKind) => void;
  onDuringDayHoursChange: (value: number) => void;
}

export function AdjustmentTypeFields({
  adjustmentType,
  clockIn,
  clockOut,
  duringDayKind,
  duringDayHours,
  workStartTime,
  workEndTime,
  onClockInChange,
  onClockOutChange,
  onDuringDayKindChange,
  onDuringDayHoursChange,
}: AdjustmentTypeFieldsProps) {
  if (adjustmentType === 'ENTRY') {
    return (
      <Input
        label="Horário real de entrada"
        type="time"
        step={1800}
        value={clockIn}
        onChange={(e) => onClockInChange(e.target.value)}
        required
      />
    );
  }

  if (adjustmentType === 'EXIT') {
    return (
      <Input
        label="Horário real de saída"
        type="time"
        step={1800}
        value={clockOut}
        onChange={(e) => onClockOutChange(e.target.value)}
        required
      />
    );
  }

  if (adjustmentType === 'ABSENT') {
    const serviceHours = calculateServiceHours(workStartTime ?? '', workEndTime ?? '');

    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Será descontada a jornada do dia, descontando 1 h de almoço
        {serviceHours !== null && (
          <span className="font-semibold"> ({serviceHours.toFixed(1).replace('.0', '')} h)</span>
        )}
        .
      </div>
    );
  }

  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700">Operação</legend>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="duringDayKind"
            value="ADD"
            checked={duringDayKind === 'ADD'}
            onChange={() => onDuringDayKindChange('ADD')}
            className="border-slate-300"
          />
          Adicionar horas
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="duringDayKind"
            value="SUBTRACT"
            checked={duringDayKind === 'SUBTRACT'}
            onChange={() => onDuringDayKindChange('SUBTRACT')}
            className="border-slate-300"
          />
          Retirar horas
        </label>
      </fieldset>
      <Select
        label="Quantidade de horas"
        value={String(duringDayHours)}
        onChange={(e) => onDuringDayHoursChange(Number(e.target.value))}
        options={OTHER_HOUR_OPTIONS.map((h) => ({
          value: String(h),
          label: `${h}h`,
        }))}
        required
      />
    </>
  );
}
