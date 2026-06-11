import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';

function formatBalance(balance: number): string {
  const sign = balance >= 0 ? '+' : '';
  return `${sign}${balance.toFixed(1)}h`;
}

export function DashboardPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ balance: number }>('/hour-entries/balance')
      .then(({ data }) => setBalance(data.balance))
      .catch(() => toast.error('Erro ao carregar saldo'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const isPositive = (balance ?? 0) >= 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-medium text-slate-600">Saldo do Banco de Horas</h2>
        <p
          className={`mt-4 text-5xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
        >
          {formatBalance(balance ?? 0)}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Soma de todos os lançamentos aprovados
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/entries/new">
          <Button>Novo Lançamento</Button>
        </Link>
        <Link to="/entries">
          <Button variant="secondary">Ver Lançamentos</Button>
        </Link>
      </div>
    </div>
  );
}
