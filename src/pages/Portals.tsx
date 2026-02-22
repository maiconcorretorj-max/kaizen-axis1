import { useState } from 'react';
import { PremiumCard, SectionHeader, RoundedButton } from '@/components/ui/PremiumComponents';
import { Globe, Plus, Edit2, Trash2, ExternalLink, Search, Building2, Landmark } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface Portal {
  id: string;
  name: string;
  url: string;
  category: 'Banco' | 'Construtora' | 'Outro';
  description?: string;
}

const INITIAL_PORTALS: Portal[] = [
  {
    id: '1',
    name: 'Portal Caixa',
    url: 'https://www.caixa.gov.br',
    category: 'Banco',
    description: 'Acesso ao sistema habitacional da Caixa'
  },
  {
    id: '2',
    name: 'Sicaq',
    url: 'https://www.caixa.gov.br/site/paginas/downloads.aspx',
    category: 'Banco',
    description: 'Sistema de Cadastro'
  },
  {
    id: '3',
    name: 'Moura Dubeux',
    url: 'https://mouradubeux.com.br',
    category: 'Construtora',
    description: 'Portal do Corretor'
  },
  {
    id: '4',
    name: 'MRV',
    url: 'https://www.mrv.com.br',
    category: 'Construtora',
    description: 'Vendas Online'
  }
];

export default function Portals() {
  const [portals, setPortals] = useState<Portal[]>(INITIAL_PORTALS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPortal, setEditingPortal] = useState<Portal | null>(null);
  const [formData, setFormData] = useState<Partial<Portal>>({
    name: '',
    url: '',
    category: 'Outro',
    description: ''
  });

  const filteredPortals = portals.filter(portal => 
    portal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    portal.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (portal?: Portal) => {
    if (portal) {
      setEditingPortal(portal);
      setFormData(portal);
    } else {
      setEditingPortal(null);
      setFormData({
        name: '',
        url: '',
        category: 'Outro',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.url) return;

    // Ensure URL has protocol
    let url = formData.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    if (editingPortal) {
      setPortals(prev => prev.map(p => 
        p.id === editingPortal.id ? { ...p, ...formData, url } as Portal : p
      ));
    } else {
      const newPortal: Portal = {
        id: Date.now().toString(),
        ...formData as Portal,
        url
      };
      setPortals(prev => [...prev, newPortal]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este portal?')) {
      setPortals(prev => prev.filter(p => p.id !== id));
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'Banco': return <Landmark size={20} className="text-blue-600 dark:text-blue-400" />;
      case 'Construtora': return <Building2 size={20} className="text-gold-600 dark:text-gold-400" />;
      default: return <Globe size={20} className="text-text-secondary" />;
    }
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <div className="flex justify-between items-start mb-4">
        <SectionHeader title="Portais" subtitle="Acesso rápido" />
        <RoundedButton size="sm" onClick={() => handleOpenModal()} className="flex items-center gap-1 mt-2">
          <Plus size={16} /> Novo
        </RoundedButton>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
        <input 
          type="text" 
          placeholder="Buscar portal..." 
          className="w-full pl-10 pr-4 py-3 bg-card-bg rounded-xl text-sm shadow-sm border border-surface-200 focus:outline-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary placeholder:text-text-secondary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredPortals.map(portal => (
          <PremiumCard key={portal.id} className="flex items-center gap-4 p-4 group">
            <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center flex-shrink-0">
              {getIcon(portal.category)}
            </div>
            
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(portal.url, '_blank')}>
              <h4 className="font-bold text-text-primary truncate flex items-center gap-2">
                {portal.name}
                <ExternalLink size={12} className="text-text-secondary opacity-50" />
              </h4>
              <p className="text-xs text-text-secondary truncate">{portal.description || portal.url}</p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleOpenModal(portal)}
                className="p-2 text-text-secondary hover:text-gold-600 hover:bg-surface-100 rounded-full transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(portal.id)}
                className="p-2 text-text-secondary hover:text-red-500 hover:bg-surface-100 rounded-full transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </PremiumCard>
        ))}

        {filteredPortals.length === 0 && (
          <div className="text-center py-10 text-text-secondary">
            <p>Nenhum portal encontrado.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPortal ? 'Editar Portal' : 'Novo Portal'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nome</label>
            <input 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Ex: Portal Caixa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">URL</label>
            <input 
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Categoria</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            >
              <option value="Banco">Banco</option>
              <option value="Construtora">Construtora</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
            <input 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Breve descrição..."
            />
          </div>

          <RoundedButton fullWidth onClick={handleSave} className="mt-4">
            Salvar
          </RoundedButton>
        </div>
      </Modal>
    </div>
  );
}
