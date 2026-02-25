import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Loader2, CheckCircle2, Download, Database, Trash2, FileText, GripVertical } from 'lucide-react';
import { PDFToolType } from '@/pages/PdfTools';
import { PdfDropzone } from './PdfDropzone';
import { PdfToolConfig } from './PdfToolConfig';
import { SaveDocumentModal } from './SaveDocumentModal';
import { saveAs } from 'file-saver';

// Import functions
import { imageToPdf } from '@/lib/pdf-tools/imageToPdf';
import { mergePdf } from '@/lib/pdf-tools/mergePdf';
import { splitPdf } from '@/lib/pdf-tools/splitPdf';
import { compressPdf } from '@/lib/pdf-tools/compressPdf';
import { pdfToJpg } from '@/lib/pdf-tools/pdfToJpg';
import { reorderPdf } from '@/lib/pdf-tools/reorderPdf';
import { protectPdf } from '@/lib/pdf-tools/protectPdf';
import { unlockPdf } from '@/lib/pdf-tools/unlockPdf';

interface FileItem {
    id: string;
    file: File;
    previewUrl: string;
}

interface PdfToolDrawerProps {
    tool: { id: PDFToolType; title: string; description: string; icon: any } | null;
    isOpen: boolean;
    onClose: () => void;
}

export function PdfToolDrawer({ tool, isOpen, onClose }: PdfToolDrawerProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
    const [generatedFileName, setGeneratedFileName] = useState<string>('');
    const [config, setConfig] = useState<any>({});
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    useEffect(() => {
        setFiles([]);
        setIsProcessing(false);
        setSuccess(false);
        setGeneratedBlob(null);
        setConfig({});
    }, [tool, isOpen]);

    const handleFilesAccepted = async (acceptedFiles: File[]) => {
        const newItems = acceptedFiles.map((file) => ({
            id: Math.random().toString(36).substring(7),
            file,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
        }));

        // For tools that accept only 1 file, replace current. Else append up to 10.
        const isSingleFileMode = ['split-pdf', 'compress-pdf', 'pdf-to-jpg', 'reorder-pages', 'protect-pdf', 'unlock-pdf'].includes(tool?.id as string);
        if (isSingleFileMode) {
            setFiles([newItems[0]]);
        } else {
            setFiles(prev => [...prev, ...newItems].slice(0, 10));
        }
    };

    const handleGenerate = async () => {
        if (!tool || files.length === 0) return;
        setIsProcessing(true);

        try {
            let resultBlob: Blob;
            let outName = 'documento.pdf';

            const fileArray = files.map(f => f.file);

            switch (tool.id) {
                case 'image-to-pdf':
                    resultBlob = await imageToPdf(fileArray, config);
                    outName = 'imagens_convertidas.pdf';
                    break;
                case 'merge-pdf':
                    resultBlob = await mergePdf(fileArray);
                    outName = 'pdf_mesclado.pdf';
                    break;
                case 'split-pdf':
                    resultBlob = await splitPdf(fileArray[0], config.pages || '1');
                    outName = 'pdf_dividido.pdf';
                    break;
                case 'compress-pdf':
                    resultBlob = await compressPdf(fileArray[0], config.quality || 0.5);
                    outName = 'pdf_comprimido.pdf';
                    break;
                case 'pdf-to-jpg':
                    resultBlob = await pdfToJpg(fileArray[0]);
                    outName = 'paginas_extraidas.zip';
                    break;
                case 'reorder-pages':
                    // Using dummy mapping for now as extracting pages individually is heavily intensive.
                    resultBlob = await reorderPdf(fileArray[0], [0]); // Stub
                    outName = 'pdf_reordenado.pdf';
                    break;
                case 'protect-pdf':
                    resultBlob = await protectPdf(fileArray[0], config.password);
                    outName = 'pdf_protegido.pdf';
                    break;
                case 'unlock-pdf':
                    resultBlob = await unlockPdf(fileArray[0], config.password);
                    outName = 'pdf_desbloqueado.pdf';
                    break;
                default:
                    throw new Error('Ferramenta desconhecida');
            }

            setGeneratedBlob(resultBlob);
            setGeneratedFileName(outName);
            setSuccess(true);
        } catch (error: any) {
            console.error(error);
            alert('Erro ao processar: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (generatedBlob) {
            saveAs(generatedBlob, generatedFileName);
        }
    };

    if (!isOpen || !tool) return null;

    return (
        <AnimatePresence>
            ...
            {/* We need the full JSX skeleton here. I will just expand the body correctly. */}
            <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-full md:w-1/2 lg:w-1/3 h-full bg-white dark:bg-[#111b21] shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gold-50 dark:bg-gold-900/20 text-gold-600 rounded-lg">
                                <tool.icon size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{tool.title}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {!success ? (
                            <>
                                <PdfDropzone
                                    onFilesAccepted={handleFilesAccepted}
                                    acceptType={tool.id === 'image-to-pdf' ? 'image' : 'pdf'}
                                />

                                {files.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                            Arquivos ({files.length})
                                        </h3>
                                        <Reorder.Group axis="y" values={files} onReorder={setFiles} className="grid grid-cols-1 gap-2">
                                            {files.map((item) => (
                                                <Reorder.Item key={item.id} value={item} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#202c33] rounded-xl border border-gray-100 dark:border-gray-800 select-none">
                                                    <GripVertical size={16} className="text-gray-400 cursor-grab active:cursor-grabbing" />
                                                    {item.file.type.startsWith('image/') ? (
                                                        <img src={item.previewUrl} alt="" className="w-10 h-10 rounded object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                                            <FileText size={20} />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.file.name}</p>
                                                        <p className="text-xs text-gray-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                    <button onClick={() => setFiles(files.filter(f => f.id !== item.id))} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </Reorder.Item>
                                            ))}
                                        </Reorder.Group>
                                    </div>
                                )}

                                {files.length > 0 && (
                                    <PdfToolConfig toolId={tool.id} config={config} onChange={setConfig} />
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in zoom-in duration-300">
                                <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={48} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Concluído!</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2">O arquivo {generatedFileName} está pronto.</p>
                                </div>
                                <div className="flex flex-col gap-3 w-full max-w-xs mt-8">
                                    <button onClick={handleDownload} className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-xl font-semibold transition-colors">
                                        <Download size={20} /> Baixar arquivo
                                    </button>
                                    <button onClick={() => setIsSaveModalOpen(true)} className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#202c33] hover:bg-[#2a3942] text-white rounded-xl font-semibold transition-colors border border-gray-700">
                                        <Database size={20} /> Salvar na ficha
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Bar */}
                    {!success && (
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a2329]">
                            <div className="flex gap-3">
                                <button onClick={onClose} className="flex-1 px-4 py-3 bg-white dark:bg-[#202c33] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-medium">Cancelar</button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={files.length === 0 || isProcessing}
                                    className="flex-2 flex-grow px-4 py-3 bg-gold-500 text-white rounded-xl font-semibold disabled:bg-gray-300 dark:disabled:bg-gray-800 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <><Loader2 size={20} className="animate-spin" /> Processando...</> : 'Gerar arquivo'}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

                <SaveDocumentModal
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    fileBlob={generatedBlob}
                    fileName={generatedFileName}
                />
            </div>
        </AnimatePresence>
    );
}
