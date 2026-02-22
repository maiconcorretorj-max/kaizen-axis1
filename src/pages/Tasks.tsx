import { useState } from 'react';
import { PremiumCard, StatusBadge, SectionHeader, RoundedButton } from '@/components/ui/PremiumComponents';
import { CheckCircle2, Calendar, User, Plus, Edit2, Trash2, X, Clock } from 'lucide-react';
import { FAB } from '@/components/Layout';
import { Modal } from '@/components/ui/Modal';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  responsible: string;
  deadline: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluída';
  description?: string;
  subtasks: Subtask[];
}

const INITIAL_TASKS: Task[] = [
  { 
    id: '1', 
    title: 'Enviar contrato para assinatura', 
    responsible: 'Eu', 
    deadline: 'Hoje', 
    status: 'Pendente',
    subtasks: [
      { id: 's1', title: 'Revisar cláusulas', completed: true },
      { id: 's2', title: 'Gerar PDF', completed: false }
    ]
  },
  { 
    id: '2', 
    title: 'Confirmar visita com cliente', 
    responsible: 'Eu', 
    deadline: 'Amanhã', 
    status: 'Em Andamento',
    subtasks: []
  },
  { 
    id: '3', 
    title: 'Atualizar cadastro no sistema', 
    responsible: 'Secretaria', 
    deadline: '22 Fev', 
    status: 'Concluída',
    subtasks: []
  },
  { 
    id: '4', 
    title: 'Reunião de equipe', 
    responsible: 'Gerente', 
    deadline: '23 Fev', 
    status: 'Pendente',
    subtasks: []
  },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState('Todos');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    responsible: '',
    deadline: '',
    status: 'Pendente',
    description: '',
    subtasks: []
  });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData(JSON.parse(JSON.stringify(task))); // Deep copy to avoid mutating state directly
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        responsible: 'Eu',
        deadline: '',
        status: 'Pendente',
        description: '',
        subtasks: []
      });
    }
    setNewSubtaskTitle('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.deadline) return;

    if (editingTask) {
      setTasks(prev => prev.map(t => 
        t.id === editingTask.id ? { ...t, ...formData } as Task : t
      ));
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        ...formData as Task,
        subtasks: formData.subtasks || []
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleComplete = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'Concluída' ? 'Pendente' : 'Concluída' };
      }
      return t;
    }));
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle,
      completed: false
    };
    setFormData(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask]
    }));
    setNewSubtaskTitle('');
  };

  const removeSubtask = (subtaskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).filter(s => s.id !== subtaskId)
    }));
  };

  const toggleSubtask = (subtaskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).map(s => 
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      )
    }));
  };

  const toggleSubtaskCompletion = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => 
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          )
        };
      }
      return t;
    }));
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'Todos') return true;
    return t.status === filter;
  });

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <div className="flex justify-between items-start mb-4">
        <SectionHeader title="Tarefas" subtitle="Gestão de atividades" />
        <RoundedButton size="sm" onClick={() => handleOpenModal()} className="flex items-center gap-1 mt-2">
          <Plus size={16} /> Nova
        </RoundedButton>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
        {['Todos', 'Pendente', 'Em Andamento', 'Concluída'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === status 
                ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md' 
                : 'bg-card-bg text-text-secondary border border-surface-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <p>Nenhuma tarefa encontrada.</p>
            <RoundedButton variant="outline" size="sm" className="mt-4 mx-auto" onClick={() => handleOpenModal()}>
              Criar Tarefa
            </RoundedButton>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <PremiumCard key={task.id} className={`flex flex-col gap-3 p-4 transition-all ${task.status === 'Concluída' ? 'opacity-70 bg-surface-50' : ''}`}>
              <div className="flex items-start gap-3">
                <button 
                  onClick={() => toggleComplete(task.id)}
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    task.status === 'Concluída' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-surface-300 text-transparent hover:border-gold-400'
                  }`}
                >
                  <CheckCircle2 size={12} strokeWidth={3} />
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`font-medium text-text-primary truncate ${task.status === 'Concluída' ? 'line-through text-text-secondary' : ''}`}>
                      {task.title}
                    </h4>
                    <StatusBadge status={task.status} className="text-[10px] px-2 py-0.5 flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <User size={12} /> {task.responsible}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      task.deadline === 'Hoje' ? 'text-red-500' : 'text-text-secondary'
                    }`}>
                      <Calendar size={12} /> {task.deadline}
                    </div>
                  </div>

                  {/* Subtasks Summary & List */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gold-500 rounded-full transition-all duration-500"
                            style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-secondary font-medium whitespace-nowrap">
                          {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                        </span>
                      </div>
                      
                      <div className="space-y-1 pl-1">
                        {task.subtasks.map(subtask => (
                          <button 
                            key={subtask.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubtaskCompletion(task.id, subtask.id);
                            }}
                            className="flex items-center gap-2 w-full text-left group"
                          >
                            <div className={`w-2 h-2 rounded-full border flex-shrink-0 transition-colors ${subtask.completed ? 'bg-gold-500 border-gold-500' : 'border-surface-300 group-hover:border-gold-400'}`} />
                            <span className={`text-xs truncate transition-colors ${subtask.completed ? 'text-text-secondary line-through' : 'text-text-primary group-hover:text-gold-600'}`}>
                              {subtask.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-surface-100">
                <button 
                  onClick={() => handleOpenModal(task)}
                  className="text-xs font-medium text-text-secondary hover:text-gold-600 flex items-center gap-1"
                >
                  <Edit2 size={12} /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(task.id)}
                  className="text-xs font-medium text-text-secondary hover:text-red-500 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Excluir
                </button>
              </div>
            </PremiumCard>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Título</label>
            <input 
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Ex: Enviar contrato"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Responsável</label>
            <input 
              value={formData.responsible}
              onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Nome do responsável"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Prazo</label>
            <input 
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Ex: Hoje, Amanhã, 25 Fev"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {['Pendente', 'Em Andamento', 'Concluída'].map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: status as any }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    formData.status === status 
                      ? 'bg-gold-50 border-gold-400 text-gold-700 dark:bg-gold-900/20 dark:text-gold-400' 
                      : 'bg-surface-50 border-surface-200 text-text-secondary'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Subtarefas</label>
            <div className="space-y-2 mb-2">
              {formData.subtasks?.map(subtask => (
                <div key={subtask.id} className="flex items-center gap-2 bg-surface-50 p-2 rounded-lg">
                  <button 
                    type="button"
                    onClick={() => toggleSubtask(subtask.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      subtask.completed 
                        ? 'bg-gold-500 border-gold-500 text-white' 
                        : 'border-surface-300 text-text-secondary'
                    }`}
                  >
                    {subtask.completed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  </button>
                  <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                    {subtask.title}
                  </span>
                  <button 
                    type="button"
                    onClick={() => removeSubtask(subtask.id)} 
                    className="text-text-secondary hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                className="flex-1 p-2 bg-surface-50 rounded-lg border-none text-sm text-text-primary focus:ring-2 focus:ring-gold-200"
                placeholder="Nova subtarefa..."
              />
              <button 
                type="button"
                onClick={addSubtask}
                className="p-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Descrição (Opcional)</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary min-h-[80px]"
              placeholder="Detalhes da tarefa..."
            />
          </div>

          <RoundedButton fullWidth onClick={handleSave} className="mt-4">
            {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
          </RoundedButton>
        </div>
      </Modal>
    </div>
  );
}
