import { useState } from 'react';
import { PremiumCard, SectionHeader } from '@/components/ui/PremiumComponents';
import { Bell, Loader2 } from 'lucide-react';
import { FunnelChart } from '@/components/ui/FunnelChart';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { useNavigate } from 'react-router-dom';
import { MOCK_ANNOUNCEMENTS } from '@/data/admin';
import { AnnouncementCard } from '@/components/admin/AnnouncementCard';
import { useApp } from '@/context/AppContext';

const upcomingSchedule = [
  { id: '1', client: 'Roberto Silva', type: 'Visita', time: '14:00', place: 'Reserva do Bosque' },
  { id: '2', client: 'Ana Paula', type: 'Assinatura', time: '16:30', place: 'Escritório Central' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { clients, userName, loading } = useApp();

  // Active announcements based on current date
  const activeAnnouncements = MOCK_ANNOUNCEMENTS.filter(a => {
    const now = new Date();
    return new Date(a.startDate) <= now && new Date(a.endDate) >= now;
  });

  // Dynamic KPIs from real client data
  const totalSales = clients.filter(c => c.stage === 'Concluído').length;
  const emAnalise = clients.filter(c => c.stage === 'Em Análise').length;
  const aprovados = clients.filter(c => c.stage === 'Aprovado').length;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            Olá, {userName.split(' ')[0]}
            {loading && <Loader2 className="animate-spin text-gold-500" size={18} />}
          </h1>
          <p className="text-text-secondary text-sm">Visão geral da sua operação</p>
        </div>
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="p-2 rounded-full bg-card-bg border border-surface-200 text-text-secondary relative hover:bg-surface-100 transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-card-bg"></span>
        </button>
      </div>

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Announcements */}
      {activeAnnouncements.length > 0 && (
        <section className="space-y-3">
          {activeAnnouncements.map(announcement => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </section>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <PremiumCard
          highlight
          className="col-span-2 flex justify-between items-center cursor-pointer hover:bg-surface-50 transition-colors"
          onClick={() => navigate('/reports')}
        >
          <div>
            <p className="text-sm text-gold-700 dark:text-gold-400 font-medium uppercase tracking-wider">Vendas Concluídas</p>
            <h3 className="text-3xl font-bold text-text-primary mt-1">{totalSales}</h3>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
              {clients.length} clientes no total
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-gold-100 dark:bg-gold-900/40 flex items-center justify-center text-gold-600 dark:text-gold-400 font-bold text-xl">
            {totalSales}
          </div>
        </PremiumCard>

        <PremiumCard
          className="cursor-pointer hover:bg-surface-50 transition-colors"
          onClick={() => navigate('/clients', { state: { initialStage: 'Em Análise' } })}
        >
          <p className="text-xs text-text-secondary uppercase">Em Análise</p>
          <h3 className="text-2xl font-bold text-text-primary mt-2">
            {String(emAnalise).padStart(2, '0')}
          </h3>
        </PremiumCard>

        <PremiumCard
          className="cursor-pointer hover:bg-surface-50 transition-colors"
          onClick={() => navigate('/clients', { state: { initialStage: 'Aprovado' } })}
        >
          <p className="text-xs text-text-secondary uppercase">Aprovados</p>
          <h3 className="text-2xl font-bold text-text-primary mt-2 text-green-600 dark:text-green-400">
            {String(aprovados).padStart(2, '0')}
          </h3>
        </PremiumCard>
      </div>

      {/* Funnel Chart */}
      <section>
        <FunnelChart />
      </section>

      {/* Upcoming Schedule */}
      <section>
        <SectionHeader
          title="Próximos Agendamentos"
          action={
            <button
              onClick={() => navigate('/schedule', { state: { showAll: true } })}
              className="text-xs text-gold-600 dark:text-gold-400 font-medium hover:underline"
            >
              Ver todos
            </button>
          }
        />
        <div className="space-y-3">
          {upcomingSchedule.map((item) => (
            <PremiumCard
              key={item.id}
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-50 transition-colors"
              onClick={() => navigate('/schedule', { state: { highlightId: item.id } })}
            >
              <div className="flex-col flex items-center justify-center w-12 h-12 bg-surface-100 rounded-xl text-center">
                <span className="text-xs font-bold text-text-secondary">{item.time}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary">{item.client}</h4>
                <p className="text-xs text-text-secondary">{item.type} • {item.place}</p>
              </div>
              <div className="w-1 h-8 rounded-full bg-gold-400"></div>
            </PremiumCard>
          ))}
        </div>
      </section>
    </div>
  );
}
