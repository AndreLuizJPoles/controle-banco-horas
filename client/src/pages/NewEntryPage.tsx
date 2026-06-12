import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import api from '../services/api';
import { calculateAdjustmentHours } from '../lib/workHours';
import { useAuthStore } from '../stores/authStore';
import type { AdjustmentType, DuringDayKind } from '../types';
import { formatHours } from '../types';
import { AdjustmentTypeFields } from '../components/AdjustmentTypeFields';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

const ADJUSTMENT_TYPE_OPTIONS: { value: AdjustmentType; label: string }[] = [
  { value: 'ENTRY', label: 'Na entrada' },
  { value: 'EXIT', label: 'Na saída' },
  { value: 'DURING_DAY', label: 'Durante o dia' },
];

export function NewEntryPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('ENTRY');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [duringDayKind, setDuringDayKind] = useState<DuringDayKind>('LUNCH_EXTRA');
  const [duringDayHours, setDuringDayHours] = useState(0.5);
  const [withMedicalCertificate, setWithMedicalCertificate] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const previewHours = useMemo(() => {
    if (!user) return null;
    return calculateAdjustmentHours({
      adjustmentType,
      workStart: user.workStartTime,
      workEnd: user.workEndTime,
      clockIn,
      clockOut,
      duringDayKind,
      duringDayHours,
      withMedicalCertificate,
    });
  }, [
    user,
    adjustmentType,
    clockIn,
    clockOut,
    duringDayKind,
    duringDayHours,
    withMedicalCertificate,
  ]);

  const previewInvalid =
    adjustmentType === 'ENTRY'
      ? !!clockIn && previewHours === null
      : adjustmentType === 'EXIT'
        ? !!clockOut && previewHours === null
        : false;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (previewHours === null) {
      toast.error('Verifique os horários ou quantidade informados (múltiplos de 30 min)');
      return;
    }

    setLoading(true);

    try {
      const payload =
        adjustmentType === 'ENTRY'
          ? {
              adjustmentType,
              date,
              clockIn,
              description,
              withMedicalCertificate,
            }
          : adjustmentType === 'EXIT'
            ? {
                adjustmentType,
                date,
                clockOut,
                description,
                withMedicalCertificate,
              }
            : {
                adjustmentType,
                date,
                duringDayKind,
                duringDayHours,
                description,
                withMedicalCertificate,
              };

      await api.post('/hour-entries', payload);
      toast.success('Lançamento criado com sucesso');
      navigate('/dashboard');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? 'Erro ao criar lançamento'
        : 'Erro ao criar lançamento';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Novo Lançamento</h2>
        {user && (
          <p className="mb-4 text-sm text-slate-500">
            Jornada esperada: {user.workStartTime} – {user.workEndTime}
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-slate-700">Tipo de lançamento</legend>
            {ADJUSTMENT_TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="adjustmentType"
                  value={option.value}
                  checked={adjustmentType === option.value}
                  onChange={() => setAdjustmentType(option.value)}
                  className="border-slate-300"
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <Input
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <AdjustmentTypeFields
            adjustmentType={adjustmentType}
            clockIn={clockIn}
            clockOut={clockOut}
            duringDayKind={duringDayKind}
            duringDayHours={duringDayHours}
            onClockInChange={setClockIn}
            onClockOutChange={setClockOut}
            onDuringDayKindChange={setDuringDayKind}
            onDuringDayHoursChange={setDuringDayHours}
          />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={withMedicalCertificate}
              onChange={(e) => setWithMedicalCertificate(e.target.checked)}
              className="rounded border-slate-300"
            />
            Com atestado médico
          </label>
          <Input
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Descreva a atividade"
          />
          {previewInvalid && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              A diferença deve ser múltipla de 30 minutos (0,5 h).
            </div>
          )}
          {previewHours !== null && (
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Horas calculadas:{' '}
              <span className={previewHours >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                {formatHours(previewHours)}
              </span>
              {withMedicalCertificate && previewHours === 0 && (
                <span className="ml-2 text-slate-500">(déficit zerado por atestado)</span>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} disabled={previewHours === null}>
              Salvar
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
