import { useState, useEffect } from 'react';
import { PremiumCard, SectionHeader, RoundedButton } from '@/components/ui/PremiumComponents';
import { Moon, Sun, Shield, Key, Bell, User, ChevronRight, LogOut, Smartphone, Camera, Trash2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';

export default function Settings() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [userEmail, setUserEmail] = useState('corretor@luxbroker.com');
  
  // Profile State
  const [userProfile, setUserProfile] = useState({
    name: 'Corretor LuxBroker',
    role: 'Corretor Senior',
    cpf: '123.456.789-00',
    avatar: ''
  });

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [editProfileData, setEditProfileData] = useState(userProfile);
  const [emailData, setEmailData] = useState({ current: '', new: '', confirm: '' });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    // Check initial dark mode state
    const isDark = document.documentElement.classList.contains('dark') || 
                  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    
    // Check 2FA state (mock)
    const twoFactor = localStorage.getItem('2fa_enabled') === 'true';
    setIs2FAEnabled(twoFactor);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggle2FA = () => {
    const newState = !is2FAEnabled;
    setIs2FAEnabled(newState);
    localStorage.setItem('2fa_enabled', String(newState));
    
    if (newState) {
      alert('Autenticação de dois fatores ativada! Na próxima vez que entrar, solicitaremos um código.');
    } else {
      alert('Autenticação de dois fatores desativada.');
    }
  };

  const handleOpenProfileModal = () => {
    setEditProfileData(userProfile);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = () => {
    setUserProfile(editProfileData);
    setIsProfileModalOpen(false);
    alert('Perfil atualizado com sucesso!');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProfileData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProfile = () => {
    if (confirm('Tem certeza que deseja excluir seu perfil? Esta ação não pode ser desfeita.')) {
      // Mock deletion
      alert('Perfil excluído.');
      navigate('/onboarding');
    }
  };

  const handleUpdateEmail = () => {
    const { current, new: newEmail, confirm } = emailData;

    if (!current || !newEmail || !confirm) {
      alert('Preencha todos os campos.');
      return;
    }

    if (current !== userEmail) {
      alert('O email atual está incorreto.');
      return;
    }

    if (newEmail !== confirm) {
      alert('Os novos emails não coincidem.');
      return;
    }

    if (!newEmail.includes('@')) {
      alert('Por favor, insira um email válido.');
      return;
    }

    setUserEmail(newEmail);
    setIsEmailModalOpen(false);
    setEmailData({ current: '', new: '', confirm: '' });
    alert('Email atualizado com sucesso!');
  };

  const handleUpdatePassword = () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      alert('Preencha todos os campos.');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      alert('As novas senhas não coincidem.');
      return;
    }
    
    // Mock API call
    setIsPasswordModalOpen(false);
    setPasswordData({ current: '', new: '', confirm: '' });
    alert('Senha alterada com sucesso!');
  };

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      navigate('/login');
    }
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-surface-50">
      <SectionHeader title="Configurações" subtitle="Preferências e Segurança" />

      <div className="space-y-6">
        {/* Profile Section */}
        <PremiumCard 
          className="flex items-center gap-4 cursor-pointer hover:bg-surface-100 transition-colors group"
          onClick={handleOpenProfileModal}
        >
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center text-gold-500 overflow-hidden border-2 border-transparent group-hover:border-gold-200 transition-colors">
            {userProfile.avatar ? (
              <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={32} />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-text-primary text-lg">{userProfile.name}</h3>
            <p className="text-sm text-text-secondary">{userProfile.role}</p>
          </div>
          <ChevronRight className="text-text-secondary group-hover:text-gold-500 transition-colors" />
        </PremiumCard>

        {/* Appearance */}
        <section>
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 ml-1">Aparência</h3>
          <PremiumCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-text-primary">
                  {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <p className="font-medium text-text-primary">Modo Escuro</p>
                  <p className="text-xs text-text-secondary">Ajustar aparência do app</p>
                </div>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-gold-500' : 'bg-surface-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isDarkMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </PremiumCard>
        </section>

        {/* Security */}
        <section>
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 ml-1">Segurança</h3>
          <PremiumCard className="space-y-6">
            <button 
              onClick={() => {
                setEmailData({ current: '', new: '', confirm: '' });
                setIsEmailModalOpen(true);
              }}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-text-primary">
                  <Smartphone size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary group-hover:text-gold-600 transition-colors">Alterar Email</p>
                  <p className="text-xs text-text-secondary">{userEmail}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-text-secondary group-hover:text-gold-600 transition-colors" />
            </button>

            <div className="w-full h-px bg-surface-100" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-text-primary">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Autenticação em 2 Fatores</p>
                  <p className="text-xs text-text-secondary">Camada extra de segurança</p>
                </div>
              </div>
              <button 
                onClick={toggle2FA}
                className={`w-12 h-6 rounded-full transition-colors relative ${is2FAEnabled ? 'bg-gold-500' : 'bg-surface-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${is2FAEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="w-full h-px bg-surface-100" />

            <button onClick={() => setIsPasswordModalOpen(true)} className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-text-primary">
                  <Key size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary group-hover:text-gold-600 transition-colors">Alterar Senha</p>
                  <p className="text-xs text-text-secondary">Atualize sua senha de acesso</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-text-secondary group-hover:text-gold-600 transition-colors" />
            </button>
          </PremiumCard>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 ml-1">Notificações</h3>
          <PremiumCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-text-primary">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Notificações Push</p>
                  <p className="text-xs text-text-secondary">Receba alertas importantes</p>
                </div>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-gold-500' : 'bg-surface-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notifications ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </PremiumCard>
        </section>

        <RoundedButton 
          variant="outline" 
          fullWidth 
          className="border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mt-8"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" /> Sair da Conta
        </RoundedButton>

        <p className="text-center text-xs text-text-secondary pt-4">
          LuxBroker CRM v1.0.0
        </p>
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Editar Perfil"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-24 h-24 rounded-full bg-surface-100 flex items-center justify-center text-gold-500 overflow-hidden border-4 border-surface-50 shadow-lg">
              {editProfileData.avatar ? (
                <img src={editProfileData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} />
              )}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={24} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="flex gap-2">
              <label className="text-xs font-medium text-gold-600 dark:text-gold-400 cursor-pointer hover:underline">
                Alterar Foto
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
              {editProfileData.avatar && (
                <>
                  <span className="text-text-secondary text-xs">•</span>
                  <button 
                    onClick={() => setEditProfileData(prev => ({ ...prev, avatar: '' }))}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Nome Completo</label>
              <input 
                value={editProfileData.name}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Cargo (Role)</label>
              <div className="w-full p-3 bg-surface-100 rounded-xl text-text-secondary flex items-center gap-2 cursor-not-allowed">
                <Shield size={16} />
                {editProfileData.role}
              </div>
              <p className="text-[10px] text-text-secondary mt-1 ml-1">O cargo é definido pelo administrador.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">CPF</label>
              <input 
                value={editProfileData.cpf}
                onChange={(e) => setEditProfileData(prev => ({ ...prev, cpf: e.target.value }))}
                className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <RoundedButton fullWidth onClick={handleSaveProfile}>
              Salvar Alterações
            </RoundedButton>
            
            <button 
              onClick={handleDeleteProfile}
              className="w-full py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Excluir Perfil
            </button>
          </div>
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Editar Email"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email Atual</label>
            <input 
              type="email"
              value={emailData.current}
              onChange={(e) => setEmailData(prev => ({ ...prev, current: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Novo Email</label>
            <input 
              type="email"
              value={emailData.new}
              onChange={(e) => setEmailData(prev => ({ ...prev, new: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="novo@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Confirmar Novo Email</label>
            <input 
              type="email"
              value={emailData.confirm}
              onChange={(e) => setEmailData(prev => ({ ...prev, confirm: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
              placeholder="novo@email.com"
            />
          </div>
          <RoundedButton fullWidth onClick={handleUpdateEmail}>
            Salvar
          </RoundedButton>
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Alterar Senha"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Senha Atual</label>
            <input 
              type="password"
              value={passwordData.current}
              onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nova Senha</label>
            <input 
              type="password"
              value={passwordData.new}
              onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Confirmar Nova Senha</label>
            <input 
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
              className="w-full p-3 bg-surface-50 rounded-xl border-none focus:ring-2 focus:ring-gold-200 dark:focus:ring-gold-800 text-text-primary"
            />
          </div>
          <RoundedButton fullWidth onClick={handleUpdatePassword}>
            Atualizar Senha
          </RoundedButton>
        </div>
      </Modal>
    </div>
  );
}
