import { useState } from 'react';
import { PremiumCard, RoundedButton, SectionHeader } from '@/components/ui/PremiumComponents';
import { UploadCloud, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function IncomeAnalysis() {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setStep(2);
    }, 2000);
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <SectionHeader 
        title="Apuração de Renda" 
        subtitle="Análise determinística de extratos bancários"
      />

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <PremiumCard className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome Completo</label>
                <input type="text" className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary placeholder:text-text-secondary" placeholder="Ex: João da Silva" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">CPF</label>
                <input type="text" className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary placeholder:text-text-secondary" placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome da Mãe</label>
                <input type="text" className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary placeholder:text-text-secondary" placeholder="Ex: Maria da Silva" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome do Pai</label>
                <input type="text" className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary placeholder:text-text-secondary" placeholder="Ex: José da Silva" />
              </div>
            </PremiumCard>

            <PremiumCard className="border-dashed border-2 border-surface-300 bg-surface-50 flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-card-bg rounded-full flex items-center justify-center shadow-sm mb-4">
                <UploadCloud className="text-gold-500" size={32} />
              </div>
              <h3 className="font-medium text-text-primary">Upload de Extrato (PDF)</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-[200px]">Arraste ou clique para selecionar extratos bancários (Itaú, Bradesco, Nubank)</p>
              <RoundedButton variant="outline" size="sm" className="mt-4">
                Selecionar Arquivo
              </RoundedButton>
            </PremiumCard>

            <RoundedButton 
              fullWidth 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              className="mt-8"
            >
              {isAnalyzing ? 'Processando IA...' : 'Iniciar Análise'}
            </RoundedButton>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Result Summary */}
            <div className="grid grid-cols-2 gap-4">
              <PremiumCard highlight className="col-span-2 text-center py-6">
                <p className="text-sm text-gold-700 dark:text-gold-400 font-medium uppercase tracking-wider">Renda Média Mensal</p>
                <h2 className="text-4xl font-bold text-text-primary mt-2">R$ 12.450</h2>
                <div className="flex items-center justify-center gap-2 mt-2 text-green-600 dark:text-green-400 text-sm font-medium">
                  <CheckCircle2 size={16} /> Alta Confiabilidade (98%)
                </div>
              </PremiumCard>
              
              <PremiumCard className="text-center">
                <p className="text-xs text-text-secondary">Total Movimentado</p>
                <p className="text-lg font-bold text-text-primary mt-1">R$ 148k</p>
              </PremiumCard>
              <PremiumCard className="text-center">
                <p className="text-xs text-text-secondary">Período</p>
                <p className="text-lg font-bold text-text-primary mt-1">12 Meses</p>
              </PremiumCard>
            </div>

            {/* Monthly Breakdown */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-primary px-1">Detalhamento Mensal</h3>
              {[
                { month: 'Janeiro', value: 'R$ 12.100', valid: true },
                { month: 'Fevereiro', value: 'R$ 11.850', valid: true },
                { month: 'Março', value: 'R$ 13.200', valid: true },
                { month: 'Abril', value: 'R$ 45.000', valid: false, reason: 'Atípico (Venda de Carro)' },
              ].map((item, idx) => (
                <PremiumCard key={idx} className="flex justify-between items-center py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.valid ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div>
                      <p className="font-medium text-text-primary">{item.month}</p>
                      {!item.valid && <p className="text-[10px] text-yellow-600 dark:text-yellow-400">{item.reason}</p>}
                    </div>
                  </div>
                  <span className={`font-mono font-medium ${!item.valid ? 'text-text-secondary line-through decoration-text-secondary' : 'text-text-primary'}`}>
                    {item.value}
                  </span>
                </PremiumCard>
              ))}
            </div>

            <RoundedButton variant="outline" fullWidth onClick={() => setStep(1)}>
              Nova Análise
            </RoundedButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
