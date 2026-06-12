import type { AdjustmentType, DuringDayKind } from '../types';
import { getDuringDayHourOptions, LUNCH_EXTRA_MAX_HOURS } from '../lib/workHours';
import { Input } from './Input';
import { Select } from './Select';

interface AdjustmentTypeFieldsProps {
  adjustmentType: AdjustmentType;
  clockIn: string;
  clockOut: string;
  duringDayKind: DuringDayKind;
  duringDayHours: number;
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

  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700">Motivo</legend>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="duringDayKind"
            value="LUNCH_EXTRA"
            checked={duringDayKind === 'LUNCH_EXTRA'}
            onChange={() => {
              onDuringDayKindChange('LUNCH_EXTRA');
              if (duringDayHours > LUNCH_EXTRA_MAX_HOURS) {
                onDuringDayHoursChange(LUNCH_EXTRA_MAX_HOURS);
              }
            }}
            className="border-slate-300"
          />
          Almoço (horas a mais)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="duringDayKind"
            value="DAY_DEFICIT"
            checked={duringDayKind === 'DAY_DEFICIT'}
            onChange={() => onDuringDayKindChange('DAY_DEFICIT')}
            className="border-slate-300"
          />
          Outro horário (horas a menos)
        </label>
      </fieldset>
      <Select
        label="Quantidade"
        value={String(duringDayHours)}
        onChange={(e) => onDuringDayHoursChange(Number(e.target.value))}
        options={getDuringDayHourOptions(duringDayKind).map((h) => ({
          value: String(h),
          label: `${h}h`,
        }))}
        required
      />
    </>
  );
}
