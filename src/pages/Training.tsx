import { useState } from 'react';
import { PremiumCard, SectionHeader, RoundedButton } from '@/components/ui/PremiumComponents';
import { PlayCircle, FileText, Image as ImageIcon, Plus, X, ExternalLink } from 'lucide-react';
import { FAB } from '@/components/Layout';
import { Modal } from '@/components/ui/Modal';
import { useAuthorization } from '@/hooks/useAuthorization';

interface TrainingItem {
  id: string;
  title: string;
  type: 'Vídeo' | 'PDF' | 'Imagem';
  url: string;
  thumbnail?: string;
  duration?: string;
  description?: string;
  progress: number; // 0-100
}

const INITIAL_TRAININGS: TrainingItem[] = [
  {
    id: '1',
    title: 'Técnicas de Negociação Avançada',
    type: 'Vídeo',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder video
    thumbnail: 'https://picsum.photos/seed/neg/400/300',
    duration: '45 min',
    description: 'Aprenda as melhores estratégias para fechar grandes negócios.',
    progress: 75,
  },
  {
    id: '2',
    title: 'Novo Processo de Financiamento',
    type: 'PDF',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnail: 'https://picsum.photos/seed/fin/400/300',
    duration: '15 pág',
    description: 'Guia completo sobre as novas regras de financiamento imobiliário.',
    progress: 0,
  },
  {
    id: '3',
    title: 'Postura e Ética Profissional',
    type: 'Imagem',
    url: 'https://picsum.photos/seed/etic_full/800/600',
    thumbnail: 'https://picsum.photos/seed/etic/400/300',
    duration: 'Visualização',
    description: 'Infográfico sobre conduta ética no ambiente de trabalho.',
    progress: 100,
  }
];

export default function Training() {
  const { isBroker, canCreateStrategicResources } = useAuthorization();
  const [trainings, setTrainings] = useState<TrainingItem[]>(INITIAL_TRAININGS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<TrainingItem | null>(null);

  const [formData, setFormData] = useState<Partial<TrainingItem>>({
    title: '',
    type: 'Vídeo',
    url: '',
    duration: '',
    description: ''
  });

  const handleAddTraining = () => {
    if (!formData.title || !formData.url) return;

    const newItem: TrainingItem = {
      id: Date.now().toString(),
      title: formData.title,
      type: formData.type as 'Vídeo' | 'PDF' | 'Imagem',
      url: formData.url,
      duration: formData.duration || 'N/A',
      description: formData.description || '',
      progress: 0,
      thumbnail: `https://picsum.photos/seed/${Date.now()}/400/300` // Random thumbnail
    };

    setTrainings(prev => [...prev, newItem]);
    setIsAddModalOpen(false);
    setFormData({ title: '', type: 'Vídeo', url: '', duration: '', description: '' });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Vídeo': return <PlayCircle className="text-white" size={24} />;
      case 'PDF': return <FileText className="text-white" size={24} />;
      case 'Imagem': return <ImageIcon className="text-white" size={24} />;
      default: return <FileText className="text-white" size={24} />;
    }
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <div className="flex justify-between items-start mb-4">
        <SectionHeader title="Treinamentos" subtitle="Universidade Corporativa" />
        {canCreateStrategicResources && (
          <RoundedButton size="sm" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1 mt-2">
            <Plus size={16} /> Novo
          </RoundedButton>
        )}
      </div>

      <div className="space-y-4">
        {trainings.map((item) => (
          <PremiumCard
            key={item.id}
            className="p-4 flex gap-4 cursor-pointer hover:bg-surface-100 transition-colors"
            onClick={() => setViewingItem(item)}
          >
            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black">
              <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 flex items-center justify-center">
                {getIcon(item.type)}
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h4 className="font-semibold text-text-primary line-clamp-2 leading-tight">{item.title}</h4>
                <p className="text-xs text-text-secondary mt-1">{item.type} • {item.duration}</p>
              </div>

              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className={item.progress === 100 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-text-secondary'}>
                    {item.progress === 100 ? 'Concluído' : `${item.progress}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.progress === 100 ? 'bg-green-500' : 'bg-gold-400'}`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adicionar Treinamento"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Título</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Ex: Técnicas de Vendas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
            <div className="flex gap-2">
              {['Vídeo', 'PDF', 'Imagem'].map(type => (
                <button
                  key={type}
                  onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${formData.type === type
                    ? 'bg-gold-50 border-gold-400 text-gold-700 dark:bg-gold-900/20 dark:text-gold-400'
                    : 'bg-surface-50 border-surface-200 text-text-secondary'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">URL do Conteúdo</label>
            <input
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Duração / Páginas</label>
            <input
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Ex: 30 min, 10 pág"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary min-h-[80px]"
              placeholder="Sobre o que é este treinamento..."
            />
          </div>

          <RoundedButton fullWidth onClick={handleAddTraining} className="mt-4">
            Adicionar
          </RoundedButton>
        </div>
      </Modal>

      {/* View Modal */}
      {viewingItem && (
        <Modal
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          title={viewingItem.type}
        >
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary">{viewingItem.title}</h3>
            <p className="text-sm text-text-secondary">{viewingItem.description}</p>

            <div className="mt-4 bg-black rounded-xl overflow-hidden min-h-[200px] flex items-center justify-center relative">
              {viewingItem.type === 'Vídeo' && (
                <iframe
                  src={viewingItem.url}
                  className="w-full aspect-video"
                  title={viewingItem.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}

              {viewingItem.type === 'Imagem' && (
                <img
                  src={viewingItem.url}
                  alt={viewingItem.title}
                  className="w-full h-auto max-h-[60vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              )}

              {viewingItem.type === 'PDF' && (
                <div className="p-8 text-center bg-surface-100 w-full">
                  <FileText size={48} className="mx-auto text-text-secondary mb-4" />
                  <p className="text-text-primary font-medium mb-4">Este documento é um PDF.</p>
                  <RoundedButton onClick={() => window.open(viewingItem.url, '_blank')}>
                    <ExternalLink size={18} className="mr-2" /> Abrir PDF
                  </RoundedButton>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setViewingItem(null)}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
