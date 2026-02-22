import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Client } from '@/data/clients';
import { AutomationLead } from '@/data/leads';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  name: string;
  role: string;
  team?: string;
  status?: string;
}

export interface Appointment {
  id: string;
  user_id?: string;
  title: string;
  client_name?: string;
  client_id?: string;
  date: string; // YYYY-MM-DD
  time: string;
  location?: string;
  type: 'Visita' | 'Reunião' | 'Assinatura' | 'Outro';
  completed: boolean;
  created_at?: string;
}

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  responsible?: string;
  deadline?: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluída';
  description?: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  created_at?: string;
}

export interface Development {
  id: string;
  user_id?: string;
  name: string;
  builder?: string;
  location?: string;
  address?: string;
  price?: string;
  min_income?: string;
  type?: string;
  status?: string;
  description?: string;
  differentials?: string[];
  images?: string[];
  book_pdf_url?: string;
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
    role?: string;
    avatar?: string;
  };
  created_at?: string;
}

export interface Team {
  id: string;
  name: string;
  manager_id?: string;
  directorate?: string;
  total_sales?: string;
  members?: string[];
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  target?: number;
  current_progress?: number;
  start_date?: string;
  deadline?: string;
  type?: string;
  assignee_type?: string;
  assignee_id?: string;
  points?: number;
}

export interface Announcement {
  id: string;
  author_id?: string;
  title: string;
  content?: string;
  priority?: 'Normal' | 'Importante' | 'Urgente';
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

interface AppContextValue {
  // Auth
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  allProfiles: Profile[];
  userName: string;
  userRole: string;
  signOut: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  updateProfile: (id: string, data: Partial<Profile>) => Promise<void>;

  // Clients
  clients: Client[];
  loading: boolean;
  addClient: (data: Omit<Client, 'id' | 'history' | 'documents' | 'createdAt'>) => Promise<Client | null>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
  refreshClients: () => Promise<void>;

  // Leads
  leads: AutomationLead[];
  refreshLeads: () => Promise<void>;

  // Storage
  uploadFile: (file: File, path: string, bucket?: string) => Promise<string | null>;
  addDocumentToClient: (clientId: string, name: string, path: string) => Promise<void>;
  getDownloadUrl: (path: string, bucket?: string) => Promise<string | null>;

  // Appointments
  appointments: Appointment[];
  refreshAppointments: () => Promise<void>;
  addAppointment: (data: Omit<Appointment, 'id' | 'created_at'>) => Promise<void>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  refreshTasks: () => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'created_at'>) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Developments
  developments: Development[];
  refreshDevelopments: () => Promise<void>;
  addDevelopment: (data: Omit<Development, 'id' | 'created_at'>) => Promise<Development | null>;
  updateDevelopment: (id: string, data: Partial<Development>) => Promise<void>;
  deleteDevelopment: (id: string) => Promise<void>;

  // Admin - Teams
  teams: Team[];
  refreshTeams: () => Promise<void>;
  addTeam: (data: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;

  // Admin - Goals
  goals: Goal[];
  refreshGoals: () => Promise<void>;
  addGoal: (data: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Admin - Announcements
  announcements: Announcement[];
  refreshAnnouncements: () => Promise<void>;
  addAnnouncement: (data: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<AutomationLead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const userName = profile?.name || user?.email || 'Usuário';
  const userRole = profile?.role || 'Corretor';

  // ─── Auth ─────────────────────────────────────────────────────────────────

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) setProfile(data);
    } catch (e) {
      console.error('Erro ao buscar perfil:', e);
    }
  };

