import { useState } from 'react';
import { SectionHeader, PremiumCard, RoundedButton } from '@/components/ui/PremiumComponents';
import { UserCard } from '@/components/admin/UserCard';
import { TeamCard } from '@/components/admin/TeamCard';
import { GoalCard } from '@/components/admin/GoalCard';
import { AnnouncementCard } from '@/components/admin/AnnouncementCard';
import { MOCK_USERS, MOCK_TEAMS, MOCK_GOALS, MOCK_ANNOUNCEMENTS, User, Role, Team, Goal, Announcement, Priority } from '@/data/admin';
import { Users, Shield, Target, Megaphone, BarChart3, Plus, Search, Trophy, Download, FileSpreadsheet, FileText, Trash2, Edit2, X, ChevronDown, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Tab = 'users' | 'teams' | 'goals' | 'announcements' | 'reports';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState(MOCK_USERS);
  const [teams, setTeams] = useState(MOCK_TEAMS);
  const [goals, setGoals] = useState(MOCK_GOALS);
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamFormData, setTeamFormData] = useState<Partial<Team>>({ name: '', managerId: '', directorate: '' });

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalFormData, setGoalFormData] = useState<Partial<Goal>>({ 
    title: '', description: '', target: 0, startDate: '', deadline: '', type: 'Mensal', assigneeType: 'All', points: 0 
  });
  const [isMission, setIsMission] = useState(false);

  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementFormData, setAnnouncementFormData] = useState<Partial<Announcement>>({
    title: '', content: '', priority: 'Normal', startDate: '', endDate: ''
  });

  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Reports State
  const [reportView, setReportView] = useState<'Teams' | 'Brokers'>('Teams');
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({ start: '', end: '' });

  // Users Logic
  const pendingUsers = users.filter(u => u.status === 'Pendente');
  const activeUsers = users.filter(u => u.status === 'Ativo' && u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleApproveUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Ativo' } : u));
  };

  const handleRejectUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleRoleChange = (id: string, role: Role) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  // Teams Logic
  const handleOpenTeamModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setTeamFormData(team);
    } else {
      setEditingTeam(null);
      setTeamFormData({ name: '', managerId: '', directorate: '' });
    }
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = () => {
    if (!teamFormData.name) return;
    
    if (editingTeam) {
      setTeams(prev => prev.map(t => t.id === editingTeam.id ? { ...t, ...teamFormData } as Team : t));
    } else {
      const newTeam: Team = {
        id: Date.now().toString(),
        members: [],
        totalSales: 'R$ 0',
        ...teamFormData as Team
      };
      setTeams(prev => [...prev, newTeam]);
    }
    setIsTeamModalOpen(false);
  };

  const handleDeleteTeam = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta equipe?')) {
      setTeams(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleManageMembers = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsManageMembersModalOpen(true);
  };

  const handleAddMemberToTeam = (userId: string) => {
    if (!selectedTeamId) return;
    setTeams(prev => prev.map(t => {
      if (t.id === selectedTeamId && !t.members.includes(userId)) {
        return { ...t, members: [...t.members, userId] };
      }
      return t;
    }));
    // Also update user's teamId
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, teamId: selectedTeamId } : u));
  };

  const handleRemoveMemberFromTeam = (userId: string) => {
    if (!selectedTeamId) return;
    setTeams(prev => prev.map(t => {
      if (t.id === selectedTeamId) {
        return { ...t, members: t.members.filter(id => id !== userId) };
      }
      return t;
    }));
    // Also update user's teamId
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, teamId: undefined } : u));
  };

  // Goals Logic
  const handleOpenGoalModal = (goal?: Goal, isMissionMode = false) => {
    setIsMission(isMissionMode);
    if (goal) {
      setEditingGoal(goal);
      setGoalFormData(goal);
    } else {
      setEditingGoal(null);
      setGoalFormData({ 
        title: '', description: '', target: 0, startDate: '', deadline: '', 
        type: isMissionMode ? 'Missão' : 'Mensal', assigneeType: 'All', points: isMissionMode ? 100 : 0 
      });
    }
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = () => {
    if (!goalFormData.title) return;

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...goalFormData } as Goal : g));
    } else {
      const newGoal: Goal = {
        id: Date.now().toString(),
        currentProgress: 0,
        ...goalFormData as Goal
      };
      setGoals(prev => [...prev, newGoal]);
    }
    setIsGoalModalOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  };

  // Announcements Logic
  const handleOpenAnnouncementModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setAnnouncementFormData(announcement);
    } else {
      setEditingAnnouncement(null);
      setAnnouncementFormData({ title: '', content: '', priority: 'Normal', startDate: '', endDate: '' });
    }
    setIsAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = () => {
    if (!announcementFormData.title) return;

    if (editingAnnouncement) {
      setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? { ...a, ...announcementFormData } as Announcement : a));
    } else {
      const newAnnouncement: Announcement = {
        id: Date.now().toString(),
        authorId: '1', // Mock current user
        ...announcementFormData as Announcement
      };
      setAnnouncements(prev => [...prev, newAnnouncement]);
    }
    setIsAnnouncementModalOpen(false);
  };
  
  const handleDeleteAnnouncement = (id: string) => {
      if (confirm('Tem certeza que deseja excluir este anúncio?')) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
  }

  // Reports Logic
  const mockReportData = [
    { name: 'Equipe Alpha', sales: 12500000, appointments: 45, missions: 12 },
    { name: 'Equipe Beta', sales: 8200000, appointments: 32, missions: 8 },
    { name: 'Equipe Gamma', sales: 5100000, appointments: 28, missions: 5 },
  ];

  const handleDownloadReport = (format: 'pdf' | 'excel') => {
    alert(`Relatório baixado em ${format.toUpperCase()} para o período: ${reportDateRange.start || 'Início'} até ${reportDateRange.end || 'Fim'}`);
    setIsDownloadMenuOpen(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="space-y-6">
            {pendingUsers.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Solicitações Pendentes ({pendingUsers.length})
                </h3>
                <div className="grid gap-3">
                  {pendingUsers.map(user => (
                    <UserCard 
                      key={user.id} 
                      user={user} 
                      onApprove={handleApproveUser} 
                      onReject={handleRejectUser} 
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-text-secondary uppercase">Usuários Ativos ({activeUsers.length})</h3>
                <div className="relative w-64">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-white dark:bg-surface-100 border border-surface-200 rounded-lg focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>
              <div className="grid gap-3">
                {activeUsers.map(user => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    onRoleChange={handleRoleChange}
                  />
                ))}
                {activeUsers.length === 0 && (
                  <p className="text-center text-text-secondary py-8">Nenhum usuário encontrado.</p>
                )}
              </div>
            </section>
          </div>
        );

      case 'teams':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <RoundedButton size="sm" onClick={() => handleOpenTeamModal()}>
                <Plus size={16} className="mr-1" /> Nova Equipe
              </RoundedButton>
            </div>
            <div className="grid gap-3">
              {teams.map(team => (
                <div key={team.id} className="relative group">
                  <TeamCard team={team} onManage={handleManageMembers} />
                  <div className="absolute top-4 right-12 hidden group-hover:flex gap-2">
                    <button onClick={() => handleOpenTeamModal(team)} className="p-1.5 bg-white rounded-full shadow hover:text-gold-600">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteTeam(team.id)} className="p-1.5 bg-white rounded-full shadow hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <RoundedButton size="sm" variant="outline" onClick={() => handleOpenGoalModal(undefined, true)}>
                <Trophy size={16} className="mr-1" /> Missão
              </RoundedButton>
              <RoundedButton size="sm" onClick={() => handleOpenGoalModal()}>
                <Plus size={16} className="mr-1" /> Nova Meta
              </RoundedButton>
            </div>
            <div className="grid gap-3">
              {goals.map(goal => (
                <div key={goal.id} className="relative group">
                  <GoalCard goal={goal} />
                  <div className="absolute top-4 right-4 hidden group-hover:flex gap-2 z-20">
                    <button onClick={() => handleOpenGoalModal(goal, goal.type === 'Missão')} className="p-1.5 bg-white rounded-full shadow hover:text-gold-600">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 bg-white rounded-full shadow hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'announcements':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <RoundedButton size="sm" onClick={() => handleOpenAnnouncementModal()}>
                <Plus size={16} className="mr-1" /> Novo Anúncio
              </RoundedButton>
            </div>
            <div className="grid gap-3">
              {announcements.map(announcement => (
                <div key={announcement.id} className="relative group">
                  <AnnouncementCard announcement={announcement} onDelete={handleDeleteAnnouncement} />
                  <div className="absolute top-4 right-16 hidden group-hover:flex gap-2">
                    <button onClick={() => handleOpenAnnouncementModal(announcement)} className="p-1.5 bg-white rounded-full shadow hover:text-gold-600">
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 bg-surface-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setReportView('Teams')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${reportView === 'Teams' ? 'bg-white shadow text-text-primary' : 'text-text-secondary'}`}
                  >
                    Equipes
                  </button>
                  <button 
                    onClick={() => setReportView('Brokers')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${reportView === 'Brokers' ? 'bg-white shadow text-text-primary' : 'text-text-secondary'}`}
                  >
                    Corretores
                  </button>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 text-text-secondary text-xs font-medium"
                  >
                    <Download size={14} />
                    Exportar
                    <ChevronDown size={14} />
                  </button>
                  
                  {isDownloadMenuOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-surface-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => handleDownloadReport('pdf')}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-surface-50 flex items-center gap-2 text-red-600"
                      >
                        <FileText size={14} /> PDF
                      </button>
                      <button 
                        onClick={() => handleDownloadReport('excel')}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-surface-50 flex items-center gap-2 text-green-600"
                      >
                        <FileSpreadsheet size={14} /> Excel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-surface-200">
                <Calendar size={14} className="text-text-secondary ml-1" />
                <input 
                  type="date" 
                  value={reportDateRange.start}
                  onChange={(e) => setReportDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="text-xs border-none focus:ring-0 text-text-secondary bg-transparent p-0 w-24"
                />
                <span className="text-text-secondary text-xs">-</span>
                <input 
                  type="date" 
                  value={reportDateRange.end}
                  onChange={(e) => setReportDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="text-xs border-none focus:ring-0 text-text-secondary bg-transparent p-0 w-24"
                />
              </div>
            </div>

            <PremiumCard className="p-4">
              <h4 className="font-bold text-text-primary mb-4">Vendas por {reportView === 'Teams' ? 'Equipe' : 'Corretor'}</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockReportData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="sales" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>

            <div className="grid grid-cols-2 gap-4">
              <PremiumCard className="p-4">
                <h4 className="font-bold text-text-primary mb-4 text-sm">Agendamentos</h4>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockReportData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="appointments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </PremiumCard>
              <PremiumCard className="p-4">
                <h4 className="font-bold text-text-primary mb-4 text-sm">Missões Concluídas</h4>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockReportData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="missions" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </PremiumCard>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <SectionHeader title="Painel Administrativo" subtitle="Governança e Estratégia" />

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
        {[
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'teams', label: 'Equipes', icon: Shield },
          { id: 'goals', label: 'Metas', icon: Target },
          { id: 'announcements', label: 'Anúncios', icon: Megaphone },
          { id: 'reports', label: 'Relatórios', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gold-500 text-white shadow-md shadow-gold-500/20'
                : 'bg-white dark:bg-surface-100 text-text-secondary border border-surface-200'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderTabContent()}
      </div>

      {/* Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title={editingTeam ? "Editar Equipe" : "Nova Equipe"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nome da Equipe</label>
            <input 
              value={teamFormData.name}
              onChange={(e) => setTeamFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Ex: Equipe Alpha"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Líder / Gerente</label>
            <select 
              value={teamFormData.managerId}
              onChange={(e) => setTeamFormData(prev => ({ ...prev, managerId: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            >
              <option value="">Selecione um gerente</option>
              {users.filter(u => u.role === 'Gerente' || u.role === 'Diretor').map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Diretoria</label>
            <input 
              value={teamFormData.directorate}
              onChange={(e) => setTeamFormData(prev => ({ ...prev, directorate: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="Ex: Comercial"
            />
          </div>
          <RoundedButton fullWidth onClick={handleSaveTeam}>Salvar</RoundedButton>
        </div>
      </Modal>

      {/* Manage Members Modal */}
      <Modal isOpen={isManageMembersModalOpen} onClose={() => setIsManageMembersModalOpen(false)} title="Gerenciar Membros">
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {users.filter(u => u.status === 'Ativo').map(user => {
              const team = teams.find(t => t.id === selectedTeamId);
              const isMember = team?.members.includes(user.id);
              
              return (
                <div key={user.id} className="flex justify-between items-center p-2 bg-surface-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-text-secondary">{user.role}</p>
                    </div>
                  </div>
                  {isMember ? (
                    <button onClick={() => handleRemoveMemberFromTeam(user.id)} className="text-red-500 text-xs font-medium hover:underline">Remover</button>
                  ) : (
                    <button onClick={() => handleAddMemberToTeam(user.id)} className="text-green-600 text-xs font-medium hover:underline">Adicionar</button>
                  )}
                </div>
              );
            })}
          </div>
          <RoundedButton fullWidth onClick={() => setIsManageMembersModalOpen(false)}>Concluir</RoundedButton>
        </div>
      </Modal>

      {/* Goal/Mission Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={editingGoal ? (isMission ? "Editar Missão" : "Editar Meta") : (isMission ? "Nova Missão" : "Nova Meta")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Título</label>
            <input 
              value={goalFormData.title}
              onChange={(e) => setGoalFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
            <textarea 
              value={goalFormData.description}
              onChange={(e) => setGoalFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary h-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{isMission ? 'Pontos' : 'Alvo (Valor)'}</label>
              <input 
                type="number"
                value={isMission ? goalFormData.points : goalFormData.target}
                onChange={(e) => setGoalFormData(prev => ({ ...prev, [isMission ? 'points' : 'target']: Number(e.target.value) }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
              <select 
                value={goalFormData.type}
                onChange={(e) => setGoalFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              >
                {isMission ? (
                  <option value="Missão">Missão</option>
                ) : (
                  <>
                    <option value="Mensal">Mensal</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Personalizada">Personalizada</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Início</label>
              <input 
                type="date"
                value={goalFormData.startDate}
                onChange={(e) => setGoalFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Fim</label>
              <input 
                type="date"
                value={goalFormData.deadline}
                onChange={(e) => setGoalFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Atribuir a</label>
            <select 
              value={goalFormData.assigneeType}
              onChange={(e) => setGoalFormData(prev => ({ ...prev, assigneeType: e.target.value as any }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            >
              <option value="All">Todos</option>
              <option value="Team">Equipe Específica</option>
              <option value="User">Usuário Específico</option>
            </select>
          </div>
          {goalFormData.assigneeType === 'Team' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Selecione a Equipe</label>
              <select 
                value={goalFormData.assigneeId}
                onChange={(e) => setGoalFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              >
                <option value="">Selecione...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          {goalFormData.assigneeType === 'User' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Selecione o Usuário</label>
              <select 
                value={goalFormData.assigneeId}
                onChange={(e) => setGoalFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              >
                <option value="">Selecione...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <RoundedButton fullWidth onClick={handleSaveGoal}>Salvar</RoundedButton>
        </div>
      </Modal>

      {/* Announcement Modal */}
      <Modal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} title={editingAnnouncement ? "Editar Anúncio" : "Novo Anúncio"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Título</label>
            <input 
              value={announcementFormData.title}
              onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Conteúdo</label>
            <textarea 
              value={announcementFormData.content}
              onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary h-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Prioridade</label>
            <select 
              value={announcementFormData.priority}
              onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, priority: e.target.value as Priority }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            >
              <option value="Normal">Normal</option>
              <option value="Importante">Importante</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Início</label>
              <input 
                type="date"
                value={announcementFormData.startDate}
                onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Fim</label>
              <input 
                type="date"
                value={announcementFormData.endDate}
                onChange={(e) => setAnnouncementFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
            </div>
          </div>
          <RoundedButton fullWidth onClick={handleSaveAnnouncement}>Salvar</RoundedButton>
        </div>
      </Modal>
    </div>
  );
}
