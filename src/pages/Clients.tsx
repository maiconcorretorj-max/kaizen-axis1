import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PremiumCard, StatusBadge, RoundedButton } from '@/components/ui/PremiumComponents';
import { Search, Filter, Phone, Mail, MessageCircle, UserPlus, Clock, Plus, Loader2 } from 'lucide-react';
import { CLIENT_STAGES, ClientStage } from '@/data/clients';
import { AutomationLead } from '@/data/leads';
import { useApp } from '@/context/AppContext';

export default function Clients() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clients, leads, loading } = useApp();

  const [activeStage, setActiveStage] = useState<ClientStage | 'Todos'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (location.state?.initialStage) {
      setActiveStage(location.state.initialStage);
    }
  }, [location.state]);

  const filteredClients = clients.filter(client => {
    const matchesStage = activeStage === 'Todos' || client.stage === activeStage;
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.development || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const filteredLeads = leads.filter(lead => {
    const matchesStage = activeStage === 'Todos' || activeStage === 'Novo Lead';
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.origin.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) window.open(`tel:${phone.replace(/\D/g, '')}`);
  };


  const handleOpenWhatsapp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const handleCreateClient = (lead: AutomationLead) => {
    navigate('/clients/new', {
      state: {
        prefill: {
          name: lead.name !== 'Contato via Instagram' && lead.name !== 'Visitante Site' ? lead.name : '',
          phone: lead.phone,
          origin: lead.origin,
          notes: `Resumo IA: ${lead.aiSummary}\n\nDados Coletados:\nRenda: ${lead.data?.income}\nRegião: ${lead.data?.region}\nTipo: ${lead.data?.propertyType}`,
        },
      },
    });
  };

  return (
    <div className="h-full flex flex-col bg-surface-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 bg-card-bg shadow-sm z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-text-primary">Gestão de Clientes</h1>
          <RoundedButton
            size="sm"
            onClick={() => navigate('/clients/new')}
            className="flex items-center gap-1"
          >
            <Plus size={16} /> Novo
          </RoundedButton>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-50 rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 transition-all placeholder:text-text-secondary"
            />
          </div>
          <button className="p-3 bg-surface-50 rounded-xl text-text-secondary hover:bg-surface-100">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="pt-4 pb-2 px-6 overflow-x-auto no-scrollbar flex gap-2">
        <button
          onClick={() => setActiveStage('Todos')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${activeStage === 'Todos'
            ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md'
            : 'bg-card-bg text-text-secondary border border-surface-200'
            }`}
        >
          Todos ({clients.length})
        </button>
        {CLIENT_STAGES.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${activeStage === stage
              ? 'bg-gold-500 text-white shadow-md'
              : 'bg-card-bg text-text-secondary border border-surface-200'
              }`}
          >
            {stage}
          </button>
        ))}
      </div>

      {/* Client List */}
      <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto pb-24">
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-gold-500" size={32} />
          </div>
        )}

        {/* Automation Leads Section */}
        {filteredLeads.length > 0 && (
          <div className="space-y-4 mb-6">
            {filteredLeads.map((lead) => (
              <PremiumCard
                key={lead.id}
                className="relative border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Novo Lead (Automação)</span>
                  </div>
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(lead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="mb-3">
                  <h3 className="font-bold text-text-primary text-lg">{lead.name}</h3>
                  <p className="text-xs text-text-secondary truncate">{lead.origin}</p>
                </div>

                <div className="bg-surface-50 p-2 rounded-lg border border-surface-100 mb-4">
                  <p className="text-xs text-text-secondary line-clamp-2">
                    <span className="font-semibold text-text-primary">IA:</span> {lead.aiSummary}
                  </p>
                </div>

                <div className="flex gap-2">
                  <RoundedButton
                    onClick={() => handleOpenWhatsapp(lead.phone)}
                    className="flex-1 h-9 text-xs bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-none"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </RoundedButton>
                  <RoundedButton
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    onClick={() => handleCreateClient(lead)}
                  >
                    <UserPlus size={14} /> Ficha
                  </RoundedButton>
                </div>
              </PremiumCard>
            ))}
          </div>
        )}

        {/* Regular Clients */}
        {filteredClients.map((client) => (
          <PremiumCard
            key={client.id}
            className="relative group cursor-pointer hover:border-gold-300 transition-colors"
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-text-primary text-lg">{client.name}</h3>
                <p className="text-sm text-text-secondary">{client.development || 'Sem empreendimento'}</p>
              </div>
              <StatusBadge status={client.stage} />
            </div>

            <div className="flex justify-between items-center mt-2 mb-4">
              <span className="font-mono text-sm font-semibold text-text-primary bg-surface-100 px-2 py-1 rounded-md">
                {client.intendedValue || '—'}
              </span>
            </div>

            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <RoundedButton
                variant="secondary"
                size="sm"
                className="flex-1 h-9 text-xs"
                onClick={(e) => handleCall(client.phone, e)}
              >
                <Phone size={14} /> Ligar
              </RoundedButton>
              <RoundedButton
                variant="secondary"
                size="sm"
                className="flex-1 h-9 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/clients/${client.id}/email`);
                }}
              >
                <Mail size={14} /> Email
              </RoundedButton>
            </div>
          </PremiumCard>
        ))}

        {filteredClients.length === 0 && filteredLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-text-secondary gap-3">
            <p>Nenhum cliente encontrado</p>
            <RoundedButton size="sm" variant="outline" onClick={() => navigate('/clients/new')}>
              <Plus size={16} /> Adicionar cliente
            </RoundedButton>
          </div>
        )}
      </div>
    </div>
  );
}