  const refreshProfiles = useCallback(async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').order('name');
      setAllProfiles(data || []);
    } catch (e) {
      console.error('Erro ao buscar profiles:', e);
    }
  }, []);

  const updateProfile = useCallback(async (id: string, data: Partial<Profile>) => {
    try {
      const { error } = await supabase.from('profiles').update(data).eq('id', id);
      if (error) throw error;
      await refreshProfiles();
    } catch (e) {
      console.error('Erro ao atualizar profile:', e);
    }
  }, [refreshProfiles]);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAuthenticated');
  };

  // ─── Clients ──────────────────────────────────────────────────────────────

  const refreshLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const transformed: AutomationLead[] = (data || []).map(lead => ({
        id: lead.id, name: lead.name, phone: lead.phone, origin: lead.origin,
        timestamp: lead.created_at, aiSummary: lead.ai_summary,
        interestLevel: lead.interest_level, data: lead.data
      }));
      setLeads(transformed);
    } catch (e) { console.error('Erro ao carregar leads:', e); }
  }, []);

  const refreshClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*, history:client_history(*), documents:client_documents(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const transformed = (data || []).map(client => ({
        ...client,
        grossIncome: client.gross_income, incomeType: client.income_type,
        socialFactor: client.social_factor, regionOfInterest: client.region_of_interest,
        intendedValue: client.intended_value, createdAt: client.created_at,
        history: (client.history || []).map((h: any) => ({ ...h, user: h.user_name }))
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        documents: (client.documents || []).map((d: any) => ({ ...d, uploadDate: d.upload_date }))
      }));
      setClients(transformed);
    } catch (e) { console.error('Erro ao carregar clientes:', e); }
    finally { setLoading(false); }
  }, []);

  const addClient = useCallback(async (data: Omit<Client, 'id' | 'history' | 'documents' | 'createdAt'>): Promise<Client | null> => {
    try {
      const { data: newClient, error } = await supabase.from('clients').insert([{
        name: data.name, cpf: data.cpf, email: data.email, phone: data.phone,
        address: data.address, profession: data.profession, gross_income: data.grossIncome,
        income_type: data.incomeType, cotista: data.cotista, social_factor: data.socialFactor,
        region_of_interest: data.regionOfInterest, development: data.development,
        intended_value: data.intendedValue, observations: data.observations, stage: data.stage
      }]).select().single();
      if (error) throw error;
      await supabase.from('client_history').insert([{ client_id: newClient.id, action: 'Cliente criado', user_name: userName }]);
      await refreshClients();
      return newClient;
    } catch (e) { console.error('Erro ao adicionar cliente:', e); return null; }
  }, [userName, refreshClients]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    try {
      const updatePayload: any = { ...data };
      if (data.grossIncome !== undefined) updatePayload.gross_income = data.grossIncome;
      if (data.incomeType !== undefined) updatePayload.income_type = data.incomeType;
      if (data.socialFactor !== undefined) updatePayload.social_factor = data.socialFactor;
      if (data.regionOfInterest !== undefined) updatePayload.region_of_interest = data.regionOfInterest;
      if (data.intendedValue !== undefined) updatePayload.intended_value = data.intendedValue;
      delete updatePayload.history; delete updatePayload.documents;
      delete updatePayload.grossIncome; delete updatePayload.incomeType;
      delete updatePayload.socialFactor; delete updatePayload.regionOfInterest; delete updatePayload.intendedValue;
      const { error } = await supabase.from('clients').update(updatePayload).eq('id', id);
      if (error) throw error;
      if (data.stage) {
        await supabase.from('client_history').insert([{ client_id: id, action: `Estágio alterado para ${data.stage}`, user_name: userName }]);
      }
      await refreshClients();
    } catch (e) { console.error('Erro ao atualizar cliente:', e); }
  }, [userName, refreshClients]);

  const deleteClient = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      await refreshClients();
    } catch (e) { console.error('Erro ao deletar cliente:', e); }
  }, [refreshClients]);

  const getClient = useCallback((id: string) => clients.find(c => c.id === id), [clients]);

  // ─── Storage ──────────────────────────────────────────────────────────────

  const uploadFile = async (file: File, path: string, bucket = 'documents'): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      return data.path;
    } catch (e) { console.error('Erro no upload:', e); return null; }
  };

  const addDocumentToClient = async (clientId: string, name: string, path: string) => {
    try {
      const { error } = await supabase.from('client_documents').insert([{ client_id: clientId, name, file_path: path }]);
      if (error) throw error;
      await refreshClients();
    } catch (e) { console.error('Erro ao adicionar documento:', e); }
  };

  const getDownloadUrl = async (path: string, bucket = 'documents'): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (error) { console.error('Erro ao gerar link:', error); return null; }
    return data.signedUrl;
  };

  // ─── Appointments ─────────────────────────────────────────────────────────

  const refreshAppointments = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('appointments').select('*').order('date').order('time');
      if (error) throw error;
      setAppointments(data || []);
    } catch (e) { console.error('Erro ao buscar agendamentos:', e); }
  }, []);

  const addAppointment = useCallback(async (data: Omit<Appointment, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase.from('appointments').insert([data]);
      if (error) throw error;
      await refreshAppointments();
    } catch (e) { console.error('Erro ao adicionar agendamento:', e); }
  }, [refreshAppointments]);

  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>) => {
    try {
      const { error } = await supabase.from('appointments').update(data).eq('id', id);
      if (error) throw error;
      await refreshAppointments();
    } catch (e) { console.error('Erro ao atualizar agendamento:', e); }
  }, [refreshAppointments]);

  const deleteAppointment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      await refreshAppointments();
    } catch (e) { console.error('Erro ao deletar agendamento:', e); }
  }, [refreshAppointments]);

  // ─── Tasks ────────────────────────────────────────────────────────────────

  const refreshTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (e) { console.error('Erro ao buscar tarefas:', e); }
  }, []);

  const addTask = useCallback(async (data: Omit<Task, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase.from('tasks').insert([data]);
      if (error) throw error;
      await refreshTasks();
    } catch (e) { console.error('Erro ao adicionar tarefa:', e); }
  }, [refreshTasks]);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    try {
      const { error } = await supabase.from('tasks').update(data).eq('id', id);
      if (error) throw error;
      await refreshTasks();
    } catch (e) { console.error('Erro ao atualizar tarefa:', e); }
  }, [refreshTasks]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      await refreshTasks();
    } catch (e) { console.error('Erro ao deletar tarefa:', e); }
  }, [refreshTasks]);

  // ─── Developments ─────────────────────────────────────────────────────────

  const refreshDevelopments = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('developments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setDevelopments(data || []);
    } catch (e) { console.error('Erro ao buscar empreendimentos:', e); }
  }, []);

  const addDevelopment = useCallback(async (data: Omit<Development, 'id' | 'created_at'>): Promise<Development | null> => {
    try {
      const { data: newDev, error } = await supabase.from('developments').insert([data]).select().single();
      if (error) throw error;
      await refreshDevelopments();
      return newDev;
    } catch (e) { console.error('Erro ao adicionar empreendimento:', e); return null; }
  }, [refreshDevelopments]);

  const updateDevelopment = useCallback(async (id: string, data: Partial<Development>) => {
    try {
      const { error } = await supabase.from('developments').update(data).eq('id', id);
      if (error) throw error;
      await refreshDevelopments();
    } catch (e) { console.error('Erro ao atualizar empreendimento:', e); }
  }, [refreshDevelopments]);

  const deleteDevelopment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('developments').delete().eq('id', id);
      if (error) throw error;
      await refreshDevelopments();
    } catch (e) { console.error('Erro ao deletar empreendimento:', e); }
  }, [refreshDevelopments]);

  // ─── Teams ────────────────────────────────────────────────────────────────

  const refreshTeams = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('teams').select('*').order('name');
      if (error) throw error;
      setTeams(data || []);
    } catch (e) { console.error('Erro ao buscar equipes:', e); }
  }, []);

  const addTeam = useCallback(async (data: Omit<Team, 'id'>) => {
    try {
      const { error } = await supabase.from('teams').insert([data]);
      if (error) throw error;
      await refreshTeams();
    } catch (e) { console.error('Erro ao adicionar equipe:', e); }
  }, [refreshTeams]);

  const updateTeam = useCallback(async (id: string, data: Partial<Team>) => {
    try {
      const { error } = await supabase.from('teams').update(data).eq('id', id);
      if (error) throw error;
      await refreshTeams();
    } catch (e) { console.error('Erro ao atualizar equipe:', e); }
  }, [refreshTeams]);

  const deleteTeam = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
      await refreshTeams();
    } catch (e) { console.error('Erro ao deletar equipe:', e); }
  }, [refreshTeams]);

  // ─── Goals ────────────────────────────────────────────────────────────────

  const refreshGoals = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setGoals(data || []);
    } catch (e) { console.error('Erro ao buscar metas:', e); }
  }, []);

  const addGoal = useCallback(async (data: Omit<Goal, 'id'>) => {
    try {
      const { error } = await supabase.from('goals').insert([data]);
      if (error) throw error;
      await refreshGoals();
    } catch (e) { console.error('Erro ao adicionar meta:', e); }
  }, [refreshGoals]);

  const updateGoal = useCallback(async (id: string, data: Partial<Goal>) => {
    try {
      const { error } = await supabase.from('goals').update(data).eq('id', id);
      if (error) throw error;
      await refreshGoals();
    } catch (e) { console.error('Erro ao atualizar meta:', e); }
  }, [refreshGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      await refreshGoals();
    } catch (e) { console.error('Erro ao deletar meta:', e); }
  }, [refreshGoals]);

  // ─── Announcements ────────────────────────────────────────────────────────

  const refreshAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (e) { console.error('Erro ao buscar anúncios:', e); }
  }, []);

  const addAnnouncement = useCallback(async (data: Omit<Announcement, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase.from('announcements').insert([{ ...data, author_id: user?.id }]);
      if (error) throw error;
      await refreshAnnouncements();
    } catch (e) { console.error('Erro ao adicionar anúncio:', e); }
  }, [refreshAnnouncements, user]);

  const updateAnnouncement = useCallback(async (id: string, data: Partial<Announcement>) => {
    try {
      const { error } = await supabase.from('announcements').update(data).eq('id', id);
      if (error) throw error;
      await refreshAnnouncements();
    } catch (e) { console.error('Erro ao atualizar anúncio:', e); }
  }, [refreshAnnouncements]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      await refreshAnnouncements();
    } catch (e) { console.error('Erro ao deletar anúncio:', e); }
  }, [refreshAnnouncements]);

  // ─── Init ─────────────────────────────────────────────────────────────────

  const loadAllData = useCallback(async () => {
    await Promise.all([
      refreshClients(),
      refreshLeads(),
      refreshAppointments(),
      refreshTasks(),
      refreshDevelopments(),
      refreshTeams(),
      refreshGoals(),
      refreshAnnouncements(),
      refreshProfiles(),
    ]);
  }, [refreshClients, refreshLeads, refreshAppointments, refreshTasks, refreshDevelopments, refreshTeams, refreshGoals, refreshAnnouncements, refreshProfiles]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        loadAllData();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        loadAllData();
      } else {
        setProfile(null); setClients([]); setLeads([]);
        setAppointments([]); setTasks([]); setDevelopments([]);
        setTeams([]); setGoals([]); setAnnouncements([]);
        setLoading(false);
      }
    });

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => refreshClients())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => refreshLeads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => refreshAppointments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => refreshTasks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'developments' }, () => refreshDevelopments())
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [loadAllData, refreshClients, refreshLeads, refreshAppointments, refreshTasks, refreshDevelopments]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppContext.Provider value={{
      session, user, profile, allProfiles, userName, userRole,
      signOut, refreshProfiles, updateProfile,
      clients, loading, addClient, updateClient, deleteClient, getClient, refreshClients,
      leads, refreshLeads,
      uploadFile, addDocumentToClient, getDownloadUrl,
      appointments, refreshAppointments, addAppointment, updateAppointment, deleteAppointment,
      tasks, refreshTasks, addTask, updateTask, deleteTask,
      developments, refreshDevelopments, addDevelopment, updateDevelopment, deleteDevelopment,
      teams, refreshTeams, addTeam, updateTeam, deleteTeam,
      goals, refreshGoals, addGoal, updateGoal, deleteGoal,
      announcements, refreshAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
