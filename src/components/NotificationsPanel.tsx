import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { X, Bell, CheckCircle, AlertCircle, Info, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Novo Lead',
    message: 'Roberto Silva acabou de se cadastrar.',
    time: '2 min atrás',
    read: false,
    type: 'success',
    link: '/clients/1'
  },
  {
    id: '2',
    title: 'Reunião Agendada',
    message: 'Visita ao Reserva Imperial amanhã às 14h.',
    time: '1 hora atrás',
    read: false,
    type: 'info',
    link: '/schedule'
  },
  {
    id: '3',
    title: 'Documentação Pendente',
    message: 'Ana Paula precisa enviar o comprovante de renda.',
    time: '3 horas atrás',
    read: true,
    type: 'warning',
    link: '/clients/2'
  },
  {
    id: '4',
    title: 'Meta Batida!',
    message: 'Parabéns! Você atingiu sua meta mensal de vendas.',
    time: '1 dia atrás',
    read: true,
    type: 'success',
    link: '/income'
  }
];

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const handleDragEnd = (id: string, info: PanInfo) => {
    if (info.offset.x < -100) { // Swiped left enough
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read logic could go here
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'warning': return <AlertCircle size={18} className="text-amber-500" />;
      case 'error': return <AlertCircle size={18} className="text-red-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-surface-50 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-surface-200 flex justify-between items-center bg-white dark:bg-surface-100">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-gold-500" />
                <h2 className="font-bold text-lg text-text-primary">Notificações</h2>
                <span className="bg-gold-100 text-gold-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={() => setNotifications([])}
                    className="text-xs font-medium text-text-secondary hover:text-red-500 transition-colors mr-2"
                  >
                    Limpar tudo
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-surface-200 rounded-full transition-colors text-text-secondary">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-50">
                  <Bell size={48} className="mb-4" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <AnimatePresence mode='popLayout'>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="relative group"
                    >
                      {/* Background for swipe action */}
                      <div className="absolute inset-0 bg-red-500 rounded-xl flex items-center justify-end pr-4 text-white">
                        <Trash2 size={20} />
                      </div>

                      <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.1} // Allow some resistance
                        onDragEnd={(_, info) => handleDragEnd(notification.id, info)}
                        whileDrag={{ scale: 1.02 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "relative bg-white dark:bg-surface-100 p-4 rounded-xl shadow-sm border border-surface-200 cursor-pointer active:cursor-grabbing touch-pan-y",
                          !notification.read && "border-l-4 border-l-gold-500"
                        )}
                        style={{ x: 0 }} // Reset position on render
                      >
                        <div className="flex gap-3">
                          <div className="mt-1 flex-shrink-0">
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className={cn("text-sm font-semibold text-text-primary truncate pr-2", !notification.read && "text-black dark:text-white")}>
                                {notification.title}
                              </h4>
                              <span className="text-[10px] text-text-secondary whitespace-nowrap flex-shrink-0">
                                {notification.time}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-surface-300 self-center flex-shrink-0" />
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="p-4 border-t border-surface-200 bg-white dark:bg-surface-100 text-center">
              <p className="text-xs text-text-secondary">
                Deslize para a esquerda para excluir
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
