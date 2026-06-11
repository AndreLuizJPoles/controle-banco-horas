import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import api from '../services/api';
import type { HourEntry, PaginatedResponse, User } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { Select } from '../components/Select';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Pagination, Table } from '../components/Table';

type ActionType = 'approve' | 'reject';

export function AdminEntriesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState<{ entry: HourEntry; action: ActionType } | null>(null);

  useEffect(() => {
    api
      .get<{ users: User[] }>('/users')
      .then(({ data }) => setUsers(data.users.filter((u) => u.status === 'ACTIVE')))
      .catch(() => toast.error('Erro ao carregar usuários'));
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (selectedUserId) params.userId = selectedUserId;

      const { data } = await api.get<PaginatedResponse<HourEntry>>('/hour-entries', { params });
      setEntries(data.data);
      setTotalPages(data.meta.totalPages);
    } catch {
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  }, [page, selectedUserId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAction = async () => {
    if (!modal) return;
    setActionLoading(true);

    try {
      await api.patch(`/hour-entries/${modal.entry.id}/${modal.action}`);
      toast.success(modal.action === 'approve' ? 'Lançamento aprovado' : 'Lançamento rejeitado');
      setModal(null);
      fetchEntries();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? 'Erro na operação'
        : 'Erro na operação';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 max-w-sm">
        <Select
          label="Filtrar por usuário"
          value={selectedUserId}
          onChange={(e) => {
            setSelectedUserId(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Todos os usuários' },
            ...users.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Table
            data={entries}
            columns={[
              {
                key: 'user',
                header: 'Usuário',
                render: (e) => e.user?.name ?? '—',
              },
              { key: 'date', header: 'Data', render: (e) => e.date },
              {
                key: 'hours',
                header: 'Horas',
                render: (e) => (
                  <span className={e.hours >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {e.hours >= 0 ? '+' : ''}
                    {e.hours.toFixed(1)}h
                  </span>
                ),
              },
              { key: 'description', header: 'Descrição', render: (e) => e.description },
              { key: 'status', header: 'Status', render: (e) => <Badge status={e.status} /> },
              {
                key: 'actions',
                header: 'Ações',
                render: (e) =>
                  e.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setModal({ entry: e, action: 'approve' })}>
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setModal({ entry: e, action: 'reject' })}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  ),
              },
            ]}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmModal
        open={!!modal}
        title={modal?.action === 'approve' ? 'Aprovar lançamento' : 'Rejeitar lançamento'}
        message={`Deseja ${modal?.action === 'approve' ? 'aprovar' : 'rejeitar'} este lançamento?`}
        variant={modal?.action === 'reject' ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
