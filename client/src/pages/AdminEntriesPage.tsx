import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import api from '../services/api';
import type { HourEntry, HourSummary, PaginatedResponse, User } from '../types';
import { formatAdjustmentLabel, formatHours, getAdjustmentTypeLabel } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { HourSummaryCards } from '../components/HourSummaryCards';
import { Select } from '../components/Select';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Pagination, Table } from '../components/Table';

type ActionType = 'approve' | 'reject';

export function AdminEntriesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [summary, setSummary] = useState<HourSummary>({
    approvedHours: 0,
    pendingHours: 0,
    totalHours: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(false);
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

  useEffect(() => {
    if (!selectedUserId) {
      setSummary({ approvedHours: 0, pendingHours: 0, totalHours: 0 });
      return;
    }

    setSummaryLoading(true);
    api
      .get<HourSummary>(`/hour-entries/summary/${selectedUserId}`)
      .then(({ data }) =>
        setSummary({
          approvedHours: data.approvedHours,
          pendingHours: data.pendingHours,
          totalHours: data.totalHours,
        }),
      )
      .catch(() => toast.error('Erro ao carregar resumo'))
      .finally(() => setSummaryLoading(false));
  }, [selectedUserId]);

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
      if (selectedUserId) {
        const { data } = await api.get<HourSummary>(`/hour-entries/summary/${selectedUserId}`);
        setSummary({
          approvedHours: data.approvedHours,
          pendingHours: data.pendingHours,
          totalHours: data.totalHours,
        });
      }
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

      {selectedUserId ? (
        <HourSummaryCards summary={summary} loading={summaryLoading} />
      ) : (
        <p className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Selecione um usuário para ver o resumo de horas.
        </p>
      )}

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
                key: 'adjustmentType',
                header: 'Tipo',
                render: (e) => getAdjustmentTypeLabel(e.adjustmentType),
              },
              {
                key: 'detail',
                header: 'Detalhe',
                render: (e) => formatAdjustmentLabel(e),
              },
              {
                key: 'hours',
                header: 'Horas',
                render: (e) => (
                  <span className={e.hours >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatHours(e.hours)}
                  </span>
                ),
              },
              {
                key: 'withMedicalCertificate',
                header: 'Atestado',
                render: (e) => (e.withMedicalCertificate ? 'Sim' : 'Não'),
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
