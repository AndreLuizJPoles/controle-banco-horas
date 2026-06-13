import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import type { HourEntry, HourSummary, PaginatedResponse, User } from '../types';
import { formatAdjustmentLabel, formatHours, getAdjustmentTypeLabel } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { HourSummaryCards } from '../components/HourSummaryCards';
import { EntryTimeline } from '../components/EntryTimeline';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SearchableSelect } from '../components/SearchableSelect';
import { Pagination, Table } from '../components/Table';
import { useAuthStore } from '../stores/authStore';

const ENTRIES_PAGE_SIZE = 20;

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [summary, setSummary] = useState<HourSummary>({
    approvedHours: 0,
    pendingHours: 0,
    totalHours: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(!isAdmin);
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(!isAdmin);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const userOptions = useMemo(
    () =>
      users
        .filter((u) => u.status === 'ACTIVE' && u.role === 'USER')
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        .map((u) => ({ value: u.id, label: u.name })),
    [users],
  );

  const canLoadData = !isAdmin || !!selectedUserId;

  useEffect(() => {
    if (!isAdmin) return;

    api
      .get<{ users: User[] }>('/users')
      .then(({ data }) => setUsers(data.users))
      .catch(() => toast.error('Erro ao carregar usuários'));
  }, [isAdmin]);

  useEffect(() => {
    if (!canLoadData) {
      setSummary({ approvedHours: 0, pendingHours: 0, totalHours: 0 });
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    const summaryUrl = isAdmin
      ? `/hour-entries/summary/${selectedUserId}`
      : '/hour-entries/summary';

    api
      .get<HourSummary>(summaryUrl)
      .then(({ data }) =>
        setSummary({
          approvedHours: data.approvedHours,
          pendingHours: data.pendingHours,
          totalHours: data.totalHours,
        }),
      )
      .catch(() => toast.error('Erro ao carregar resumo'))
      .finally(() => setSummaryLoading(false));
  }, [isAdmin, selectedUserId, canLoadData]);

  const fetchEntries = useCallback(async () => {
    if (!canLoadData) {
      setEntries([]);
      setTotalPages(1);
      setTotalEntries(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const filterParams: Record<string, string | number> = {
        page,
        limit: ENTRIES_PAGE_SIZE,
      };
      if (startDate) filterParams.startDate = startDate;
      if (endDate) filterParams.endDate = endDate;
      if (isAdmin && selectedUserId) filterParams.userId = selectedUserId;

      const { data } = await api.get<PaginatedResponse<HourEntry>>('/hour-entries', {
        params: filterParams,
      });

      setEntries(data.data);
      setTotalPages(data.meta.totalPages);
      setTotalEntries(data.meta.total);
    } catch {
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, isAdmin, selectedUserId, canLoadData]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <div>
      {isAdmin && (
        <div className="mb-6 max-w-sm">
          <SearchableSelect
            label="Usuário"
            value={selectedUserId}
            onChange={(userId) => {
              setSelectedUserId(userId);
              setPage(1);
            }}
            options={userOptions}
            placeholder="Pesquisar usuário..."
          />
        </div>
      )}

      {canLoadData ? (
        <HourSummaryCards summary={summary} loading={summaryLoading} />
      ) : (
        <p className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Selecione um usuário para ver o resumo de horas.
        </p>
      )}

      {canLoadData && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <Input
              label="Data inicial"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
            <Input
              label="Data final"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {!isAdmin && (
            <Link to="/entries/new">
              <Button>Novo Lançamento</Button>
            </Link>
          )}
        </div>
      )}

      {!canLoadData ? null : loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <section className="mb-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Linha do tempo</h2>
              {totalEntries > ENTRIES_PAGE_SIZE && (
                <span className="text-sm text-slate-500">
                  {totalEntries} lançamentos — página {page} de {totalPages}
                </span>
              )}
            </div>
            <EntryTimeline entries={entries} />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </section>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Lançamentos</h2>
            {totalEntries > ENTRIES_PAGE_SIZE && (
              <span className="text-sm text-slate-500">
                {totalEntries} lançamentos — página {page} de {totalPages}
              </span>
            )}
          </div>
          <Table
            data={entries}
            columns={[
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
            ]}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
