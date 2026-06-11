import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import type { HourEntry, HourSummary, PaginatedResponse } from '../types';
import { formatHours, formatTime } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { HourSummaryCards } from '../components/HourSummaryCards';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Pagination, Table } from '../components/Table';

export function DashboardPage() {
  const [summary, setSummary] = useState<HourSummary>({
    approvedHours: 0,
    pendingHours: 0,
    totalHours: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    api
      .get<HourSummary>('/hour-entries/summary')
      .then(({ data }) =>
        setSummary({
          approvedHours: data.approvedHours,
          pendingHours: data.pendingHours,
          totalHours: data.totalHours,
        }),
      )
      .catch(() => toast.error('Erro ao carregar resumo'))
      .finally(() => setSummaryLoading(false));
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.get<PaginatedResponse<HourEntry>>('/hour-entries', { params });
      setEntries(data.data);
      setTotalPages(data.meta.totalPages);
    } catch {
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <div>
      <HourSummaryCards summary={summary} loading={summaryLoading} />

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
        <Link to="/entries/new">
          <Button>Novo Lançamento</Button>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Table
            data={entries}
            columns={[
              { key: 'date', header: 'Data', render: (e) => e.date },
              { key: 'clockIn', header: 'Entrada', render: (e) => formatTime(e.clockIn) },
              { key: 'clockOut', header: 'Saída', render: (e) => formatTime(e.clockOut) },
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
