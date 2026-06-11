import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function NewEntryPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/hour-entries', {
        date,
        hours: parseFloat(hours),
        description,
      });
      toast.success('Lançamento criado com sucesso');
      navigate('/entries');
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Horas (use negativo para débito)"
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
            placeholder="Ex: 2.5 ou -1.0"
          />
          <Input
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Descreva a atividade"
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Salvar
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/entries')}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
