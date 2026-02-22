import { useState } from 'react';
import { SectionHeader, PremiumCard, RoundedButton } from '@/components/ui/PremiumComponents';
import { Calculator, Calendar, DollarSign, Percent, Clock, ArrowRight, TrendingDown, CheckCircle2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScheduleRow {
  month: number;
  date: Date;
  installment: number;
  interest: number;
  amortization: number;
  balance: number;
}

interface SimulationResult {
  initialInstallment: number;
  baseTotalPaid: number;
  baseTotalInterest: number;
  balanceAfterExtra: number;
  interestSaved: number;
  termReduced: number;
  installmentReduced: number;
  newInstallmentAfterExtra: number;
  schedule: ScheduleRow[];
  insights: string;
}

export default function Amortization() {
  const [principalStr, setPrincipalStr] = useState('300000');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [term, setTerm] = useState('360');
  const [system, setSystem] = useState<'SAC' | 'PRICE'>('SAC');
  const [rateStr, setRateStr] = useState('9.5');
  const [rateType, setRateType] = useState<'ANUAL' | 'MENSAL'>('ANUAL');
  const [extraAmortizationStr, setExtraAmortizationStr] = useState('20000');
  const [amortizationType, setAmortizationType] = useState<'TERM' | 'INSTALLMENT'>('TERM');
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const parseNumber = (str: string) => {
    const num = parseFloat(str.replace(/\./g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  const handleSimulate = () => {
    const principal = parseNumber(principalStr);
    const rateInput = parseNumber(rateStr) / 100;
    const months = parseInt(term);
    const extraAmort = parseNumber(extraAmortizationStr);
    const start = new Date(startDate);

    if (principal <= 0 || rateInput <= 0 || months <= 0) {
      alert("Por favor, preencha os campos obrigatórios corretamente.");
      return;
    }

    // Convert rate to monthly if annual
    const monthlyRate = rateType === 'ANUAL' 
      ? Math.pow(1 + rateInput, 1 / 12) - 1 
      : rateInput;

    const simResult = simulate(principal, monthlyRate, months, system, start, extraAmort, amortizationType);
    setResult(simResult);
    setShowSchedule(false);
  };

  function simulate(
    principal: number,
    rate: number,
    term: number,
    system: 'SAC' | 'PRICE',
    startDate: Date,
    extraAmortization: number,
    amortizationType: 'TERM' | 'INSTALLMENT'
  ): SimulationResult {
    let baseBalance = principal;
    let baseTotalInterest = 0;
    let baseTotalPaid = 0;
    let initialInstallment = 0;
    let basePmt = system === 'PRICE' ? principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1) : 0;
    let baseAmort = system === 'SAC' ? principal / term : 0;
  
    for (let i = 1; i <= term; i++) {
      let int = baseBalance * rate;
      let amort = system === 'SAC' ? baseAmort : basePmt - int;
      let inst = amort + int;
      if (i === 1) initialInstallment = inst;
      baseBalance -= amort;
      baseTotalInterest += int;
      baseTotalPaid += inst;
    }
  
    let newBalance = principal;
    let newTotalInterest = 0;
    let newTotalPaid = 0;
    let schedule: ScheduleRow[] = [];
    
    let int1 = newBalance * rate;
    let amort1 = system === 'SAC' ? baseAmort : basePmt - int1;
    let inst1 = amort1 + int1;
    
    amort1 += extraAmortization;
    inst1 += extraAmortization;
    
    newBalance -= amort1;
    newTotalInterest += int1;
    newTotalPaid += inst1;
    
    schedule.push({
      month: 1,
      date: new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()),
      installment: inst1,
      interest: int1,
      amortization: amort1,
      balance: Math.max(0, newBalance)
    });
  
    let balanceAfterExtra = Math.max(0, newBalance);
    let remainingTerm = term - 1;
    let currentPrincipal = balanceAfterExtra;
    let newPmt = basePmt;
    let newAmort = baseAmort;
  
    if (extraAmortization > 0 && balanceAfterExtra > 0) {
      if (amortizationType === 'TERM') {
        if (system === 'SAC') {
          remainingTerm = Math.ceil(balanceAfterExtra / baseAmort);
        } else {
          remainingTerm = Math.ceil(-Math.log(1 - balanceAfterExtra * rate / basePmt) / Math.log(1 + rate));
        }
      } else {
        if (system === 'SAC') {
          newAmort = balanceAfterExtra / remainingTerm;
        } else {
          newPmt = balanceAfterExtra * (rate * Math.pow(1 + rate, remainingTerm)) / (Math.pow(1 + rate, remainingTerm) - 1);
        }
      }
    }
  
    let newInstallmentAfterExtra = 0;
    let actualMonths = 1;
  
    for (let i = 1; i <= remainingTerm; i++) {
      if (newBalance <= 0) break;
      
      let int = newBalance * rate;
      let amort = 0;
      let inst = 0;
  
      if (system === 'SAC') {
        amort = newAmort;
        if (amort > newBalance) amort = newBalance;
        inst = amort + int;
      } else {
        inst = newPmt;
        amort = inst - int;
        if (amort > newBalance) {
          amort = newBalance;
          inst = amort + int;
        }
      }
  
      if (i === 1) newInstallmentAfterExtra = inst;
  
      newBalance -= amort;
      newTotalInterest += int;
      newTotalPaid += inst;
      actualMonths++;
  
      schedule.push({
        month: actualMonths,
        date: new Date(startDate.getFullYear(), startDate.getMonth() + actualMonths, startDate.getDate()),
        installment: inst,
        interest: int,
        amortization: amort,
        balance: Math.max(0, newBalance)
      });
    }
  
    let interestSaved = baseTotalInterest - newTotalInterest;
    let termReduced = term - actualMonths;
    let installmentReduced = 0;
    
    if (extraAmortization > 0) {
      if (system === 'SAC') {
        let baseMonth2Inst = baseAmort + (principal - baseAmort) * rate;
        installmentReduced = baseMonth2Inst - newInstallmentAfterExtra;
      } else {
        installmentReduced = basePmt - newInstallmentAfterExtra;
      }
    }
  
    let insights = "";
    if (extraAmortization > 0) {
      let yearsReduced = (termReduced / 12).toFixed(1);
      let formattedSaved = formatCurrency(interestSaved);
      let formattedExtra = formatCurrency(extraAmortization);
      
      if (amortizationType === 'TERM') {
        insights = `Ao amortizar ${formattedExtra} neste momento, você reduz ${termReduced} meses (aprox. ${yearsReduced} anos) do seu financiamento e economiza aproximadamente ${formattedSaved} em juros. A estratégia de redução de prazo gera a maior economia total possível, antecipando a quitação do seu imóvel.`;
      } else {
        let formattedInstRed = formatCurrency(installmentReduced);
        insights = `Ao amortizar ${formattedExtra} neste momento, você reduz aproximadamente ${formattedInstRed} do valor da sua próxima parcela e economiza ${formattedSaved} em juros ao longo do contrato. A estratégia de redução de parcela é ideal para melhorar seu fluxo de caixa mensal imediato, mantendo o prazo original.`;
      }
    } else {
      insights = `Esta é a simulação base do seu financiamento. Você pagará um total de ${formatCurrency(baseTotalInterest)} em juros ao longo de ${term} meses. Experimente adicionar um valor de amortização extra para ver o impacto na redução da sua dívida!`;
    }
  
    return {
      initialInstallment,
      baseTotalPaid,
      baseTotalInterest,
      balanceAfterExtra,
      interestSaved,
      termReduced,
      installmentReduced,
      newInstallmentAfterExtra,
      schedule,
      insights
    };
  }

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <SectionHeader title="Amortização" subtitle="Simulador Caixa Econômica Federal" />

      <div className="space-y-6">
        {/* Input Form */}
        <PremiumCard className="p-5 space-y-4">
          <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
            <Calculator size={20} className="text-gold-500" />
            Dados do Financiamento
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary flex items-center gap-2 min-h-[2.5rem]">
                <DollarSign size={16} className="text-gold-500" /> Valor do Financiamento (R$)
              </label>
              <input 
                type="number" 
                value={principalStr} 
                onChange={(e) => setPrincipalStr(e.target.value)} 
                className="w-full p-3 bg-surface-50 dark:bg-surface-100 rounded-xl border border-surface-200 dark:border-surface-200 focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent outline-none text-text-primary transition-all"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary flex items-center gap-2 min-h-[2.5rem]">
                <DollarSign size={16} className="text-gold-500" /> Renda do Cliente (R$)
              </label>
              <input 
                type="number" 
                placeholder="Ex: 15000"
                className="w-full p-3 bg-surface-50 dark:bg-surface-100 rounded-xl border border-surface-200 dark:border-surface-200 focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent outline-none text-text-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary flex items-center gap-2 min-h-[2.5rem]">
                <Calendar size={16} className="text-gold-500" /> Data de Início
              </label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="w-full p-3 bg-surface-50 dark:bg-surface-100 rounded-xl border border-surface-200 dark:border-surface-200 focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent outline-none text-text-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary flex items-center gap-2 min-h-[2.5rem]">
                <Clock size={16} className="text-gold-500" /> Quantidade de Parcelas (Máx 420)
              </label>
              <input 
                type="number" 
                max="420"
                value={term} 
                onChange={(e) => setTerm(e.target.value)} 
                className="w-full p-3 bg-surface-50 dark:bg-surface-100 rounded-xl border border-surface-200 dark:border-surface-200 focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent outline-none text-text-primary transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary flex items-center gap-2 min-h-[2.5rem]">
                <Calculator size={16} className="text-gold-500" /> Sistema de Amortização
              </label>
              <select 
                value={system} 
                onChange={(e) => setSystem(e.target.value as 'SAC' | 'PRICE')}
                className="w-full p-3 bg-surface-50 dark:bg-surface-100 rounded-xl border border-surface-200 dark:border-surface-200 focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent outline-none text-text-primary appearance-none transition-all"
              >
                <option value="SAC">SAC (Parcelas Decrescentes)</option>
                <option value="PRICE">PRICE (Parcelas Fixas)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2 min-h-[2.5rem]">
                  <Percent size={16} className="text-gold-500" /> Taxa de Juros (%)
                </label>
                <input 
                  type="number" 
                  step="0.0001"
                  value={rateStr} 
                  onChange={(e) => setRateStr(e.target.value)} 
                  className="w-full p-3 bg-surface-50 dark:bg-surface-100 rounded-xl border border-surface-200 dark:border-surface-200 focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent outline-none text-text-primary transition-all"
                />
              </div>
              <div className="w-1/3 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2 min-h-[2.5rem]">
                  Tipo
                </label>
                <select 
                  value={rateType} 
                  onChange={(e) => setRateType(e.target.value as 'ANUAL' | 'MENSAL')}
                  className="w-full p-3 bg-surface-50 dark:bg-surface-100 rounded-xl border border-surface-200 dark:border-surface-200 focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent outline-none text-text-primary appearance-none transition-all"
                >
                  <option value="ANUAL">Anual</option>
                  <option value="MENSAL">Mensal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-surface-200 pt-6 mt-6">
            <h4 className="font-semibold text-text-primary mb-4 text-sm flex items-center gap-2">
              <TrendingDown size={18} className="text-gold-500" />
              Simulação de Amortização Extra
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2 min-h-[2.5rem]">
                  <DollarSign size={16} className="text-gold-500" /> Valor Extra (R$)
                </label>
                <input 
                  type="number" 
                  value={extraAmortizationStr} 
                  onChange={(e) => setExtraAmortizationStr(e.target.value)} 
                  className="w-full p-3 bg-surface-50 dark:bg-surface-100 rounded-xl border border-surface-200 dark:border-surface-200 focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent outline-none text-text-primary transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2 min-h-[2.5rem]">
                  Tipo de Redução
                </label>
                <select 
                  value={amortizationType} 
                  onChange={(e) => setAmortizationType(e.target.value as 'TERM' | 'INSTALLMENT')}
                  className="w-full p-3 bg-surface-50 dark:bg-surface-100 rounded-xl border border-surface-200 dark:border-surface-200 focus:ring-2 focus:ring-gold-400 dark:focus:ring-gold-600 focus:border-transparent outline-none text-text-primary appearance-none transition-all"
                >
                  <option value="TERM">Redução do Prazo</option>
                  <option value="INSTALLMENT">Redução do Valor da Parcela</option>
                </select>
              </div>
            </div>
          </div>

          <RoundedButton 
            onClick={handleSimulate} 
            className="w-full mt-6 flex items-center justify-center gap-2"
          >
            Simular Amortização <ArrowRight size={20} />
          </RoundedButton>
        </PremiumCard>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Insights Inteligentes */}
              <PremiumCard className="p-5 bg-gradient-to-br from-gold-50 to-white dark:from-gold-900/20 dark:to-surface-100 border-gold-200 dark:border-gold-800/30">
                <h3 className="font-bold text-gold-700 dark:text-gold-400 flex items-center gap-2 mb-3">
                  <CheckCircle2 size={20} />
                  Insights Inteligentes
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {result.insights}
                </p>
              </PremiumCard>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 gap-3">
                <PremiumCard className="p-4 bg-surface-100 dark:bg-surface-200">
                  <p className="text-xs text-text-secondary mb-1">Parcela Inicial Base</p>
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(result.initialInstallment)}</p>
                </PremiumCard>
                <PremiumCard className="p-4 bg-surface-100 dark:bg-surface-200">
                  <p className="text-xs text-text-secondary mb-1">Total de Juros Base</p>
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(result.baseTotalInterest)}</p>
                </PremiumCard>
                
                {parseNumber(extraAmortizationStr) > 0 && (
                  <>
                    <PremiumCard className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30 col-span-2">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Economia Total em Juros</p>
                      <p className="text-2xl font-bold text-green-800 dark:text-green-300">{formatCurrency(result.interestSaved)}</p>
                    </PremiumCard>
                    
                    {amortizationType === 'TERM' ? (
                      <PremiumCard className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 col-span-2">
                        <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Parcelas Eliminadas</p>
                        <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{result.termReduced} meses</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Novo prazo: {result.schedule.length} meses</p>
                      </PremiumCard>
                    ) : (
                      <PremiumCard className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 col-span-2">
                        <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Redução na Parcela</p>
                        <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">-{formatCurrency(result.installmentReduced)}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Nova parcela aprox: {formatCurrency(result.newInstallmentAfterExtra)}</p>
                      </PremiumCard>
                    )}
                  </>
                )}
              </div>

              {/* Detailed Schedule Toggle */}
              <PremiumCard className="overflow-hidden">
                <button 
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="w-full p-4 flex items-center justify-between bg-surface-50 dark:bg-surface-100 hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
                >
                  <div className="flex items-center gap-2 font-semibold text-text-primary">
                    <FileText size={20} className="text-gold-500" />
                    Evolução do Financiamento
                  </div>
                  {showSchedule ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                <AnimatePresence>
                  {showSchedule && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-text-secondary uppercase bg-surface-100 dark:bg-surface-200">
                            <tr>
                              <th className="px-3 py-2 rounded-tl-lg">Mês</th>
                              <th className="px-3 py-2">Data</th>
                              <th className="px-3 py-2">Parcela</th>
                              <th className="px-3 py-2">Juros</th>
                              <th className="px-3 py-2">Amortização</th>
                              <th className="px-3 py-2 rounded-tr-lg">Saldo Devedor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.schedule.slice(0, 120).map((row, idx) => ( // Limit to 120 rows for performance in UI, or paginate
                              <tr key={idx} className="border-b border-surface-100 dark:border-surface-200 last:border-0">
                                <td className="px-3 py-2 font-medium">{row.month}</td>
                                <td className="px-3 py-2">{row.date.toLocaleDateString('pt-BR')}</td>
                                <td className="px-3 py-2 text-red-600 dark:text-red-400">{formatCurrency(row.installment)}</td>
                                <td className="px-3 py-2 text-orange-600 dark:text-orange-400">{formatCurrency(row.interest)}</td>
                                <td className="px-3 py-2 text-green-600 dark:text-green-400">{formatCurrency(row.amortization)}</td>
                                <td className="px-3 py-2 font-medium">{formatCurrency(row.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {result.schedule.length > 120 && (
                          <p className="text-xs text-center text-text-secondary mt-4 italic">
                            Mostrando as primeiras 120 parcelas. O contrato totaliza {result.schedule.length} parcelas.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </PremiumCard>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
