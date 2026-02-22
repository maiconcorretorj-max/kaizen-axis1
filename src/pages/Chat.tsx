import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Bot } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Chat() {
  const navigate = useNavigate();
  const { allProfiles, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const myId = user?.id;

  // Filter out the current user from the list
  const teamMembers = useMemo(() => {
    return (allProfiles || []).filter(p => p.id !== myId);
  }, [allProfiles, myId]);

  const filtered = teamMembers.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-surface-50 pb-20">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 bg-card-bg shadow-sm z-10 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Mensagens</h1>
        <button className="text-text-secondary hover:text-text-primary">
          <MoreVertical size={24} />
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-2 bg-card-bg pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-50 rounded-xl text-sm text-text-primary focus:outline-none placeholder:text-text-secondary"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">

        {/* KAI Agent - Always first */}
        <div
          onClick={() => navigate('/chat/kai-agent')}
          className="flex items-center gap-4 p-3 hover:bg-card-bg rounded-xl transition-colors cursor-pointer"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-md">
              <Bot className="text-white" size={24} />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-surface-50 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="font-semibold text-text-primary">KAI — Assistente IA</h3>
              <span className="text-xs text-gold-500 font-medium">IA</span>
            </div>
            <p className="text-sm truncate text-text-secondary">
              Especialista em financiamento imobiliário
            </p>
          </div>
        </div>

        {/* Team Members */}
        {filtered.length === 0 && searchTerm === '' && (
          <div className="flex flex-col items-center py-12 text-text-secondary text-sm">
            <p>Nenhum colega encontrado.</p>
            <p className="text-xs mt-1 opacity-60">Os membros da equipe aparecerão aqui.</p>
          </div>
        )}

        {filtered.map((member) => {
          const initials = (member.name || '?')
            .split(' ')
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
            <div
              key={member.id}
              onClick={() => navigate(`/chat/${member.id}`)}
              className="flex items-center gap-4 p-3 hover:bg-card-bg rounded-xl transition-colors cursor-pointer"
            >
              <div className="relative">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {initials}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface-50 rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-text-primary truncate">{member.name}</h3>
                </div>
                <p className="text-sm text-text-secondary truncate capitalize">
                  {member.role || 'Membro da equipe'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
