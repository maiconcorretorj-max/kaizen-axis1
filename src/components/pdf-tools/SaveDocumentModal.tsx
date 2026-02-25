import { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';

interface SaveDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileBlob: Blob | null;
    fileName: string;
}

export function SaveDocumentModal({ isOpen, onClose, fileBlob, fileName }: SaveDocumentModalProps) {
    const { profile } = useApp();
    const [clients, setClients] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [docType, setDocType] = useState('Outros');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const searchClients = async () => {
            setLoadingClients(true);
            try {
                let query = supabase.from('clients').select('id, name').limit(10);
                if (search) {
                    query = query.ilike('name', `%${search}%`);
                }
                const { data, error } = await query;
                if (!error && data) {
                    setClients(data);
                }
            } finally {
                setLoadingClients(false);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            searchClients();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, isOpen]);

    const handleSave = async () => {
        if (!selectedClient || !fileBlob || !profile) return;
        setIsSaving(true);
        try {
            // 1. Upload to Storage
            const fileExt = fileName.split('.').pop();
            const storagePath = `${selectedClient.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('client-documents')
                .upload(storagePath, fileBlob, {
                    contentType: fileBlob.type,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('client-documents')
                .getPublicUrl(storagePath);

            // 2. Insert into client_documents
            const { error: dbError } = await supabase
                .from('client_documents')
                .insert({
                    client_id: selectedClient.id,
                    name: fileName,
                    type: docType,
                    description: description,
                    url: publicUrl,
                    created_by: profile.id
                });

            if (dbError) throw dbError;

            alert('Documento salvo com sucesso na ficha do cliente!');
            onClose();
        } catch (error) {
            console.error('Error saving document:', error);
            alert('Erro ao salvar documento. Verifique as permissões.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Salvar na Ficha do Cliente</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Client Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar Cliente</label>
                        <div className="relative">
                            <Search className="absolute text-gray-400 left-3 top-2.5" size={18} />
                            <input
                                type="text"
                                placeholder="Nome do cliente..."
                                value={selectedClient ? selectedClient.name : search}
                                onChange={e => {
                                    setSearch(e.target.value);
                                    setSelectedClient(null);
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#1a2329] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-gold-500 focus:border-gold-500 dark:text-white"
                            />
                        </div>
                        {!selectedClient && search && clients.length > 0 && (
                            <div className="absolute z-10 w-[calc(100%-2rem)] mt-1 bg-white dark:bg-[#2a3942] border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {clients.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => { setSelectedClient(c); setSearch(''); }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#202c33] text-sm text-gray-900 dark:text-white"
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Documento</label>
                        <select
                            value={docType}
                            onChange={e => setDocType(e.target.value)}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#1a2329] text-gray-900 dark:text-white focus:ring-gold-500 focus:border-gold-500 text-sm"
                        >
                            <option value="Identidade">Identidade</option>
                            <option value="Comprovante de Renda">Comprovante de Renda</option>
                            <option value="Comprovante de Residência">Comprovante de Residência</option>
                            <option value="Contrato">Contrato</option>
                            <option value="Declaração">Declaração</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vincular Arquivo</label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-[#111b21] rounded-lg text-sm text-gray-600 dark:text-gray-400 truncate">
                            {fileName}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-[#1a2329] flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#202c33] rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedClient || isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gold-500 hover:bg-gold-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded-lg transition-colors"
                    >
                        {isSaving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Confirmar e Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
