import { useState, useEffect } from 'react';
import { SectionHeader, PremiumCard, RoundedButton } from '@/components/ui/PremiumComponents';
import { Users, Shield, Target, Megaphone, BarChart3, Plus, Search, Trophy, Download, FileSpreadsheet, FileText, Trash2, Edit2, ChevronDown, Calendar, Loader2, Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useApp, Team, Goal, Announcement, Directorate } from '@/context/AppContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = 'users' | 'teams' | 'goals' | 'announcements' | 'reports' | 'directorates';

export default function AdminPanel() {
  // ── Hard role guard: only ADMIN can access this page ────────────────────────
  const { isAdmin } = useAuthorization();
  if (!isAdmin) return <Navigate to="/" replace />;

  const {
    allProfiles, updateProfile, refreshProfiles,
    teams, addTeam, updateTeam, deleteTeam,
    goals, addGoal, updateGoal, deleteGoal,
    announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement,
    directorates, addDirectorate, updateDirectorate, deleteDirectorate,
    clients, appointments,
    loading, user
  } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [searchTerm, setSearchTerm] = useState('');

  // Team modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState<Partial<Team>>({ name: '', directorate: '' });
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  // Goal modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isMission, setIsMission] = useState(false);
  const [goalForm, setGoalForm] = useState<Partial<Goal>>({ title: '', description: '', target: 0, start_date: '', deadline: '', type: 'Mensal', assignee_type: 'All', points: 0 });
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Announcement modal
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState<Partial<Announcement>>({ title: '', content: '', priority: 'Normal', start_date: '', end_date: '' });
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // Manage members
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Directorate modal
  const [isDirModalOpen, setIsDirModalOpen] = useState(false);
  const [editingDir, setEditingDir] = useState<Directorate | null>(null);
  const [dirForm, setDirForm] = useState<Partial<Directorate>>({ name: '', description: '' });
  const [isSavingDir, setIsSavingDir] = useState(false);

  // Reports
  const [reportView, setReportView] = useState<'Teams' | 'Brokers'>('Teams');
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({ start: '', end: '' });

  // Approval Modal
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedPendingUserId, setSelectedPendingUserId] = useState<string | null>(null);
  const [approvalForm, setApprovalForm] = useState({ role: 'CORRETOR', directorate_id: '', team_id: '' });
  const [isSavingApproval, setIsSavingApproval] = useState(false);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const pendingUsers = allProfiles.filter(p => p.status === 'pending' || p.status === 'Pendente');
  const activeUsers = allProfiles.filter(p => (p.status === 'active' || p.status === 'Ativo') && p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  // ── Users Actions ──────────────────────────────────────────────────────────
  const handleRoleChange = async (id: string, role: string) => {
    await updateProfile(id, { role });
  };
  const handleDirectorateChange = async (id: string, directorate_id: string | null) => {
    await updateProfile(id, { directorate_id: directorate_id || null });
  };
  const handleManagerChange = async (id: string, manager_id: string | null) => {
    await updateProfile(id, { manager_id: manager_id || null });
  };

  // ── Approval Flow ──────────────────────────────────────────────────────────
  const handleOpenApprovalModal = (userId: string) => {
    setSelectedPendingUserId(userId);
    setApprovalForm({ role: 'CORRETOR', directorate_id: '', team_id: '' });
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedPendingUserId) return;
    setIsSavingApproval(true);
    try {
      const selectedTeam = teams.find(t => t.id === approvalForm.team_id);

      const updateData: any = {
        role: approvalForm.role,
        status: 'Ativo',
        directorate_id: approvalForm.directorate_id || null,
        team: approvalForm.team_id || undefined,
        manager_id: null
      };

      // Se escolheu uma equipe, a diretoria e o gestor herdaram dessa equipe
      if (selectedTeam) {
        updateData.directorate_id = selectedTeam.directorate_id || null;
        updateData.manager_id = selectedTeam.manager_id || null;

        // Adiciona o usuário na array `members` da equipe selecionada
        const currentMembers = selectedTeam.members || [];
        if (!currentMembers.includes(selectedPendingUserId)) {
          await updateTeam(selectedTeam.id, { members: [...currentMembers, selectedPendingUserId] });
        }
      }

      await updateProfile(selectedPendingUserId, updateData);
      setIsApprovalModalOpen(false);
      setSelectedPendingUserId(null);
    } catch (e) {
      console.error('Erro ao aprovar usuário:', e);
    } finally {
      setIsSavingApproval(false);
    }
  };

  const handleRejectUser = async (id: string) => {
    if (confirm('Rejeitar este usuário?')) {
      await updateProfile(id, { status: 'rejected' });
    }
  };

  // ── Team Actions ───────────────────────────────────────────────────────────
  const openTeamModal = (team?: Team) => {
    if (team) { setEditingTeam(team); setTeamForm({ ...team }); }
    else { setEditingTeam(null); setTeamForm({ name: '', directorate_id: '', manager_id: '' }); }
    setIsTeamModalOpen(true);
  };
  const handleSaveTeam = async () => {
    if (!teamForm.name) return;
    setIsSavingTeam(true);
    try {
      if (editingTeam) await updateTeam(editingTeam.id, teamForm);
      else await addTeam({ ...teamForm, members: [] } as Omit<Team, 'id'>);
      setIsTeamModalOpen(false);
    } finally { setIsSavingTeam(false); }
  };

  const handleToggleMember = async (teamId: string, userId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    const members = team.members || [];
    const isAdding = !members.includes(userId);
    const newMembers = isAdding ? [...members, userId] : members.filter(id => id !== userId);

    await updateTeam(teamId, { members: newMembers });
    await updateProfile(userId, {
      team: isAdding ? teamId : undefined,
      directorate_id: isAdding ? (team.directorate_id || null) : undefined,
      manager_id: isAdding ? (team.manager_id || null) : undefined
    });
  };

  // ── Goal Actions ───────────────────────────────────────────────────────────
  const openGoalModal = (goal?: Goal, missionMode = false) => {
    setIsMission(missionMode);
    if (goal) { setEditingGoal(goal); setGoalForm({ ...goal }); }
    else { setEditingGoal(null); setGoalForm({ title: '', description: '', target: 0, start_date: '', deadline: '', type: missionMode ? 'Missão' : 'Mensal', assignee_type: 'All', points: missionMode ? 100 : 0 }); }
    setIsGoalModalOpen(true);
  };
  const handleSaveGoal = async () => {
    if (!goalForm.title) return;
    setIsSavingGoal(true);
    try {
      if (editingGoal) await updateGoal(editingGoal.id, goalForm);
      else await addGoal({ ...goalForm, current_progress: 0 } as Omit<Goal, 'id'>);
      setIsGoalModalOpen(false);
    } finally { setIsSavingGoal(false); }
  };

  // ── Announcement Actions ───────────────────────────────────────────────────
  const openAnnouncementModal = (ann?: Announcement) => {
    if (ann) { setEditingAnnouncement(ann); setAnnouncementForm({ ...ann }); }
    else { setEditingAnnouncement(null); setAnnouncementForm({ title: '', content: '', priority: 'Normal', start_date: '', end_date: '' }); }
    setIsAnnouncementModalOpen(true);
  };
  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title) return;
    setIsSavingAnnouncement(true);
    try {
      if (editingAnnouncement) await updateAnnouncement(editingAnnouncement.id, announcementForm);
      else await addAnnouncement({ ...announcementForm, author_id: user?.id } as Omit<Announcement, 'id' | 'created_at'>);
      setIsAnnouncementModalOpen(false);
    } finally { setIsSavingAnnouncement(false); }
  };

  // ── Reports data ───────────────────────────────────────────────────────────
  const stageData = ['Em Análise', 'Aprovados', 'Condicionados', 'Reprovados', 'Em Tratativa', 'Vendas Concluidas'].map(stage => ({
    name: stage.length > 10 ? stage.substring(0, 10) + '…' : stage,
    total: clients.filter(c => c.stage === stage).length
  }));

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
                  {pendingUsers.map(u => (
                    <PremiumCard key={u.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center text-gold-700 dark:text-gold-400 font-bold text-sm">{(u.name || '?').charAt(0)}</div>
                        <div><p className="font-semibold text-text-primary">{u.name}</p><p className="text-xs text-text-secondary">{u.role}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <RoundedButton size="sm" onClick={() => handleOpenApprovalModal(u.id)} className="bg-green-500 hover:bg-green-600 text-white border-0 text-xs">Aprovar</RoundedButton>
                        <RoundedButton size="sm" variant="outline" onClick={() => handleRejectUser(u.id)} className="text-red-500 border-red-300 text-xs">Rejeitar</RoundedButton>
                      </div>
                    </PremiumCard>
                  ))}
                </div>
              </section>
            )}
            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-text-secondary uppercase">Usuários Ativos ({activeUsers.length})</h3>
                <div className="relative w-56">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-white dark:bg-surface-100 border border-surface-200 rounded-lg focus:outline-none focus:border-gold-400" />
                </div>
              </div>
              <div className="grid gap-3">
                {loading ? <Loader2 size={24} className="animate-spin mx-auto text-gold-400 py-4" /> :
                  activeUsers.map(u => (
                    <PremiumCard key={u.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center text-text-primary font-bold text-sm">{(u.name || '?').charAt(0)}</div>
                        <div><p className="font-semibold text-text-primary">{u.name}</p><p className="text-xs text-text-secondary">{u.role}</p></div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                          className="text-xs bg-surface-50 border border-surface-200 rounded-lg p-1 focus:outline-none focus:border-gold-400">
                          {['CORRETOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select value={(u as any).directorate_id ?? ''} onChange={e => handleDirectorateChange(u.id, e.target.value || null)}
                          className="text-xs bg-surface-50 border border-surface-200 rounded-lg p-1 focus:outline-none focus:border-gold-400">
                          <option value="">Sem Diretoria</option>
                          {directorates.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={(u as any).manager_id ?? ''} onChange={e => handleManagerChange(u.id, e.target.value || null)}
                          className="text-xs bg-surface-50 border border-surface-200 rounded-lg p-1 focus:outline-none focus:border-gold-400">
                          <option value="">Sem Gestor</option>
                          {allProfiles.filter(p => p.id !== u.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </PremiumCard>
                  ))}
              </div>
            </section>
          </div>
        );

      case 'teams':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <RoundedButton size="sm" onClick={() => openTeamModal()}><Plus size={16} className="mr-1" /> Nova Equipe</RoundedButton>
            </div>
            {loading ? <Loader2 size={24} className="animate-spin mx-auto text-gold-400 py-4" /> :
              teams.length === 0 ? <p className="text-center text-text-secondary py-8">Nenhuma equipe cadastrada.</p> :
                teams.map(team => {
                  const dirName = directorates.find(d => d.id === team.directorate_id)?.name;
                  const mgrName = allProfiles.find(p => p.id === team.manager_id)?.name;
                  return (
                    <PremiumCard key={team.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-text-primary">{team.name}</h4>
                          <div className="flex flex-col gap-0.5 mt-1">
                            {dirName && <p className="text-xs text-text-secondary">🏢 {dirName}</p>}
                            {mgrName && <p className="text-xs text-text-secondary">👤 Gestor: {mgrName}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 items-start">
                          <button onClick={() => openTeamModal(team)} className="p-1.5 bg-surface-50 rounded-full hover:text-gold-600"><Edit2 size={14} /></button>
                          <button onClick={() => { setSelectedTeamId(team.id); setIsMembersModalOpen(true); }} className="p-1.5 bg-surface-50 rounded-full hover:text-blue-600"><Users size={14} /></button>
                          <button onClick={() => { if (confirm('Excluir equipe?')) deleteTeam(team.id); }} className="p-1.5 bg-surface-50 rounded-full hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary">{(team.members || []).length} membros</p>
                    </PremiumCard>
                  );
                })}
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <RoundedButton size="sm" variant="outline" onClick={() => openGoalModal(undefined, true)}><Trophy size={16} className="mr-1" /> Missão</RoundedButton>
              <RoundedButton size="sm" onClick={() => openGoalModal()}><Plus size={16} className="mr-1" /> Nova Meta</RoundedButton>
            </div>
            {loading ? <Loader2 size={24} className="animate-spin mx-auto text-gold-400 py-4" /> :
              goals.length === 0 ? <p className="text-center text-text-secondary py-8">Nenhuma meta cadastrada.</p> :
                goals.map(goal => {
                  const progress = goal.target ? ((goal.current_progress || 0) / goal.target) * 100 : 0;
                  return (
                    <PremiumCard key={goal.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {goal.type === 'Missão' && <Trophy size={14} className="text-gold-500 flex-shrink-0" />}
                            <h4 className="font-bold text-text-primary truncate">{goal.title}</h4>
                          </div>
                          {goal.description && <p className="text-xs text-text-secondary mt-1">{goal.description}</p>}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-text-secondary mb-1">
                              <span>Progresso</span><span>{goal.current_progress || 0} / {goal.target || 0}</span>
                            </div>
                            <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gold-500 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-3 flex-shrink-0">
                          <button onClick={() => openGoalModal(goal, goal.type === 'Missão')} className="p-1.5 bg-surface-50 rounded-full hover:text-gold-600"><Edit2 size={14} /></button>
                          <button onClick={() => { if (confirm('Excluir meta?')) deleteGoal(goal.id); }} className="p-1.5 bg-surface-50 rounded-full hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </PremiumCard>
                  );
                })}
          </div>
        );

      case 'announcements':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <RoundedButton size="sm" onClick={() => openAnnouncementModal()}><Plus size={16} className="mr-1" /> Novo Anúncio</RoundedButton>
            </div>
            {loading ? <Loader2 size={24} className="animate-spin mx-auto text-gold-400 py-4" /> :
              announcements.length === 0 ? <p className="text-center text-text-secondary py-8">Nenhum anúncio cadastrado.</p> :
                announcements.map(ann => {
                  const priorityColors: Record<string, string> = { Urgente: 'text-red-600 bg-red-50', Importante: 'text-amber-600 bg-amber-50', Normal: 'text-blue-600 bg-blue-50' };
                  return (
                    <PremiumCard key={ann.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColors[ann.priority || 'Normal']}`}>{ann.priority}</span>
                            <h4 className="font-bold text-text-primary truncate">{ann.title}</h4>
                          </div>
                          <p className="text-sm text-text-secondary line-clamp-2">{ann.content}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => openAnnouncementModal(ann)} className="p-1.5 bg-surface-50 rounded-full hover:text-gold-600"><Edit2 size={14} /></button>
                          <button onClick={() => { if (confirm('Excluir anúncio?')) deleteAnnouncement(ann.id); }} className="p-1.5 bg-surface-50 rounded-full hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </PremiumCard>
                  );
                })}
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 bg-surface-100 p-1 rounded-lg">
                {(['Teams', 'Brokers'] as const).map(v => (
                  <button key={v} onClick={() => setReportView(v)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${reportView === v ? 'bg-white shadow text-text-primary' : 'text-text-secondary'}`}>
                    {v === 'Teams' ? 'Etapas' : 'Corretores'}
                  </button>
                ))}
              </div>
              <div className="relative">
                <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 text-text-secondary text-xs font-medium">
                  <Download size={14} /> Exportar <ChevronDown size={14} />
                </button>
                {isDownloadMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-surface-100 py-1 z-50">
                    <button onClick={() => { alert('Relatório PDF gerado!'); setIsDownloadMenuOpen(false); }} className="w-full px-4 py-2 text-left text-xs hover:bg-surface-50 flex items-center gap-2 text-red-600"><FileText size={14} /> PDF</button>
                    <button onClick={() => { alert('Relatório Excel gerado!'); setIsDownloadMenuOpen(false); }} className="w-full px-4 py-2 text-left text-xs hover:bg-surface-50 flex items-center gap-2 text-green-600"><FileSpreadsheet size={14} /> Excel</button>
                  </div>
                )}
              </div>
            </div>

            <PremiumCard className="p-4">
              <h4 className="font-bold text-text-primary mb-4">Clientes por Etapa do Pipeline</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="total" name="Clientes" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PremiumCard>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total de Clientes', value: clients.length, color: 'text-gold-600' },
                { label: 'Aprovados', value: clients.filter(c => c.stage === 'Aprovados').length, color: 'text-green-600' },
                { label: 'Agendamentos', value: appointments.length, color: 'text-blue-600' },
              ].map(stat => (
                <PremiumCard key={stat.label} className="p-4 text-center">
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
                </PremiumCard>
              ))}
            </div>
          </div>
        );

      case 'directorates':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <RoundedButton size="sm" onClick={() => {
                setEditingDir(null);
                setDirForm({ name: '', description: '' });
                setIsDirModalOpen(true);
              }}>
                <Plus size={16} className="mr-1" /> Nova Diretoria
              </RoundedButton>
            </div>
            {loading ? <Loader2 size={24} className="animate-spin mx-auto text-gold-400 py-4" /> :
              directorates.map(d => (
                <PremiumCard key={d.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                      <Building2 size={18} className="text-gold-600 dark:text-gold-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{d.name}</p>
                      {d.description && <p className="text-xs text-text-secondary">{d.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingDir(d); setDirForm({ ...d }); setIsDirModalOpen(true); }}
                      className="p-2 rounded-lg hover:bg-surface-100 text-text-secondary">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => { if (confirm('Excluir esta diretoria?')) deleteDirectorate(d.id); }}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </PremiumCard>
              ))
            }
          </div>
        );
    }
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <SectionHeader title="Painel Administrativo" subtitle="Governança e Estratégia" />

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
        {[
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'teams', label: 'Equipes', icon: Shield },
          { id: 'goals', label: 'Metas', icon: Target },
          { id: 'announcements', label: 'Anúncios', icon: Megaphone },
          { id: 'reports', label: 'Relatórios', icon: BarChart3 },
          { id: 'directorates', label: 'Diretorias', icon: Building2 },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-gold-500 text-white shadow-md shadow-gold-500/20' : 'bg-white dark:bg-surface-100 text-text-secondary border border-surface-200'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{renderTabContent()}</div>

      {/* Approval Modal */}
      <Modal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} title="Aprovar Usuário">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary mb-4">
            Defina as permissões iniciais deste usuário antes de ativá-lo no sistema.
          </p>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Cargo</label>
            <select value={approvalForm.role} onChange={e => setApprovalForm(p => ({ ...p, role: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary">
              {['CORRETOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Diretoria</label>
            <select value={approvalForm.directorate_id} onChange={e => setApprovalForm(p => ({ ...p, directorate_id: e.target.value, team_id: '' }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary">
              <option value="">Nenhuma / Global</option>
              {directorates.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Equipe</label>
            <select value={approvalForm.team_id} onChange={e => setApprovalForm(p => ({ ...p, team_id: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary disabled:opacity-50"
              disabled={!approvalForm.directorate_id && teams.length > 0}>
              <option value="">Sem Equipe</option>
              {teams
                .filter(t => !approvalForm.directorate_id || t.directorate_id === approvalForm.directorate_id)
                .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {approvalForm.team_id && (
              <p className="text-xs text-green-600 mt-1">✓ O Gestor e a Diretoria serão herdados desta equipe automaticamente.</p>
            )}
          </div>
          <RoundedButton fullWidth onClick={handleConfirmApproval} disabled={isSavingApproval} className="mt-2">
            {isSavingApproval ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Confirmar Aprovação'}
          </RoundedButton>
        </div>
      </Modal>

      {/* Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title={editingTeam ? 'Editar Equipe' : 'Nova Equipe'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nome</label>
            <input value={teamForm.name || ''} onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary" placeholder="Ex: Equipe Alpha" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Diretoria</label>
            <select value={teamForm.directorate_id || ''} onChange={e => setTeamForm(p => ({ ...p, directorate_id: e.target.value || null }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary">
              <option value="">Sem Diretoria</option>
              {directorates.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Gestor da Equipe</label>
            <select value={teamForm.manager_id || ''} onChange={e => setTeamForm(p => ({ ...p, manager_id: e.target.value || null }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary">
              <option value="">Sem Gestor</option>
              {allProfiles
                .filter(p => ['ADMIN', 'DIRETOR', 'GERENTE', 'COORDENADOR'].includes(p.role))
                .map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)
              }
            </select>
          </div>
          <RoundedButton fullWidth onClick={handleSaveTeam} disabled={isSavingTeam}>
            {isSavingTeam ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar'}
          </RoundedButton>
        </div>
      </Modal>

      {/* Manage Members Modal */}
      <Modal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} title="Gerenciar Membros">
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {allProfiles.filter(u => u.status === 'active' || u.status === 'Ativo').map(u => {
              const team = teams.find(t => t.id === selectedTeamId);
              const isMember = (team?.members || []).includes(u.id);
              return (
                <div key={u.id} className="flex justify-between items-center p-2 bg-surface-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center text-xs font-bold">{(u.name || '?').charAt(0)}</div>
                    <div><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-text-secondary">{u.role}</p></div>
                  </div>
                  <button onClick={() => selectedTeamId && handleToggleMember(selectedTeamId, u.id)}
                    className={`text-xs font-medium hover:underline ${isMember ? 'text-red-500' : 'text-green-600'}`}>
                    {isMember ? 'Remover' : 'Adicionar'}
                  </button>
                </div>
              );
            })}
          </div>
          <RoundedButton fullWidth onClick={() => setIsMembersModalOpen(false)}>Concluir</RoundedButton>
        </div>
      </Modal>

      {/* Goal Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={editingGoal ? (isMission ? 'Editar Missão' : 'Editar Meta') : (isMission ? 'Nova Missão' : 'Nova Meta')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Título</label>
            <input value={goalForm.title || ''} onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
            <textarea value={goalForm.description || ''} onChange={e => setGoalForm(p => ({ ...p, description: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary h-20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{isMission ? 'Pontos' : 'Alvo'}</label>
              <input type="number" value={isMission ? goalForm.points : goalForm.target} onChange={e => setGoalForm(p => ({ ...p, [isMission ? 'points' : 'target']: Number(e.target.value) }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
              <select value={goalForm.type} onChange={e => setGoalForm(p => ({ ...p, type: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary">
                {isMission ? <option>Missão</option> : <><option>Mensal</option><option>Trimestral</option><option>Personalizada</option></>}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Início</label>
              <input type="date" value={goalForm.start_date || ''} onChange={e => setGoalForm(p => ({ ...p, start_date: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Fim</label>
              <input type="date" value={goalForm.deadline || ''} onChange={e => setGoalForm(p => ({ ...p, deadline: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary" />
            </div>
          </div>
          <RoundedButton fullWidth onClick={handleSaveGoal} disabled={isSavingGoal}>
            {isSavingGoal ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar'}
          </RoundedButton>
        </div>
      </Modal>

      {/* Announcement Modal */}
      <Modal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} title={editingAnnouncement ? 'Editar Anúncio' : 'Novo Anúncio'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Título</label>
            <input value={announcementForm.title || ''} onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Conteúdo</label>
            <textarea value={announcementForm.content || ''} onChange={e => setAnnouncementForm(p => ({ ...p, content: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary h-24" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Prioridade</label>
            <select value={announcementForm.priority} onChange={e => setAnnouncementForm(p => ({ ...p, priority: e.target.value as any }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary">
              <option>Normal</option><option>Importante</option><option>Urgente</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Início</label>
              <input type="date" value={announcementForm.start_date || ''} onChange={e => setAnnouncementForm(p => ({ ...p, start_date: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Fim</label>
              <input type="date" value={announcementForm.end_date || ''} onChange={e => setAnnouncementForm(p => ({ ...p, end_date: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary" />
            </div>
          </div>
          <RoundedButton fullWidth onClick={handleSaveAnnouncement} disabled={isSavingAnnouncement}>
            {isSavingAnnouncement ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar'}
          </RoundedButton>
        </div>
      </Modal>

      {/* Directorate Modal */}
      <Modal isOpen={isDirModalOpen} onClose={() => setIsDirModalOpen(false)} title={editingDir ? 'Editar Diretoria' : 'Nova Diretoria'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nome da Diretoria</label>
            <input value={dirForm.name || ''} onChange={e => setDirForm(p => ({ ...p, name: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary"
              placeholder="Ex: DIRETORIA COMERCIAL" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Descrição (opcional)</label>
            <textarea value={dirForm.description || ''} onChange={e => setDirForm(p => ({ ...p, description: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary h-20"
              placeholder="Descreva a diretoria..." />
          </div>
          <RoundedButton fullWidth onClick={async () => {
            if (!dirForm.name) return;
            setIsSavingDir(true);
            try {
              if (editingDir) await updateDirectorate(editingDir.id, dirForm);
              else await addDirectorate({ name: dirForm.name, description: dirForm.description });
              setIsDirModalOpen(false);
            } finally { setIsSavingDir(false); }
          }} disabled={isSavingDir}>
            {isSavingDir ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar Diretoria'}
          </RoundedButton>
        </div>
      </Modal>
    </div>
  );
}
