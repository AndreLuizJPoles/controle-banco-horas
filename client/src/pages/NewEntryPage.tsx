import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import api from '../services/api';
import { calculateEntryHours } from '../lib/workHours';
import { useAuthStore } from '../stores/authStore';
import { formatHours } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function NewEntryPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
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
    return calculateEntryHours({
      workStart: user.workStartTime,
      workEnd: user.workEndTime,
      clockIn,
      clockOut,
      withMedicalCertificate,
    });
  }, [user, clockIn, clockOut, withMedicalCertificate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/hour-entries', {
        date,
        clockIn,
        clockOut,
        description,
        withMedicalCertificate,
      });
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
          <Input
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Horário de entrada"
            type="time"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
            required
          />
          <Input
            label="Horário de saída"
            type="time"
            value={clockOut}
            onChange={(e) => setClockOut(e.target.value)}
            required
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
            <Button type="submit" loading={loading}>
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
