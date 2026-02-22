import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calculator, CheckCircle2, ChevronRight } from 'lucide-react';
import { RoundedButton } from '@/components/ui/PremiumComponents';

const steps = [
  {
    id: 1,
    title: "Gestão Premium",
    description: "Controle total da sua carteira de clientes e agendamentos em um só lugar.",
    icon: LayoutDashboard,
    image: "https://picsum.photos/seed/dash/400/600"
  },
  {
    id: 2,
    title: "Análise de Crédito",
    description: "Apuração de renda determinística e instantânea via leitura de extratos.",
    icon: Calculator,
    image: "https://picsum.photos/seed/calc/400/600"
  },
  {
    id: 3,
    title: "Organização Total",
    description: "Funil de vendas visual e kanban de clientes para nunca perder um negócio.",
    icon: Users,
    image: "https://picsum.photos/seed/org/400/600"
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    navigate('/');
  };

  return (
    <div className="relative h-screen w-full bg-surface-50 overflow-hidden flex flex-col">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentStep}
            src={steps[currentStep].image}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full h-[65%] object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-surface-50 h-[70%]" />
        <div className="absolute top-[60%] left-0 right-0 h-[40%] bg-surface-50" />
        <div className="absolute top-[50%] left-0 right-0 h-[20%] bg-gradient-to-b from-transparent to-surface-50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end pb-10 px-6">
        <div className="bg-card-bg/80 backdrop-blur-md border border-surface-200 p-8 rounded-3xl shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gold-100 dark:bg-gold-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gold-600 dark:text-gold-400 shadow-sm">
                {(() => {
                  const Icon = steps[currentStep].icon;
                  return <Icon size={32} />;
                })()}
              </div>
              
              <h2 className="text-2xl font-bold text-text-primary mb-3">
                {steps[currentStep].title}
              </h2>
              
              <p className="text-text-secondary leading-relaxed mb-8">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-8 bg-gold-500' : 'w-2 bg-surface-300'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <RoundedButton fullWidth onClick={handleNext} className="shadow-lg shadow-gold-400/20">
              {currentStep === steps.length - 1 ? (
                <span className="flex items-center gap-2">Começar Agora <CheckCircle2 size={18} /></span>
              ) : (
                <span className="flex items-center gap-2">Próximo <ChevronRight size={18} /></span>
              )}
            </RoundedButton>
            
            {currentStep < steps.length - 1 && (
              <button 
                onClick={completeOnboarding}
                className="w-full py-3 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Pular introdução
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
