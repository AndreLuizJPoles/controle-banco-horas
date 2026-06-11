import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../services/api';
import type { HourEntry, PaginatedResponse } from '../types';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Pagination, Table } from '../components/Table';

export function MyEntriesPage() {
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
      <div className="mb-6 flex flex-wrap items-end gap-4">
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

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Table
            data={entries}
            columns={[
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
            ]}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
