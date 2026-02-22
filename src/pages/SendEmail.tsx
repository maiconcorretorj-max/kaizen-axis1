import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PremiumCard, RoundedButton, SectionHeader } from '@/components/ui/PremiumComponents';
import { ChevronLeft, Send, Paperclip, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Client } from '@/data/clients';
import { EmailInput } from '@/components/ui/EmailInput';
import { useApp } from '@/context/AppContext';

export default function SendEmail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient, userName } = useApp();
  const [client, setClient] = useState<Client | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<{ name: string, type: string }[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    const found = getClient(id);
    if (found) {
      setClient(found);
      setSubject(`Análise de Crédito - ${found.name} - ${found.development || ''}`);

      const documentsList = found.documents && found.documents.length > 0
        ? found.documents.map(d => `- ${d.name}`).join('\n')
        : '(Nenhum documento anexado)';

      const template = `Prezados,

Segue documentação para análise de crédito do cliente ${found.name}.

Dados do Cliente:
Nome: ${found.name}
CPF: ${found.cpf || 'Não informado'}
Email: ${found.email}
Telefone: ${found.phone}
Endereço: ${found.address || 'Não informado'}
Profissão: ${found.profession || 'Não informado'}
Renda: ${found.grossIncome}
${found.incomeType || 'Não informado'}
Cotista: ${found.cotista || 'Não'}
Fator Social: ${found.socialFactor || 'Não'}
Região de interesse: ${found.regionOfInterest || 'Não informado'}

Observação: ${found.observations || 'Nenhuma observação.'}

Corretor: ${userName}
COORDENADOR: MAICON OLIVEIRA
GERENTE: MARVYN LANDES`;

      setBody(template);

      if (found.documents) {
        setAttachments(found.documents.map(d => ({ name: d.name, type: 'pdf' })));
      }
    }
  }, [id, getClient, userName]);

  const handleSend = async () => {
    if (to.length === 0) {
      alert('Por favor, adicione pelo menos um destinatário.');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          cc,
          subject,
          text: body,
        },
      });

      if (error) throw error;

      alert('Email enviado com sucesso!');
      navigate(-1);
    } catch (error: any) {
      console.error('Erro ao enviar e-mail:', error);
      alert(`Erro ao enviar e-mail: ${error.message || 'Tente novamente.'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        type: 'pdf' // In a real app we'd check file.type
      }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!client) return <div className="p-6">Carregando...</div>;

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      {/* Header */}
      <div className="bg-card-bg shadow-sm px-4 py-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface-100 text-text-secondary">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Novo Email</h1>
        </div>
        <button
          onClick={handleSend}
          disabled={isSending}
          className="bg-gold-400 text-white px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 shadow-md hover:bg-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {isSending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>

      <div className="p-6 space-y-6">
        <PremiumCard className="space-y-4">
          <EmailInput
            label="Para"
            emails={to}
            onEmailsChange={setTo}
            placeholder="analise@banco.com"
          />

          <EmailInput
            label="Cc"
            emails={cc}
            onEmailsChange={setCc}
            placeholder="gerente@imobiliaria.com"
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Assunto</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary font-medium"
            />
          </div>
        </PremiumCard>

        <PremiumCard className="flex-1 min-h-[300px] flex flex-col">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full flex-1 bg-transparent border-none resize-none focus:outline-none text-text-primary leading-relaxed whitespace-pre-wrap"
            placeholder="Escreva sua mensagem..."
          />

          {/* Attachments Area */}
          <div className="mt-4 pt-4 border-t border-surface-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Paperclip size={12} /> Anexos ({attachments.length})
              </h4>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-gold-600 dark:text-gold-400 font-medium hover:underline cursor-pointer"
              >
                Adicionar
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf"
                multiple
                onChange={handleFileChange}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-surface-100 dark:bg-surface-200 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-300">
                  <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-500 rounded flex items-center justify-center">
                    <FileText size={12} />
                  </div>
                  <span className="text-xs font-medium text-text-primary truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="text-text-secondary hover:text-red-500 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {attachments.length === 0 && (
                <p className="text-xs text-text-secondary italic">Nenhum anexo selecionado.</p>
              )}
            </div>
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}
