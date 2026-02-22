import { useState, useEffect } from 'react';
import { PremiumCard, SectionHeader, RoundedButton } from '@/components/ui/PremiumComponents';
import { Calendar as CalendarIcon, MapPin, Clock, CheckCircle2, Trash2, Edit2, Plus, X, ArrowLeft } from 'lucide-react';
import { FAB } from '@/components/Layout';
import { Modal } from '@/components/ui/Modal';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocation, useNavigate } from 'react-router-dom';

interface Appointment {
  id: string;
  title: string;
  client: string;
  time: string;
  date: string; // YYYY-MM-DD
  location: string;
  completed: boolean;
  type: 'Visita' | 'Reunião' | 'Assinatura' | 'Outro';
}

// Mock initial data based on "Today" being 2026-02-20
const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: '1', title: 'Visita ao Decorado', client: 'Roberto Silva', time: '14:00', date: '2026-02-20', location: 'Reserva do Bosque', completed: false, type: 'Visita' },
  { id: '2', title: 'Assinatura de Contrato', client: 'Ana Paula', time: '16:30', date: '2026-02-20', location: 'Escritório Central', completed: false, type: 'Assinatura' },
  { id: '3', title: 'Reunião de Alinhamento', client: 'Construtora XYZ', time: '09:00', date: '2026-02-21', location: 'Online', completed: false, type: 'Reunião' },
  { id: '4', title: 'Apresentação', client: 'Marcos Oliveira', time: '11:00', date: '2026-02-21', location: 'Grand Tower', completed: false, type: 'Visita' },
];

