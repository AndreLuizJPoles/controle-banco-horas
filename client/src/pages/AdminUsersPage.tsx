import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import api from '../services/api';
import type { User, UserStatus } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { Select } from '../components/Select';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Table } from '../components/Table';

type ActionType = 'approve' | 'reject';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState<{ user: User; action: ActionType } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await api.get<{ users: User[] }>('/users', { params });
      setUsers(data.users);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async () => {
    if (!modal) return;
    setActionLoading(true);

    try {
      await api.patch(`/users/${modal.user.id}/${modal.action}`);
      toast.success(modal.action === 'approve' ? 'Usuário aprovado' : 'Usuário rejeitado');
      setModal(null);
      fetchUsers();
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
      <div className="mb-6 max-w-xs">
        <Select
          label="Filtrar por status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
          options={[
            { value: '', label: 'Todos' },
            { value: 'PENDING', label: 'Pendente' },
            { value: 'ACTIVE', label: 'Ativo' },
            { value: 'REJECTED', label: 'Rejeitado' },
          ]}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table
          data={users}
          columns={[
            { key: 'name', header: 'Nome', render: (u) => u.name },
            { key: 'email', header: 'E-mail', render: (u) => u.email },
            { key: 'role', header: 'Perfil', render: (u) => u.role },
            { key: 'status', header: 'Status', render: (u) => <Badge status={u.status} /> },
            {
              key: 'actions',
              header: 'Ações',
              render: (u) => {
                if (u.status === 'PENDING') {
                  return (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setModal({ user: u, action: 'approve' })}>
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setModal({ user: u, action: 'reject' })}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  );
                }

                if (u.status === 'ACTIVE' && u.role === 'USER') {
                  return (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setModal({ user: u, action: 'reject' })}
                    >
                      Rejeitar
                    </Button>
                  );
                }

                return <span className="text-slate-400">—</span>;
              },
            },
          ]}
        />
      )}

      <ConfirmModal
        open={!!modal}
        title={modal?.action === 'approve' ? 'Aprovar usuário' : 'Rejeitar usuário'}
        message={
          modal?.action === 'approve'
            ? `Deseja aprovar o usuário ${modal.user.name}?`
            : modal?.user.status === 'ACTIVE'
              ? `Deseja rejeitar o usuário ${modal?.user.name}? Ele será removido das listas, mas os lançamentos permanecerão no sistema.`
              : `Deseja rejeitar o usuário ${modal?.user.name}?`
        }
        variant={modal?.action === 'reject' ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
