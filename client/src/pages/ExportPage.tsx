import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import type { User } from '../types';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function ExportPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ users: User[] }>('/users')
      .then(({ data }) => {
        setUsers(data.users.filter((u) => u.status === 'ACTIVE' && u.role === 'USER'));
        if (data.users.length > 0) {
          const firstUser = data.users.find((u) => u.status === 'ACTIVE' && u.role === 'USER');
          if (firstUser) setSelectedUserId(firstUser.id);
        }
      })
      .catch(() => toast.error('Erro ao carregar usuários'))
      .finally(() => setLoading(false));
  }, []);

  const downloadExport = async (url: string, fallbackFilename: string) => {
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const disposition = response.headers['content-disposition'] as string | undefined;
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || fallbackFilename;

      const blob = new Blob([response.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Exportação concluída');
    } catch {
      toast.error('Erro ao exportar');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Exportação CSV</h2>
        <p className="mb-6 text-sm text-slate-600">
          Exporte lançamentos aprovados em formato CSV para planilhas.
        </p>

        <div className="flex flex-col gap-6">
          <div>
            <Select
              label="Usuário"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              options={users.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Button
              className="mt-4"
              disabled={!selectedUserId}
              onClick={() => downloadExport(`/export/user/${selectedUserId}`, 'banco_horas_usuario.csv')}
            >
              <Download size={16} />
              Exportar usuário
            </Button>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <p className="mb-4 text-sm text-slate-600">
              Exportar todos os lançamentos aprovados de todos os usuários.
            </p>
            <Button variant="secondary" onClick={() => downloadExport('/export/all', 'banco_horas_todos.csv')}>
              <Download size={16} />
              Exportar todos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
