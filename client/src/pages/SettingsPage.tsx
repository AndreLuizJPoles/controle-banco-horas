import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setWorkStartTime(user.workStartTime);
      setWorkEndTime(user.workEndTime);
    }
  }, [user]);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const { data } = await api.patch<{ user: typeof user }>('/users/me', {
        name,
        email,
        workStartTime,
        workEndTime,
      });
      setUser(data.user);
      toast.success('Perfil atualizado com sucesso');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? 'Erro ao atualizar perfil'
        : 'Erro ao atualizar perfil';
      toast.error(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setPasswordLoading(true);

    try {
      await api.patch('/users/me/password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success('Senha alterada com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? 'Erro ao alterar senha'
        : 'Erro ao alterar senha';
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Perfil</h2>
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Horário de entrada (jornada)"
            type="time"
            value={workStartTime}
            onChange={(e) => setWorkStartTime(e.target.value)}
            required
          />
          <Input
            label="Horário de saída (jornada)"
            type="time"
            value={workEndTime}
            onChange={(e) => setWorkEndTime(e.target.value)}
            required
          />
          <div>
            <Button type="submit" loading={profileLoading}>
              Salvar perfil
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Alterar senha</h2>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <Input
            label="Senha atual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Input
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <div>
            <Button type="submit" loading={passwordLoading}>
              Alterar senha
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
