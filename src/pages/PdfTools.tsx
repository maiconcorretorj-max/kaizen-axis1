import { useState } from 'react';
import { SectionHeader, RoundedButton } from '@/components/ui/PremiumComponents';
import { UploadArea } from '@/components/pdf-tools/UploadArea';
import { FilePreviewCard } from '@/components/pdf-tools/FilePreviewCard';
import { GeneratedFilesList } from '@/components/pdf-tools/GeneratedFilesList';
import { FileItem, GeneratedFile } from '@/types/pdf-tools';
import { Reorder } from 'motion/react';
import { FileType, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';

export default function PdfTools() {
  // State for Image to PDF
  const [imageFiles, setImageFiles] = useState<FileItem[]>([]);
  const [isGeneratingImagePdf, setIsGeneratingImagePdf] = useState(false);

  // State for Merge PDF
  const [pdfFiles, setPdfFiles] = useState<FileItem[]>([]);
  const [isMergingPdf, setIsMergingPdf] = useState(false);

  // State for Generated Files
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // --- Image to PDF Logic ---

  const handleImageSelect = (files: File[]) => {
    const newItems: FileItem[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      type: 'image',
      rotation: 0,
      size: formatSize(file.size),
      previewUrl: URL.createObjectURL(file)
    }));
    setImageFiles(prev => [...prev, ...newItems]);
  };

  const handleRemoveImage = (id: string) => {
    setImageFiles(prev => prev.filter(item => item.id !== id));
  };

  const handleRotateImage = (id: string, direction: 'left' | 'right') => {
    setImageFiles(prev => prev.map(item => {
      if (item.id === id) {
        const newRotation = direction === 'left' 
          ? (item.rotation - 90) % 360 
          : (item.rotation + 90) % 360;
        return { ...item, rotation: newRotation };
      }
      return item;
    }));
  };

  const handleGenerateImagePdf = () => {
    if (imageFiles.length === 0) return;
    setIsGeneratingImagePdf(true);

    // Mock processing delay
    setTimeout(() => {
      const newFile: GeneratedFile = {
        id: Date.now().toString(),
        name: `Imagens_Convertidas_${new Date().toLocaleTimeString().replace(/:/g, '')}.pdf`,
        type: 'Convertido',
        createdAt: new Date(),
        size: '2.4 MB' // Mock size
      };
      setGeneratedFiles(prev => [newFile, ...prev]);
      setIsGeneratingImagePdf(false);
      setImageFiles([]); // Clear selection
      showToast('PDF gerado com sucesso!');
    }, 2000);
  };

  // --- Merge PDF Logic ---

  const handlePdfSelect = (files: File[]) => {
    const newItems: FileItem[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      type: 'pdf',
      rotation: 0,
      size: formatSize(file.size)
    }));
    setPdfFiles(prev => [...prev, ...newItems]);
  };

  const handleRemovePdf = (id: string) => {
    setPdfFiles(prev => prev.filter(item => item.id !== id));
  };

  const handleMergePdf = () => {
    if (pdfFiles.length < 2) return;
    setIsMergingPdf(true);

    // Mock processing delay
    setTimeout(() => {
      const newFile: GeneratedFile = {
        id: Date.now().toString(),
        name: `Mesclado_${new Date().toLocaleTimeString().replace(/:/g, '')}.pdf`,
        type: 'Mesclado',
        createdAt: new Date(),
        size: '5.1 MB' // Mock size
      };
      setGeneratedFiles(prev => [newFile, ...prev]);
      setIsMergingPdf(false);
      setPdfFiles([]); // Clear selection
      showToast('Arquivos mesclados com sucesso!');
    }, 2000);
  };

  // --- General Logic ---

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteGenerated = (id: string) => {
    if (confirm('Excluir este arquivo?')) {
      setGeneratedFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleDownload = (file: GeneratedFile) => {
    showToast(`Baixando ${file.name}...`);
    // Mock download logic
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50 relative">
      <SectionHeader title="Converter PDF" subtitle="Ferramentas de Documentos" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-green-400" />
          {toastMessage}
        </div>
      )}

      <div className="space-y-8">
        
        {/* Block 1: Image to PDF */}
        <section className="bg-white dark:bg-surface-50 rounded-2xl p-4 shadow-sm border border-surface-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gold-100 dark:bg-gold-900/20 rounded-lg text-gold-600 dark:text-gold-400">
              <ImageIcon size={20} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Converter Imagens em PDF</h2>
          </div>

          <UploadArea 
            label="Selecionar Imagens" 
            sublabel="JPG, PNG ou WebP" 
            accept="image/*" 
            onFilesSelected={handleImageSelect} 
            iconType="image"
          />

          {imageFiles.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Arquivos ({imageFiles.length})</span>
                <span className="text-xs text-text-secondary">Arraste para ordenar</span>
              </div>
              
              <Reorder.Group axis="y" values={imageFiles} onReorder={setImageFiles}>
                {imageFiles.map((item, index) => (
                  <FilePreviewCard 
                    key={item.id} 
                    item={item} 
                    index={index} 
                    onRemove={handleRemoveImage}
                    onRotateLeft={() => handleRotateImage(item.id, 'left')}
                    onRotateRight={() => handleRotateImage(item.id, 'right')}
                  />
                ))}
              </Reorder.Group>

              <RoundedButton 
                fullWidth 
                className="mt-4" 
                onClick={handleGenerateImagePdf}
                disabled={isGeneratingImagePdf}
              >
                {isGeneratingImagePdf ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Gerando PDF...
                  </span>
                ) : (
                  'Gerar PDF'
                )}
              </RoundedButton>
            </div>
          )}
        </section>

        {/* Block 2: Merge PDF */}
        <section className="bg-white dark:bg-surface-50 rounded-2xl p-4 shadow-sm border border-surface-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <FileType size={20} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Mesclar PDFs</h2>
          </div>

          <UploadArea 
            label="Selecionar Arquivos PDF" 
            sublabel="Selecione 2 ou mais arquivos" 
            accept=".pdf" 
            onFilesSelected={handlePdfSelect} 
            iconType="pdf"
          />

          {pdfFiles.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Arquivos ({pdfFiles.length})</span>
                <span className="text-xs text-text-secondary">Arraste para ordenar</span>
              </div>
              
              <Reorder.Group axis="y" values={pdfFiles} onReorder={setPdfFiles}>
                {pdfFiles.map((item, index) => (
                  <FilePreviewCard 
                    key={item.id} 
                    item={item} 
                    index={index} 
                    onRemove={handleRemovePdf}
                  />
                ))}
              </Reorder.Group>

              <RoundedButton 
                fullWidth 
                className="mt-4" 
                onClick={handleMergePdf}
                disabled={isMergingPdf || pdfFiles.length < 2}
              >
                {isMergingPdf ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Mesclando...
                  </span>
                ) : (
                  'Mesclar Arquivos'
                )}
              </RoundedButton>
              {pdfFiles.length < 2 && (
                <p className="text-center text-xs text-red-500 mt-2">Selecione pelo menos 2 arquivos para mesclar.</p>
              )}
            </div>
          )}
        </section>

        {/* Block 3: Generated Files */}
        <GeneratedFilesList 
          files={generatedFiles} 
          onDownload={handleDownload} 
          onDelete={handleDeleteGenerated} 
        />

      </div>
    </div>
  );
}
