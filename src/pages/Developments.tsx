import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PremiumCard, StatusBadge, SectionHeader, RoundedButton } from '@/components/ui/PremiumComponents';
import { Search, MapPin, Building2, Filter, ChevronRight, Plus, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { MOCK_DEVELOPMENTS, Development } from '@/data/developments';
import { FAB } from '@/components/Layout';
import { Modal } from '@/components/ui/Modal';

export default function Developments() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDev, setNewDev] = useState<Partial<Development>>({
    name: '',
    builder: '',
    location: '',
    address: '',
    price: '',
    minIncome: '',
    type: 'Apartamento',
    status: 'Lançamento',
    description: '',
    differentials: [],
    images: [],
    contact: {
      name: '',
      phone: '',
      email: '',
      role: '',
      avatar: ''
    }
  });

  const [differentialsInput, setDifferentialsInput] = useState('');

  const filteredDevelopments = MOCK_DEVELOPMENTS.filter(dev => 
    dev.name.toLowerCase().includes(filter.toLowerCase()) || 
    dev.builder.toLowerCase().includes(filter.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDev(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDev(prev => ({
      ...prev,
      contact: { ...prev.contact!, [name]: value }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Mock upload - in real app, upload to server/storage
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setNewDev(prev => ({ ...prev, images: [...(prev.images || []), fileUrl] }));
    }
  };

  const handleBookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Mock upload
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setNewDev(prev => ({ ...prev, bookPdfUrl: fileUrl }));
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Mock upload
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setNewDev(prev => ({
        ...prev,
        contact: { ...prev.contact!, avatar: fileUrl }
      }));
    }
  };

  const handleSubmit = () => {
    // In a real app, send to API
    console.log('New Development:', {
      ...newDev,
      differentials: differentialsInput.split('\n').filter(d => d.trim())
    });
    setIsModalOpen(false);
    // Reset form
    setNewDev({
      name: '',
      builder: '',
      location: '',
      address: '',
      price: '',
      minIncome: '',
      type: 'Apartamento',
      status: 'Lançamento',
      description: '',
      differentials: [],
      images: [],
      contact: { name: '', phone: '', email: '', role: '', avatar: '' }
    });
    setDifferentialsInput('');
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <div className="flex justify-between items-start mb-4">
        <SectionHeader title="Empreendimentos" subtitle="Catálogo exclusivo" />
        <RoundedButton size="sm" onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 mt-2">
          <Plus size={16} /> Novo
        </RoundedButton>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, construtora..." 
            className="w-full pl-10 pr-4 py-3 bg-card-bg rounded-xl text-sm shadow-sm border border-surface-200 focus:outline-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary placeholder:text-text-secondary"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button className="p-3 bg-card-bg rounded-xl text-text-secondary border border-surface-200 shadow-sm hover:bg-surface-100">
          <Filter size={20} />
        </button>
      </div>

      {/* List */}
      <div className="space-y-6">
        {filteredDevelopments.map((dev) => (
          <PremiumCard 
            key={dev.id} 
            className="p-0 overflow-hidden group cursor-pointer border-none"
            onClick={() => navigate(`/developments/${dev.id}`)}
          >
            <div className="relative h-40">
              <img 
                src={dev.images[0]} 
                alt={dev.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3">
                <StatusBadge status={dev.status} className="bg-white/90 dark:bg-black/80 backdrop-blur-sm shadow-sm" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="text-white font-bold text-lg">{dev.name}</h3>
                <p className="text-white/80 text-xs flex items-center gap-1">
                  <Building2 size={12} /> {dev.builder}
                </p>
              </div>
            </div>
            
            <div className="p-4 space-y-3 bg-card-bg">
              <div className="flex justify-between items-start">
                <div className="text-xs text-text-secondary flex items-center gap-1">
                  <MapPin size={14} className="text-gold-500" /> {dev.location}
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-surface-100 rounded-md text-text-secondary">
                  {dev.type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-surface-100">
                <div>
                  <p className="text-[10px] text-text-secondary uppercase tracking-wider">Preço</p>
                  <p className="text-sm font-bold text-text-primary">{dev.price}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-secondary uppercase tracking-wider">Renda Mínima</p>
                  <p className="text-sm font-bold text-text-primary">{dev.minIncome}</p>
                </div>
              </div>

              <button className="w-full mt-2 py-2 text-sm font-medium text-gold-600 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded-lg transition-colors flex items-center justify-center gap-1">
                Ver Detalhes <ChevronRight size={16} />
              </button>
            </div>
          </PremiumCard>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Empreendimento">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Info */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-text-secondary uppercase">Dados Gerais</h4>
            <div className="grid grid-cols-1 gap-4">
              <input 
                name="name"
                placeholder="Nome do Empreendimento"
                value={newDev.name}
                onChange={handleInputChange}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
              <input 
                name="builder"
                placeholder="Construtora"
                value={newDev.builder}
                onChange={handleInputChange}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
              <input 
                name="location"
                placeholder="Localização (Bairro, Cidade)"
                value={newDev.location}
                onChange={handleInputChange}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
              <input 
                name="address"
                placeholder="Endereço Completo"
                value={newDev.address}
                onChange={handleInputChange}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  name="price"
                  placeholder="Faixa de Preço"
                  value={newDev.price}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
                />
                <input 
                  name="minIncome"
                  placeholder="Renda Mínima"
                  value={newDev.minIncome}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select 
                  name="type"
                  value={newDev.type}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
                >
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Flat">Flat</option>
                  <option value="Lote">Lote</option>
                </select>
                <select 
                  name="status"
                  value={newDev.status}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
                >
                  <option value="Lançamento">Lançamento</option>
                  <option value="Em Construção">Em Construção</option>
                  <option value="Pronto">Pronto</option>
                </select>
              </div>
            </div>
          </section>

          {/* Details */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-text-secondary uppercase">Detalhes</h4>
            <textarea 
              name="description"
              placeholder="Descrição do empreendimento..."
              value={newDev.description}
              onChange={handleInputChange}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary h-24"
            />
            <textarea 
              placeholder="Diferenciais (um por linha)"
              value={differentialsInput}
              onChange={(e) => setDifferentialsInput(e.target.value)}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary h-24"
            />
          </section>

          {/* Media */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-text-secondary uppercase">Mídia e Arquivos</h4>
            
            {/* Images */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Fotos do Empreendimento</label>
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                <label className="w-20 h-20 flex flex-col items-center justify-center bg-surface-50 border-2 border-dashed border-surface-200 rounded-xl cursor-pointer hover:bg-surface-100 flex-shrink-0">
                  <Upload size={20} className="text-text-secondary" />
                  <span className="text-[10px] text-text-secondary mt-1">Adicionar</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {newDev.images?.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setNewDev(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }))}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Book PDF */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Book Digital (PDF)</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-surface-50 rounded-lg cursor-pointer hover:bg-surface-100 border border-surface-200">
                  <Upload size={16} className="text-text-secondary" />
                  <span className="text-sm text-text-primary">Upload PDF</span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleBookUpload} />
                </label>
                {newDev.bookPdfUrl && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                    <FileText size={14} />
                    <span>Book anexado</span>
                    <button onClick={() => setNewDev(prev => ({ ...prev, bookPdfUrl: undefined }))} className="text-red-500 ml-2"><X size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-text-secondary uppercase">Viabilizador Responsável</h4>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 rounded-full bg-surface-100 overflow-hidden flex-shrink-0">
                {newDev.contact?.avatar ? (
                  <img src={newDev.contact.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary">
                    <ImageIcon size={24} />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload size={16} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <input 
                  name="name"
                  placeholder="Nome do Responsável"
                  value={newDev.contact?.name}
                  onChange={handleContactChange}
                  className="w-full p-2 bg-surface-50 rounded-lg border-none text-sm"
                />
                <input 
                  name="role"
                  placeholder="Cargo (ex: Gerente de Produto)"
                  value={newDev.contact?.role}
                  onChange={handleContactChange}
                  className="w-full p-2 bg-surface-50 rounded-lg border-none text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                name="phone"
                placeholder="Telefone / WhatsApp"
                value={newDev.contact?.phone}
                onChange={handleContactChange}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
              <input 
                name="email"
                placeholder="Email"
                value={newDev.contact?.email}
                onChange={handleContactChange}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
            </div>
          </section>

          <RoundedButton fullWidth onClick={handleSubmit}>
            Salvar Empreendimento
          </RoundedButton>
        </div>
      </Modal>
    </div>
  );
}
