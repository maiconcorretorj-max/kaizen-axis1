import { useState } from 'react';
import { SectionHeader, PremiumCard, RoundedButton } from '@/components/ui/PremiumComponents';
import { MetricCard } from '@/components/reports/MetricCard';
import { InsightCard } from '@/components/reports/InsightCard';
import { CircularScore } from '@/components/reports/CircularScore';
import { MOCK_METRICS, MOCK_FORECAST, MOCK_CLIENT_HEALTH, MOCK_INSIGHTS } from '@/data/reports';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Filter, ChevronDown, Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30 dias');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Custom Date Range State
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePeriodChange = (p: string) => {
    if (p === 'Personalizado') {
      setIsDateModalOpen(true);
    } else {
      setPeriod(p);
    }
  };

  const applyCustomDate = () => {
    if (startDate && endDate) {
      setPeriod(`${startDate.split('-').reverse().join('/')} - ${endDate.split('-').reverse().join('/')}`);
      setIsDateModalOpen(false);
    } else {
      alert('Por favor, selecione as datas de início e fim.');
    }
  };

  const handleInsightAction = (action: string) => {
    if (action === 'Reagendar visitas pendentes') {
      navigate('/schedule');
    } else if (action === 'Clientes em potencial') {
      navigate('/reports/potential-clients');
    } else {
      // Handle other actions or show a toast
      alert(`Ação: ${action}`);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    // Mock export functionality
    const fileName = `relatorio_estrategico_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'pdf'}`;
    
    if (format === 'excel') {
      // Create CSV content
      const headers = ['Cliente', 'Estágio', 'Valor Potencial', 'Health Score', 'Risco'];
      const rows = MOCK_CLIENT_HEALTH.map(c => [c.name, c.stage, c.potentialValue, c.score, c.risk]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      // For PDF, we'll just simulate a print dialog or alert since we don't have a heavy PDF lib
      window.print();
    }
    setIsExportModalOpen(false);
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Relatórios</h1>
          <p className="text-text-secondary text-sm">Inteligência Estratégica</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="p-2 bg-white dark:bg-surface-100 border border-surface-200 rounded-lg text-text-secondary hover:text-gold-600 transition-colors shadow-sm"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
        {['30 dias', '60 dias', '90 dias', 'Personalizado'].map((p) => (
          <button
            key={p}
            onClick={() => handlePeriodChange(p)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              period === p || (p === 'Personalizado' && period.includes('/'))
                ? 'bg-gold-500 text-white shadow-md shadow-gold-500/20' 
                : 'bg-white dark:bg-surface-100 text-text-secondary border border-surface-200 hover:border-gold-300'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Executive Metrics */}
      <section className="grid grid-cols-2 gap-3 mb-8">
        {MOCK_METRICS.map((metric) => (
          <MetricCard 
            key={metric.id}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            trend={metric.trend}
            period={metric.period}
            inverse={metric.label === 'Ciclo de Vendas'}
          />
        ))}
      </section>

      {/* Forecast Chart */}
      <section className="mb-8">
        <SectionHeader title="Forecast Comercial" subtitle="Previsão de Faturamento" />
        <PremiumCard className="p-4 h-80">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs text-text-secondary uppercase">Receita Projetada</p>
              <h3 className="text-xl font-bold text-text-primary">R$ 1.35M</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary uppercase">Confiança</p>
              <h3 className="text-xl font-bold text-green-600 dark:text-green-400">85%</h3>
            </div>
          </div>
          
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_FORECAST}>
                <defs>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#6B7280'}} 
                  dy={10}
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                  formatter={(value: number) => [`R$ ${(value/1000).toFixed(0)}k`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#D4AF37" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPredicted)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="confirmed" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gold-500" />
              <span className="text-[10px] text-text-secondary">Previsto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-text-secondary">Confirmado</span>
            </div>
          </div>
        </PremiumCard>
      </section>

      {/* Predictive Insights */}
      <section className="mb-8">
        <SectionHeader title="Insights Preditivos" subtitle="Análise de Inteligência Artificial" />
        <div className="space-y-3">
          {MOCK_INSIGHTS.map((insight) => (
            <InsightCard 
              key={insight.id}
              title={insight.title}
              description={insight.description}
              impact={insight.impact}
              action={insight.action}
              type={insight.type}
              onActionClick={() => handleInsightAction(insight.action)}
            />
          ))}
        </div>
      </section>

      {/* Client Health Score */}
      <section>
        <SectionHeader title="Health Score Comercial" subtitle="Risco e Probabilidade" />
        <div className="space-y-3">
          {MOCK_CLIENT_HEALTH.map((client) => (
            <PremiumCard key={client.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <CircularScore score={client.score} />
                <div>
                  <h4 
                    className="font-bold text-text-primary text-sm hover:text-gold-600 cursor-pointer transition-colors"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    {client.name}
                  </h4>
                  <p className="text-xs text-text-secondary">{client.stage} • {client.potentialValue}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-text-secondary uppercase mb-0.5">Probabilidade</p>
                <p className={`text-sm font-bold ${
                  client.conversionProbability > 70 ? 'text-green-600' : 
                  client.conversionProbability > 40 ? 'text-gold-600' : 'text-red-500'
                }`}>
                  {client.conversionProbability}%
                </p>
              </div>
            </PremiumCard>
          ))}
        </div>
      </section>

      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Exportar Relatório"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Selecione o formato desejado para exportar os dados do período selecionado ({period}).
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleExport('pdf')}
              className="flex flex-col items-center justify-center p-6 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-xl transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <span className="text-sm font-medium text-text-primary">PDF</span>
              <span className="text-[10px] text-text-secondary mt-1">Visualização completa</span>
            </button>

            <button 
              onClick={() => handleExport('excel')}
              className="flex flex-col items-center justify-center p-6 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-xl transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3 group-hover:scale-110 transition-transform">
                <FileSpreadsheet size={24} />
              </div>
              <span className="text-sm font-medium text-text-primary">Excel (CSV)</span>
              <span className="text-[10px] text-text-secondary mt-1">Dados brutos</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Date Range Modal */}
      <Modal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        title="Período Personalizado"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Data Início</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Data Fim</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            />
          </div>
          <RoundedButton fullWidth onClick={applyCustomDate}>
            Aplicar Filtro
          </RoundedButton>
        </div>
      </Modal>
    </div>
  );
}
