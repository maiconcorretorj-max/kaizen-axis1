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
}

interface AppContextValue {
  // Auth
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  userName: string;
  userRole: string;
  signOut: () => Promise<void>;

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
  uploadFile: (file: File, path: string) => Promise<string | null>;
  addDocumentToClient: (clientId: string, name: string, path: string) => Promise<void>;
  getDownloadUrl: (path: string) => Promise<string | null>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<AutomationLead[]>([]);
  const [loading, setLoading] = useState(true);

  const userName = profile?.name || user?.email || 'Usuário';
  const userRole = profile?.role || 'Corretor';

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (e) {
      console.error('Erro ao buscar perfil:', e);
    }
  };

  const refreshLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed: AutomationLead[] = (data || []).map(lead => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        origin: lead.origin,
        timestamp: lead.created_at,
        aiSummary: lead.ai_summary,
        interestLevel: lead.interest_level,
        data: lead.data
      }));

      setLeads(transformed);
    } catch (e) {
      console.error('Erro ao carregar leads:', e);
    }
  }, []);

  const refreshClients = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          history:client_history(*),
          documents:client_documents(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed = (data || []).map(client => ({
        ...client,
        grossIncome: client.gross_income,
        incomeType: client.income_type,
        socialFactor: client.social_factor,
        regionOfInterest: client.region_of_interest,
        intendedValue: client.intended_value,
        createdAt: client.created_at,
        history: (client.history || []).map((h: any) => ({
          ...h,
          user: h.user_name
        })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        documents: (client.documents || []).map((d: any) => ({
          ...d,
          uploadDate: d.upload_date
        }))
      }));

      setClients(transformed);
    } catch (e) {
      console.error('Erro ao carregar clientes:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        refreshClients();
        refreshLeads();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        refreshClients();
        refreshLeads();
      } else {
        setProfile(null);
        setClients([]);
        setLeads([]);
        setLoading(false);
      }
    });

    // Realtime Subscriptions
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => refreshClients()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => refreshLeads()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [refreshClients, refreshLeads]);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAuthenticated');
  };

  const addClient = useCallback(async (data: Omit<Client, 'id' | 'history' | 'documents' | 'createdAt'>): Promise<Client | null> => {
    try {
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([{
          name: data.name,
          cpf: data.cpf,
          email: data.email,
          phone: data.phone,
          address: data.address,
          profession: data.profession,
          gross_income: data.grossIncome,
          income_type: data.incomeType,
          cotista: data.cotista,
          social_factor: data.socialFactor,
          region_of_interest: data.regionOfInterest,
          development: data.development,
          intended_value: data.intendedValue,
          observations: data.observations,
          stage: data.stage
        }])
        .select()
        .single();

      if (error) throw error;

      // Add initial history
      await supabase.from('client_history').insert([{
        client_id: newClient.id,
        action: 'Cliente criado',
        user_name: userName
      }]);

      await refreshClients();
      return newClient;
    } catch (e) {
      console.error('Erro ao adicionar cliente:', e);
      return null;
    }
  }, [userName, refreshClients]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    try {
      const updatePayload: any = { ...data };
      if (data.grossIncome) updatePayload.gross_income = data.grossIncome;
      if (data.incomeType) updatePayload.income_type = data.incomeType;
      if (data.socialFactor) updatePayload.social_factor = data.socialFactor;
      if (data.regionOfInterest) updatePayload.region_of_interest = data.regionOfInterest;
      if (data.intendedValue) updatePayload.intended_value = data.intendedValue;

      // Clean up frontend-only keys
      delete updatePayload.history;
      delete updatePayload.documents;
      delete updatePayload.grossIncome;
      delete updatePayload.incomeType;
      delete updatePayload.socialFactor;
      delete updatePayload.regionOfInterest;
      delete updatePayload.intendedValue;

      const { error } = await supabase
        .from('clients')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      if (data.stage) {
        await supabase.from('client_history').insert([{
          client_id: id,
          action: `Estágio alterado para ${data.stage}`,
          user_name: userName
        }]);
      }

      await refreshClients();
    } catch (e) {
      console.error('Erro ao atualizar cliente:', e);
    }
  }, [userName, refreshClients]);

  const deleteClient = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refreshClients();
    } catch (e) {
      console.error('Erro ao deletar cliente:', e);
    }
  }, [refreshClients]);

  const getClient = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, file, { upsert: true });

      if (error) throw error;
      return data.path;
    } catch (e) {
      console.error('Erro no upload:', e);
      return null;
    }
  };

  const addDocumentToClient = async (clientId: string, name: string, path: string) => {
    try {
      const { error } = await supabase.from('client_documents').insert([{
        client_id: clientId,
        name,
        file_path: path
      }]);
      if (error) throw error;
      await refreshClients();
    } catch (e) {
      console.error('Erro ao adicionar documento:', e);
    }
  };

  return (
    <AppContext.Provider value={{
      session,
      user,
      profile,
      userName,
      userRole,
      signOut,
      clients,
      loading,
      addClient,
      updateClient,
      deleteClient,
      getClient,
      refreshClients,
      leads,
      refreshLeads,
      uploadFile,
      addDocumentToClient,
      getDownloadUrl: async (path: string) => {
        const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 60);
        if (error) {
          console.error('Erro ao gerar link:', error);
          return null;
        }
        return data.signedUrl;
      }
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
