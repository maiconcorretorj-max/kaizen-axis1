import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical } from 'lucide-react';
import { MOCK_USERS, MOCK_CONVERSATIONS } from '@/data/chat';

export default function Chat() {
  const navigate = useNavigate();

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
      <div className="px-6 py-2 bg-card-bg pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar conversas..." 
            className="w-full pl-10 pr-4 py-2 bg-surface-50 rounded-xl text-sm text-text-primary focus:outline-none placeholder:text-text-secondary"
          />
        </div>
      </div>

      {/* Online Users List */}
      <div className="bg-card-bg pb-4 px-6 border-b border-surface-200">
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Online Agora</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {MOCK_USERS.map((user) => (
            <div key={user.id} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate(`/chat/${user.id}`)}>
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-surface-100" 
                  referrerPolicy="no-referrer" 
                />
                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-card-bg rounded-full ${
                  user.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              <span className="text-[10px] font-medium text-text-primary truncate w-14 text-center">
                {user.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {MOCK_CONVERSATIONS.map((chat) => {
          const user = MOCK_USERS.find(u => u.id === chat.userId);
          if (!user) return null;

          return (
            <div 
              key={chat.id} 
              onClick={() => navigate(`/chat/${user.id}`)}
              className="flex items-center gap-4 p-3 hover:bg-card-bg rounded-xl transition-colors cursor-pointer"
            >
              <div className="relative">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                {chat.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-surface-50">
                    {chat.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-text-primary truncate">{user.name}</h3>
                  <span className="text-xs text-text-secondary">{chat.lastMessageTime}</span>
                </div>
                <p className={`text-sm truncate ${chat.unread > 0 ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
