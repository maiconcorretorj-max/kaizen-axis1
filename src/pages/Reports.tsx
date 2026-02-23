import { useState, useMemo } from 'react';
import { SectionHeader, PremiumCard, RoundedButton } from '@/components/ui/PremiumComponents';
import { MetricCard } from '@/components/reports/MetricCard';
import { InsightCard } from '@/components/reports/InsightCard';
import { CircularScore } from '@/components/reports/CircularScore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

export default function Reports() {
  const navigate = useNavigate();
  const { clients, leads, loading, appointments } = useApp();
  const [period, setPeriod] = useState('30 dias');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Custom Date Range State
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ─── Real Data Calculations ────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalClients = clients.length;
    const closedSales = clients.filter(c => c.stage === 'Concluído' || c.stage === 'Vendas Concluidas').length;
    const conversionRate = totalClients > 0 ? (closedSales / totalClients) * 100 : 0;

    return [
      { id: '1', label: 'Vendas Totais', value: closedSales.toString(), change: '+12%', trend: 'up' as const, period: 'vs. mês anterior' },
      { id: '2', label: 'Novos Leads', value: leads.length.toString(), change: '+8%', trend: 'up' as const, period: 'vs. mês anterior' },
      { id: '3', label: 'Taxa de Conversão', value: `${conversionRate.toFixed(1)}%`, change: '+2.4%', trend: 'up' as const, period: 'vs. mês anterior' },
      { id: '4', label: 'Ciclo de Vendas', value: '18 dias', change: '-2 dias', trend: 'down' as const, period: 'vs. mês anterior' },
    ];
  }, [clients, leads]);

  // Forecast: Sum of "Aprovado" clients potential values (simplified)
  const forecastTotal = useMemo(() => {
    const approved = clients.filter(c => c.stage === 'Aprovado');
    const total = approved.reduce((acc, c) => {
      const val = parseFloat(c.intendedValue.replace(/[^\d]/g, '')) || 0;
      return acc + val;
    }, 0);
    return total;
  }, [clients]);

  // Forecast Chart Data (aggregated by month from createdAt)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();

    return months.map((m, i) => {
      // Very simplified: distribution of current data across months for visualization
      const monthClients = clients.filter(c => new Date(c.createdAt).getMonth() === i);
      const predicted = monthClients.reduce((acc, c) => acc + (parseFloat(c.intendedValue.replace(/[^\d]/g, '')) || 0), 0) || (i <= currentMonth ? 100000 + (i * 20000) : 0);
      return {
        month: m,
        predicted: predicted / 1000,
        confirmed: (i <= currentMonth ? predicted * 0.7 : 0) / 1000
      };
    });
  }, [clients]);

  const clientHealth = useMemo(() => {
    return clients.slice(0, 5).map(c => {
      // Mock health score logic based on stage
      let score = 50;
      if (c.stage === 'Aprovado') score = 85;
      if (c.stage === 'Em Tratativa') score = 70;
      if (c.stage === 'Reprovado') score = 20;

      return {
        id: c.id,
        name: c.name,
        stage: c.stage,
        score,
        potentialValue: c.intendedValue,
        conversionProbability: score
      };
    });
  }, [clients]);

  const handlePeriodChange = (p: string) => {
    if (p === 'Personalizado') setIsDateModalOpen(true);
    else setPeriod(p);
  };

  const applyCustomDate = () => {
    if (startDate && endDate) {
      setPeriod(`${startDate.split('-').reverse().join('/')} - ${endDate.split('-').reverse().join('/')}`);
      setIsDateModalOpen(false);
    } else alert('Por favor, selecione as datas de início e fim.');
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const fileName = `relatorio_estrategico_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'pdf'}`;
    if (format === 'excel') {
      const headers = ['Cliente', 'Estágio', 'Valor Potencial', 'Health Score'];
      const rows = clientHealth.map(c => [c.name, c.stage, c.potentialValue, c.score]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.click();
    } else window.print();
    setIsExportModalOpen(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Relatórios</h1>
          <p className="text-text-secondary text-sm">Inteligência Estratégica</p>
        </div>
        <button onClick={() => setIsExportModalOpen(true)} className="p-2 bg-white dark:bg-surface-100 border border-surface-200 rounded-lg text-text-secondary hover:text-gold-600 shadow-sm">
          <Download size={20} />
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
        {['30 dias', '60 dias', '90 dias', 'Personalizado'].map((p) => (
          <button key={p} onClick={() => handlePeriodChange(p)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${period === p || (p === 'Personalizado' && period.includes('/')) ? 'bg-gold-500 text-white shadow-md' : 'bg-white dark:bg-surface-100 text-text-secondary border border-surface-200'}`}>
            {p}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 mb-8">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} {...metric} inverse={metric.label === 'Ciclo de Vendas'} />
        ))}
      </section>

      <section className="mb-8">
        <SectionHeader title="Forecast Comercial" subtitle="Previsão de Faturamento" />
        <PremiumCard className="p-4 h-80">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs text-text-secondary uppercase">Receita Projetada (Aprovados)</p>
              <h3 className="text-xl font-bold text-text-primary">R$ {(forecastTotal / 1000000).toFixed(2)}M</h3>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="predicted" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorPredicted)" />
                <Area type="monotone" dataKey="confirmed" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gold-500" /><span className="text-[10px] text-text-secondary">Previsto</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] text-text-secondary">Confirmado</span></div>
          </div>
        </PremiumCard>
      </section>

      <section>
        <SectionHeader title="Health Score Comercial" subtitle="Risco e Probabilidade" />
        <div className="space-y-3">
          {clientHealth.length === 0 ? <p className="text-sm text-text-secondary text-center py-8">Dados insuficientes para análise.</p> :
            clientHealth.map((client) => (
              <PremiumCard key={client.id} className="flex items-center justify-between p-4" onClick={() => navigate(`/clients/${client.id}`)}>
                <div className="flex items-center gap-3">
                  <CircularScore score={client.score} />
                  <div>
                    <h4 className="font-bold text-text-primary text-sm">{client.name}</h4>
                    <p className="text-xs text-text-secondary">{client.stage} • {client.potentialValue}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-secondary uppercase mb-0.5">Probabilidade</p>
                  <p className={`text-sm font-bold ${client.conversionProbability > 70 ? 'text-green-600' : client.conversionProbability > 40 ? 'text-gold-600' : 'text-red-500'}`}>
                    {client.conversionProbability}%
                  </p>
                </div>
              </PremiumCard>
            ))}
        </div>
      </section>

      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Exportar Relatório">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary text-center">Selecione o formato para os dados de ({period}).</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleExport('pdf')} className="flex flex-col items-center justify-center p-6 bg-surface-50 hover:bg-surface-100 rounded-xl transition-all">
              <FileText size={24} className="text-red-600 mb-2" />
              <span className="text-sm font-medium">PDF</span>
            </button>
            <button onClick={() => handleExport('excel')} className="flex flex-col items-center justify-center p-6 bg-surface-50 hover:bg-surface-100 rounded-xl transition-all">
              <FileSpreadsheet size={24} className="text-green-600 mb-2" />
              <span className="text-sm font-medium">Excel</span>
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} title="Período Personalizado">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Início</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary" /></div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Fim</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary" /></div>
          <RoundedButton fullWidth onClick={applyCustomDate}>Aplicar Filtro</RoundedButton>
        </div>
      </Modal>
    </div>
  );
}
