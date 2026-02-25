import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileImage,
  FileInput,
  FileOutput,
  Minimize2,
  Image as ImageIcon,
  ArrowDownUp,
  Lock,
  Unlock,
  Download,
  FileText
} from 'lucide-react';
import { PdfToolCard } from '@/components/pdf-tools/PdfToolCard';
import { PdfToolDrawer } from '@/components/pdf-tools/PdfToolDrawer';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';

export type PDFToolType =
  | 'image-to-pdf'
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'pdf-to-jpg'
  | 'reorder-pages'
  | 'protect-pdf'
  | 'unlock-pdf';

const TOOLS = [
  { id: 'image-to-pdf', title: 'Imagem para PDF', description: 'Converta imagens JPG, PNG ou WEBP para PDF em segundos.', icon: FileImage },
  { id: 'merge-pdf', title: 'Mesclar PDFs', description: 'Junte vários arquivos PDF em um único documento organizado.', icon: FileInput },
  { id: 'split-pdf', title: 'Dividir PDF', description: 'Extraia páginas ou divida um PDF grande em múltiplos arquivos menores.', icon: FileOutput },
  { id: 'compress-pdf', title: 'Comprimir PDF', description: 'Reduza o tamanho do seu PDF mantendo a melhor qualidade possível.', icon: Minimize2 },
  { id: 'pdf-to-jpg', title: 'PDF para JPG', description: 'Extraia todas as páginas de um PDF e converta para imagens JPG.', icon: ImageIcon },
  { id: 'protect-pdf', title: 'Proteger PDF', description: 'Adicione uma senha criptografada para proteger seu documento confidencial.', icon: Lock },
  { id: 'unlock-pdf', title: 'Remover Senha', description: 'Remova senhas e restrições de PDFs protegidos (requer a senha original).', icon: Unlock },
] as const;

export default function PdfTools() {
  const { profile } = useApp();
  const [activeTool, setActiveTool] = useState<typeof TOOLS[number] | null>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchRecentDocs = async () => {
      try {
        const { data, error } = await supabase
          .from('client_documents')
          .select('id, name, type, url, upload_date')
          .eq('created_by', profile.id)
          .order('upload_date', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentDocs(data || []);
      } catch (error) {
        console.error('Error fetching recent docs:', error);
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchRecentDocs();

    // Subscribe to realtime changes on this table to auto-update
    const subscription = supabase
      .channel('public:client_documents')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'client_documents', filter: `created_by=eq.${profile.id}` },
        (payload) => {
          setRecentDocs(prev => [payload.new, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile?.id]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111b21] pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Conversor de PDF</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Ferramentas inteligentes para manipulação e organização de documentos</p>
          </div>
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200 dark:border-green-800/50">
            <ShieldCheck size={16} />
            <span>Processamento local seguro</span>
          </div>
        </div>

        {/* Recent Documents Section */}
        {recentDocs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Documentos recentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex items-start gap-3">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">{new Date(doc.upload_date).toLocaleDateString()}</p>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-gold-500 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded-lg transition-colors"
                  >
                    <Download size={16} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => (
            <PdfToolCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              onClick={() => setActiveTool(tool)}
            />
          ))}
        </div>
      </div>

      {/* Slide-out Drawer Panel */}
      <PdfToolDrawer
        tool={activeTool}
        isOpen={!!activeTool}
        onClose={() => setActiveTool(null)}
      />
    </div>
  );
}
