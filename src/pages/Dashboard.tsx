import { useState } from 'react';
import { PremiumCard, SectionHeader } from '@/components/ui/PremiumComponents';
import { Bell, Loader2, Users, TrendingUp, Target, Calendar, Building2 } from 'lucide-react';
import { FunnelChart } from '@/components/ui/FunnelChart';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { useNavigate } from 'react-router-dom';
import { MOCK_ANNOUNCEMENTS } from '@/data/admin';
import { AnnouncementCard } from '@/components/admin/AnnouncementCard';
import { useApp } from '@/context/AppContext';
import { useAuthorization } from '@/hooks/useAuthorization';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { clients, appointments, goals, userName, loading, directorates } = useApp();
  const { isAdmin, isDirector, isManager, isCoordinator, isBroker, directorateId, role } = useAuthorization();

  // Active announcements
  const activeAnnouncements = MOCK_ANNOUNCEMENTS.filter(a => {
    const now = new Date();
    return new Date(a.startDate) <= now && new Date(a.endDate) >= now;
  });

  // ── Scope-based data filtering ──────────────────────────────────────────────
  const scopedClients = (() => {
    if (isAdmin) return clients;
    if (isDirector || isManager || isCoordinator)
      return clients.filter(c => (c as any).directorate_id === directorateId);
    // CORRETOR — own clients only (RLS already filters server-side, but guard locally too)
    return clients;
  })();

  const totalSales = scopedClients.filter(c => c.stage === 'Concluído').length;
  const emAnalise = scopedClients.filter(c => c.stage === 'Em Análise').length;
  const aprovados = scopedClients.filter(c => c.stage === 'Aprovado').length;
  const totalClients = scopedClients.length;

  // Upcoming appointments for this user's scope
  const upcomingAppointments = appointments.slice(0, 3);

  // Role label for header
  const roleLabel: Record<string, string> = {
    ADMIN: '🔑 Administrador',
    DIRETOR: '🏢 Diretor',
    GERENTE: '👥 Gerente',
    COORDENADOR: '📋 Coordenador',
    CORRETOR: '🏠 Corretor',
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            Olá, {userName.split(' ')[0]}
            {loading && <Loader2 className="animate-spin text-gold-500" size={18} />}
          </h1>
          <p className="text-text-secondary text-sm">{roleLabel[role] ?? 'Visão geral'}</p>
        </div>
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="p-2 rounded-full bg-card-bg border border-surface-200 text-text-secondary relative hover:bg-surface-100 transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-card-bg" />
        </button>
      </div>

      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

      {/* Announcements */}
      {activeAnnouncements.length > 0 && (
        <section className="space-y-3">
          {activeAnnouncements.map(a => <AnnouncementCard key={a.id} announcement={a} />)}
        </section>
      )}

      {/* ── ADMIN: Global Metrics ──────────────────────────────────────────── */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <PremiumCard highlight className="col-span-2 flex justify-between items-center cursor-pointer"
              onClick={() => navigate('/reports')}>
              <div>
                <p className="text-sm text-gold-700 dark:text-gold-400 font-medium uppercase tracking-wider">Vendas Globais Concluídas</p>
                <h3 className="text-3xl font-bold text-text-primary mt-1">{totalSales}</h3>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{totalClients} clientes totais</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center text-gold-600 font-bold text-xl">{totalSales}</div>
            </PremiumCard>
            <PremiumCard className="cursor-pointer" onClick={() => navigate('/clients', { state: { initialStage: 'Em Análise' } })}>
              <p className="text-xs text-text-secondary uppercase">Em Análise</p>
              <h3 className="text-2xl font-bold text-text-primary mt-2">{String(emAnalise).padStart(2, '0')}</h3>
            </PremiumCard>
            <PremiumCard className="cursor-pointer" onClick={() => navigate('/clients', { state: { initialStage: 'Aprovado' } })}>
              <p className="text-xs text-text-secondary uppercase">Aprovados</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{String(aprovados).padStart(2, '0')}</h3>
            </PremiumCard>
          </div>
          {/* Directorates overview */}
          {directorates.length > 0 && (
            <section>
              <SectionHeader title="Visão por Diretoria" />
              <div className="space-y-2">
                {directorates.map(d => {
                  const dClients = clients.filter(c => (c as any).directorate_id === d.id);
                  const dSales = dClients.filter(c => c.stage === 'Concluído').length;
                  return (
                    <PremiumCard key={d.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                          <Building2 size={16} className="text-gold-600 dark:text-gold-400" />
                        </div>
                        <span className="font-medium text-text-primary text-sm">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-secondary">{dClients.length} clientes</p>
                        <p className="text-xs text-green-600 font-medium">{dSales} vendas</p>
                      </div>
                    </PremiumCard>
                  );
                })}
              </div>
            </section>
          )}
          <section><FunnelChart /></section>
        </>
      )}

      {/* ── DIRETOR: Diretoria Metrics ─────────────────────────────────────── */}
      {isDirector && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <PremiumCard highlight className="col-span-2 flex justify-between items-center cursor-pointer"
              onClick={() => navigate('/reports')}>
              <div>
                <p className="text-sm text-gold-700 dark:text-gold-400 font-medium uppercase tracking-wider">Vendas da Diretoria</p>
                <h3 className="text-3xl font-bold text-text-primary mt-1">{totalSales}</h3>
                <p className="text-xs text-green-600 mt-1 font-medium">{totalClients} clientes</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center text-gold-600 font-bold text-xl">{totalSales}</div>
            </PremiumCard>
            <PremiumCard>
              <p className="text-xs text-text-secondary uppercase">Em Análise</p>
              <h3 className="text-2xl font-bold text-text-primary mt-2">{String(emAnalise).padStart(2, '0')}</h3>
            </PremiumCard>
            <PremiumCard>
              <p className="text-xs text-text-secondary uppercase">Aprovados</p>
              <h3 className="text-2xl font-bold text-green-600 mt-2">{String(aprovados).padStart(2, '0')}</h3>
            </PremiumCard>
          </div>
          <section><FunnelChart /></section>
        </>
      )}

      {/* ── GERENTE / COORDENADOR: Team Metrics ───────────────────────────── */}
      {(isManager || isCoordinator) && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <PremiumCard className="flex flex-col items-center gap-1">
              <Users size={22} className="text-gold-500" />
              <h3 className="text-2xl font-bold text-text-primary">{totalClients}</h3>
              <p className="text-xs text-text-secondary">Clientes da Equipe</p>
            </PremiumCard>
            <PremiumCard className="flex flex-col items-center gap-1">
              <TrendingUp size={22} className="text-green-500" />
              <h3 className="text-2xl font-bold text-text-primary">{totalSales}</h3>
              <p className="text-xs text-text-secondary">Vendas Concluídas</p>
            </PremiumCard>
            <PremiumCard className="flex flex-col items-center gap-1">
              <Target size={22} className="text-blue-500" />
              <h3 className="text-2xl font-bold text-text-primary">{emAnalise}</h3>
              <p className="text-xs text-text-secondary">Em Análise</p>
            </PremiumCard>
            <PremiumCard className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate('/schedule')}>
              <Calendar size={22} className="text-purple-500" />
              <h3 className="text-2xl font-bold text-text-primary">{upcomingAppointments.length}</h3>
              <p className="text-xs text-text-secondary">Agendamentos</p>
            </PremiumCard>
          </div>
          <section><FunnelChart /></section>
        </>
      )}

      {/* ── CORRETOR: Personal Metrics ─────────────────────────────────────── */}
      {isBroker && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <PremiumCard highlight className="col-span-2 flex justify-between items-center cursor-pointer"
              onClick={() => navigate('/clients')}>
              <div>
                <p className="text-sm text-gold-700 dark:text-gold-400 font-medium uppercase tracking-wider">Meus Clientes Ativos</p>
                <h3 className="text-3xl font-bold text-text-primary mt-1">{totalClients}</h3>
                <p className="text-xs text-green-600 mt-1 font-medium">{totalSales} vendas realizadas</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center text-gold-600 font-bold text-xl">{totalSales}</div>
            </PremiumCard>
            <PremiumCard className="cursor-pointer" onClick={() => navigate('/clients', { state: { initialStage: 'Em Análise' } })}>
              <p className="text-xs text-text-secondary uppercase">Em Análise</p>
              <h3 className="text-2xl font-bold text-text-primary mt-2">{String(emAnalise).padStart(2, '0')}</h3>
            </PremiumCard>
            <PremiumCard className="cursor-pointer" onClick={() => navigate('/schedule')}>
              <p className="text-xs text-text-secondary uppercase">Agendamentos</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-2">{upcomingAppointments.length}</h3>
            </PremiumCard>
          </div>
          <section><FunnelChart /></section>
        </>
      )}

      {/* Upcoming Schedule — visible to all roles */}
      {upcomingAppointments.length > 0 && (
        <section>
          <SectionHeader
            title="Próximos Agendamentos"
            action={
              <button onClick={() => navigate('/schedule')} className="text-xs text-gold-600 dark:text-gold-400 font-medium hover:underline">
                Ver todos
              </button>
            }
          />
          <div className="space-y-3">
            {upcomingAppointments.map(item => (
              <PremiumCard key={item.id} className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => navigate('/schedule')}>
                <div className="flex-col flex items-center justify-center w-12 h-12 bg-surface-100 rounded-xl text-center">
                  <span className="text-xs font-bold text-text-secondary">{item.time}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-text-primary">{item.title}</h4>
                  <p className="text-xs text-text-secondary">{item.type} {item.client_name ? `• ${item.client_name}` : ''}</p>
                </div>
                <div className="w-1 h-8 rounded-full bg-gold-400" />
              </PremiumCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