export default function Schedule() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use 2026-02-20 as "Today" for this demo
  const TODAY = new Date(2026, 1, 20); 
  const [selectedDate, setSelectedDate] = useState<Date>(TODAY);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  
  // View State
  const [viewMode, setViewMode] = useState<'day' | 'all' | 'single'>('day');
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (location.state) {
      if (location.state.showAll) {
        setViewMode('all');
      } else if (location.state.highlightId) {
        setViewMode('single');
        setHighlightId(String(location.state.highlightId));
      }
    }
  }, [location.state]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Partial<Appointment>>({
    title: '',
    client: '',
    time: '',
    location: '',
    type: 'Visita'
  });

  // Generate calendar strip (current week)
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
  const calendarDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const filteredAppointments = appointments.filter(apt => {
    if (viewMode === 'all') return true;
    if (viewMode === 'single') return apt.id === highlightId;
    return apt.date === format(selectedDate, 'yyyy-MM-dd');
  });

  const handleOpenModal = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData(appointment);
    } else {
      setEditingAppointment(null);
      setFormData({
        title: '',
        client: '',
        time: '09:00',
        location: '',
        type: 'Visita',
        date: format(selectedDate, 'yyyy-MM-dd')
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.client || !formData.time) return;

    if (editingAppointment) {
      setAppointments(prev => prev.map(apt => 
        apt.id === editingAppointment.id ? { ...apt, ...formData } as Appointment : apt
      ));
    } else {
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        completed: false,
        ...formData as Appointment
      };
      setAppointments(prev => [...prev, newAppointment]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      setAppointments(prev => prev.filter(apt => apt.id !== id));
      if (viewMode === 'single') {
        setViewMode('day');
        setHighlightId(null);
      }
    }
  };

  const toggleComplete = (id: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, completed: !apt.completed } : apt
    ));
  };

  const resetView = () => {
    setViewMode('day');
    setHighlightId(null);
    navigate(location.pathname, { replace: true, state: {} });
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <div className="flex items-center gap-2 mb-4">
        {viewMode !== 'day' && (
          <button onClick={resetView} className="p-2 rounded-full hover:bg-surface-100">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
        )}
        <div className="flex-1">
          <SectionHeader 
            title={viewMode === 'all' ? 'Todos os Agendamentos' : viewMode === 'single' ? 'Detalhes do Agendamento' : 'Agenda'} 
            subtitle={viewMode === 'day' ? 'Seus compromissos' : ''} 
          />
        </div>
        {viewMode === 'day' && (
          <RoundedButton size="sm" onClick={() => handleOpenModal()} className="flex items-center gap-1">
            <Plus size={16} /> Novo
          </RoundedButton>
        )}
      </div>

      {/* Calendar Strip - Only show in day mode */}
      {viewMode === 'day' && (
        <div className="flex justify-between mb-8 overflow-x-auto no-scrollbar pb-2 gap-2">
          {calendarDays.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, TODAY);
            
            return (
              <button
                key={date.toString()}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center min-w-[3rem] h-16 rounded-2xl transition-all ${
                  isSelected 
                    ? 'bg-gold-400 text-white shadow-lg shadow-gold-400/30 scale-105' 
                    : 'bg-card-bg text-text-secondary border border-surface-200'
                }`}
              >
                <span className="text-[10px] font-medium uppercase">{format(date, 'EEE', { locale: ptBR })}</span>
                <span className="text-lg font-bold">{format(date, 'd')}</span>
                {isToday && !isSelected && <div className="w-1 h-1 bg-gold-400 rounded-full mt-1" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-6">
        <div>
          {viewMode === 'day' && (
            <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider flex justify-between items-center">
              {isSameDay(selectedDate, TODAY) ? 'Hoje' : format(selectedDate, "EEEE", { locale: ptBR })}
              <span className="text-text-secondary/70 font-normal">{format(selectedDate, "d 'de' MMMM", { locale: ptBR })}</span>
            </h3>
          )}
          
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-10 text-text-secondary">
                <p>Nenhum agendamento encontrado.</p>
                {viewMode === 'day' && (
                  <RoundedButton variant="outline" size="sm" className="mt-4 mx-auto" onClick={() => handleOpenModal()}>
                    Agendar Compromisso
                  </RoundedButton>
                )}
              </div>
            ) : (
              filteredAppointments.map((event) => (
                <PremiumCard key={event.id} className={`flex gap-4 p-4 transition-all ${event.completed ? 'opacity-60 bg-surface-50' : ''}`}>
                  <div className="flex flex-col items-center pt-1">
                    <span className={`text-sm font-bold ${event.completed ? 'text-text-secondary' : 'text-text-primary'}`}>
                      {event.time}
                    </span>
                    <div className={`h-full w-0.5 mt-2 rounded-full ${event.completed ? 'bg-surface-200' : 'bg-gold-200'}`}></div>
                  </div>
                  
                  <div className="flex-1 pb-2 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-bold truncate ${event.completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                          {event.title}
                        </h4>
                        <p className="text-sm text-gold-600 dark:text-gold-400 font-medium mb-1 truncate">{event.client}</p>
                      </div>
                      <button 
                        onClick={() => toggleComplete(event.id)}
                        className={`p-1 rounded-full transition-colors ${
                          event.completed ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-surface-300 hover:text-gold-500'
                        }`}
                      >
                        <CheckCircle2 size={20} fill={event.completed ? "currentColor" : "none"} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-text-secondary mt-2">
                      <MapPin size={12} /> {event.location}
                    </div>
                    
                    {viewMode === 'all' && (
                       <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                         <CalendarIcon size={12} /> {format(parseISO(event.date), "d 'de' MMMM", { locale: ptBR })}
                       </div>
                    )}

                    <div className="flex gap-3 mt-3 pt-3 border-t border-surface-100">
                      <button 
                        onClick={() => handleOpenModal(event)}
                        className="text-xs font-medium text-text-secondary hover:text-gold-600 flex items-center gap-1"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(event.id)}
                        className="text-xs font-medium text-text-secondary hover:text-red-500 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                </PremiumCard>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Título</label>
            <input 
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Ex: Visita ao Decorado"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Cliente</label>
            <input 
              value={formData.client}
              onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Nome do cliente"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Data</label>
              <input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Hora</label>
              <input 
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Local</label>
            <input 
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Endereço ou local"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {['Visita', 'Reunião', 'Assinatura', 'Outro'].map(type => (
                <button
                  key={type}
                  onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    formData.type === type 
                      ? 'bg-gold-50 border-gold-400 text-gold-700 dark:bg-gold-900/20 dark:text-gold-400' 
                      : 'bg-surface-50 border-surface-200 text-text-secondary'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <RoundedButton fullWidth onClick={handleSave} className="mt-4">
            {editingAppointment ? 'Salvar Alterações' : 'Criar Agendamento'}
          </RoundedButton>
        </div>
      </Modal>
    </div>
  );
}
