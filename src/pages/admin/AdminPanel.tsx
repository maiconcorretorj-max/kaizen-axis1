import { useState, useEffect } from 'react';
import { SectionHeader, PremiumCard, RoundedButton } from '@/components/ui/PremiumComponents';
import { Users, Shield, Target, Megaphone, BarChart3, Plus, Search, Trophy, Download, FileSpreadsheet, FileText, Trash2, Edit2, ChevronDown, Calendar, Loader2, Building2, TrendingUp } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useApp, Team, Goal, Announcement, Directorate } from '@/context/AppContext';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Navigate, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';

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
  const [reportDateRange, setReportDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  });
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'reports' && reportDateRange.start && reportDateRange.end) {
      fetchReportData();
    }
  }, [activeTab, reportDateRange]);

  const fetchReportData = async () => {
    setReportLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_report_metrics', {
        data_inicial: reportDateRange.start,
        data_final: reportDateRange.end
      });
      if (error) throw error;
      setReportData(data);
    } catch (e) {
      console.error('Erro ao buscar relatórios:', e);
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    setIsGeneratingCSV(true);
    try {
      const rows = [
        ['Métrica', 'Valor'],
        ['Total de Leads', reportData.resumo_geral.L],
        ['Total de Clientes', reportData.resumo_geral.C],
        ['Vendas Concluídas', reportData.resumo_geral.V],
        ['Receita Total', reportData.resumo_geral.R],
        ['Agendamentos', reportData.resumo_geral.A],
        ['Taxa de Conversão', `${reportData.resumo_geral.Taxa_Conversao}%`],
        ['Ticket Médio', reportData.resumo_geral.Ticket_Medio],
        ['Tempo Médio de Conversão (dias)', reportData.resumo_geral.Tempo_Medio_Conversao],
        [],
        ['Pipeline - Etapa', 'Quantidade', 'Percentual']
      ];

      reportData.pipeline.forEach((p: any) => {
        rows.push([p.etapa, p.quantidade.toString(), `${p.percentual}%`]);
      });

      rows.push([]);
      rows.push(['Corretores - Nome', 'Leads', 'Vendas', 'Receita', 'Taxa Conversão', 'Ticket Médio']);
      reportData.performance_corretores.forEach((c: any) => {
        rows.push([c.nome, c.Li.toString(), c.Vi.toString(), c.Ri.toString(), `${c.Taxa_Conversao_i}%`, c.Ticket_Medio_i.toString()]);
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(";")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `relatorio_${reportDateRange.start}_${reportDateRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Erro ao gerar CSV', e);
    } finally {
      setIsGeneratingCSV(false);
    }
  };

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
  const stageData = ['Em Análise', 'Aprovados', 'Condicionados', 'Reprovados', 'Em Tratativa', 'Contrato', 'Vendas Concluidas'].map(stage => ({
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
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-surface-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gold-600" />
                <span className="text-sm font-semibold text-text-primary whitespace-nowrap">Período Selecionado:</span>
                <input
                  type="date"
                  value={reportDateRange.start}
                  onChange={(e) => setReportDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-2 py-1.5 border border-surface-200 rounded-md text-sm bg-surface-50 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 outline-none transition-all"
                  max={reportDateRange.end}
                />
                <span className="text-sm text-text-secondary mx-1">até</span>
                <input
                  type="date"
                  value={reportDateRange.end}
                  onChange={(e) => setReportDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-2 py-1.5 border border-surface-200 rounded-md text-sm bg-surface-50 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 outline-none transition-all"
                  min={reportDateRange.start}
                />
                <div className="flex gap-1 ml-4 border-l border-surface-200 pl-4">
                  <button onClick={() => setReportDateRange({ start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) })} className="px-3 py-1.5 bg-surface-100 text-xs font-semibold text-text-secondary rounded-md hover:bg-gold-50 hover:text-gold-700 transition-colors">Este Mês</button>
                  <button onClick={() => { const today = new Date(); const m30 = new Date(); m30.setDate(today.getDate() - 30); setReportDateRange({ start: m30.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10) }) }} className="px-3 py-1.5 bg-surface-100 text-xs font-semibold text-text-secondary rounded-md hover:bg-gold-50 hover:text-gold-700 transition-colors">Últimos 30 Dias</button>
                </div>
              </div>
              <RoundedButton size="sm" onClick={handleExportCSV} disabled={isGeneratingCSV || !reportData}>
                {isGeneratingCSV ? <Loader2 size={16} className="animate-spin mr-2" /> : <FileSpreadsheet size={16} className="mr-2" />} Exportar Base (CSV)
              </RoundedButton>
            </div>

            {reportLoading || !reportData ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-surface-200 shadow-sm">
                <Loader2 size={40} className="animate-spin text-gold-500 mb-4" />
                <p className="text-sm font-semibold text-text-primary">Processando indicadores no banco de dados...</p>
                <p className="text-xs text-text-secondary mt-1">Isso pode levar alguns segundos dependendo do volume do período.</p>
              </div>
            ) : (
              <>
                {/* TOP NAVIGATION METRICS */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total de Leads', value: reportData.resumo_geral.L, cmp: reportData.comparativo_mes_atual.crescimento_leads, icon: <Users size={18} />, color: 'text-surface-600', route: undefined },
                    { label: 'Total de Clientes', value: reportData.resumo_geral.C, cmp: null, icon: <Users size={18} />, color: 'text-gold-600', route: '/clients' },
                    { label: 'Aprovados', value: reportData.pipeline.find((p: any) => p.etapa === 'Aprovados')?.quantidade || 0, cmp: null, icon: <Shield size={18} />, color: 'text-green-600', route: '/clients' },
                    { label: 'Agendamentos', value: reportData.resumo_geral.A, cmp: null, icon: <Calendar size={18} />, color: 'text-blue-600', route: '/schedule' },
                  ].map((stat, i) => (
                    <PremiumCard key={i} className={`p-4 relative ${stat.route ? 'cursor-pointer hover:border-gold-300 hover:shadow-md transition-all' : ''}`} onClick={() => stat.route && navigate(stat.route)}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="p-2 bg-surface-100 rounded-lg">{stat.icon}</span>
                        {stat.cmp !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.cmp > 0 ? 'bg-green-100 text-green-700' : stat.cmp < 0 ? 'bg-red-100 text-red-700' : 'bg-surface-100 text-text-secondary'}`}>
                            {stat.cmp > 0 ? '+' : ''}{stat.cmp}%
                          </span>
                        )}
                      </div>
                      <p className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</p>
                      <p className="text-xs font-semibold text-text-secondary">{stat.label}</p>
                      {stat.route && <span className="absolute bottom-4 right-4 text-[10px] text-gold-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Ver lista &rarr;</span>}
                    </PremiumCard>
                  ))}
                </div>

                {/* STRATEGIC DASHBOARD */}
                <div className="grid grid-cols-4 gap-4">
                  <PremiumCard className="p-4 bg-gradient-to-br from-gold-50/50 to-white dark:from-gold-900/10 dark:to-surface-800 border-gold-100">
                    <p className="text-xs font-bold tracking-wider text-gold-600 mb-1 flex items-center gap-1.5"><Trophy size={14} /> VENDAS CONCLUÍDAS</p>
                    <p className="text-2xl font-black text-text-primary">{reportData.resumo_geral.V}</p>
                    <p className="text-[10px] font-semibold text-text-secondary mt-1 flex items-center gap-1">
                      <span className={reportData.comparativo_mes_atual.crescimento_vendas > 0 ? 'text-green-600' : reportData.comparativo_mes_atual.crescimento_vendas < 0 ? 'text-red-600' : ''}>
                        {reportData.comparativo_mes_atual.crescimento_vendas > 0 ? '+' : ''}{reportData.comparativo_mes_atual.crescimento_vendas}%
                      </span>
                      vs mês atual
                    </p>
                  </PremiumCard>
                  <PremiumCard className="p-4 bg-gradient-to-br from-green-50/50 to-white dark:from-green-900/10 dark:to-surface-800 border-green-100">
                    <p className="text-xs font-bold tracking-wider text-green-600 mb-1 flex items-center gap-1.5"><TrendingUp size={14} /> RECEITA (VGV)</p>
                    <p className="text-2xl font-black text-text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(reportData.resumo_geral.R)}
                    </p>
                    <p className="text-[10px] font-semibold text-text-secondary mt-1 flex items-center gap-1">
                      <span className={reportData.comparativo_mes_atual.crescimento_receita > 0 ? 'text-green-600' : reportData.comparativo_mes_atual.crescimento_receita < 0 ? 'text-red-600' : ''}>
                        {reportData.comparativo_mes_atual.crescimento_receita > 0 ? '+' : ''}{reportData.comparativo_mes_atual.crescimento_receita}%
                      </span>
                      vs mês atual
                    </p>
                  </PremiumCard>
                  <PremiumCard className="p-4 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-surface-800 border-blue-100">
                    <p className="text-xs font-bold tracking-wider text-blue-600 mb-1 flex items-center gap-1.5"><Target size={14} /> CONVERSÃO GLOBAL</p>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-black text-text-primary">{reportData.resumo_geral.Taxa_Conversao}%</p>
                      <span className="text-xs text-text-secondary mb-1">de conversão</span>
                    </div>
                    <p className="text-[10px] font-bold text-text-secondary mt-1 bg-white inline-block px-2 py-0.5 rounded border border-surface-100">
                      Ticket Médio: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(reportData.resumo_geral.Ticket_Medio)}
                    </p>
                  </PremiumCard>
                  <PremiumCard className="p-4 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-900/10 dark:to-surface-800 border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold tracking-wider text-purple-600">JORNADA (TMC)</p>
                      <div className="group relative">
                        <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold cursor-help">?</div>
                        <div className="absolute right-0 bottom-6 w-48 p-2 bg-surface-800 text-white text-[10px] rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">Tempo Médio de Conversão, da criação do lead até a venda.</div>
                      </div>
                    </div>
                    <p className="text-2xl font-black text-text-primary">{reportData.resumo_geral.Tempo_Medio_Conversao} <span className="text-[13px] font-bold text-text-secondary">dias</span></p>
                    <p className="text-[10px] font-semibold text-text-secondary mt-1 ml-0.5">Média calculada para o período</p>
                  </PremiumCard>
                </div>

                {/* CHARTS LAYER */}
                <div className="grid grid-cols-2 gap-6">
                  <PremiumCard className="p-5">
                    <h4 className="font-bold text-text-primary mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-gold-500" /> Distribuição de Pipeline (Clientes Ativos)</h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.pipeline}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="etapa" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                          <YAxis hide />
                          <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            formatter={(value: any, name: any, props: any) => [`${value} Clientes (${props.payload.percentual}%)`, 'Quantidade']}
                          />
                          <Bar dataKey="quantidade" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </PremiumCard>

                  <PremiumCard className="p-5">
                    <h4 className="font-bold text-text-primary mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> Tendência no Período</h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.tendencia_temporal}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => v.substring(5, 10).replace('-', '/')} />
                          <YAxis hide yAxisId="left" />
                          <YAxis hide yAxisId="right" orientation="right" />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            labelFormatter={(label) => `Data: ${label.split('-').reverse().join('/')}`}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Line yAxisId="left" type="monotone" dataKey="Lt" name="Leads Adquiridos" stroke="#9CA3AF" strokeWidth={2} dot={false} />
                          <Line yAxisId="left" type="monotone" dataKey="Vt" name="Vendas Concluídas" stroke="#10B981" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                          <Line yAxisId="right" type="monotone" dataKey="Rt" name="Receita" stroke="#3B82F6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </PremiumCard>
                </div>

                {/* RANKING TABLE */}
                <PremiumCard className="p-0 overflow-hidden border border-surface-200 shadow-sm">
                  <div className="p-4 border-b border-surface-100 flex items-center justify-between bg-surface-50">
                    <h4 className="font-bold text-text-primary flex items-center gap-2"><Trophy size={18} className="text-gold-500" /> Performance Individual de Corretores</h4>
                    <span className="text-xs font-semibold text-text-secondary bg-white px-3 py-1 border border-surface-200 rounded-full shadow-sm">{reportData.performance_corretores.length} corretores no período</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-50 text-text-secondary text-[10px] uppercase tracking-wider">
                          <th className="p-4 font-bold">Corretor</th>
                          <th className="p-4 font-bold text-center">Volume Leads</th>
                          <th className="p-4 font-bold text-center">Vendas Concluídas</th>
                          <th className="p-4 font-bold text-center">Taxa de Conversão</th>
                          <th className="p-4 font-bold text-right">VGV / Receita</th>
                          <th className="p-4 font-bold text-right">Ticket Médio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.performance_corretores.sort((a: any, b: any) => b.Vi - a.Vi || b.Ri - a.Ri).map((c: any, i: number) => (
                          <tr key={c.corretor_id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                            <td className="p-4 text-sm font-semibold text-text-primary flex items-center gap-3">
                              {i < 3 ? (
                                <span className={`text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-sm ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white' : i === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-white' : 'bg-gradient-to-br from-orange-300 to-orange-500 text-white'}`}>{i + 1}</span>
                              ) : (
                                <span className="text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-bold bg-surface-100 text-text-secondary">{i + 1}</span>
                              )}
                              {c.nome}
                            </td>
                            <td className="p-4 text-sm text-center text-text-secondary">{c.Li}</td>
                            <td className="p-4 text-sm text-center font-black text-green-600">{c.Vi}</td>
                            <td className="p-4 text-sm text-center">
                              <span className={`px-2.5 py-1 rounded-md border text-[11px] font-bold shadow-xs ${c.Taxa_Conversao_i >= 5 ? 'bg-green-50 text-green-700 border-green-200' : c.Taxa_Conversao_i > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-surface-50 text-text-secondary border-surface-200'}`}>
                                {c.Taxa_Conversao_i}%
                              </span>
                            </td>
                            <td className="p-4 text-sm text-right font-bold text-text-primary">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(c.Ri)}
                            </td>
                            <td className="p-4 text-sm text-right font-medium text-text-secondary">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(c.Ticket_Medio_i)}
                            </td>
                          </tr>
                        ))}
                        {reportData.performance_corretores.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-text-secondary text-sm">Nenhum dado de corretor encontrado nesse período.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </PremiumCard>
              </>
            )}
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
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Atribuir para</label>
            <select value={goalForm.assignee_id || 'All'} onChange={e => setGoalForm(p => ({ ...p, assignee_id: e.target.value === 'All' ? undefined : e.target.value, assignee_type: e.target.value === 'All' ? 'All' : 'User' }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 text-text-primary">
              <option value="All">Todos (Global)</option>
              {allProfiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
            </select>
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
